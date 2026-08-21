import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import Galaxy from './Galaxy'
import { MU, orbitalPeriod, positionAtTime, speedAtRadius, type OrbitElements } from '../lib/orbit'
import { PLANETS, type GalaxyParams, type PlanetDef } from '../types'

export type PlanetEntry = { mesh: THREE.Mesh; def: PlanetDef }
type Registry = MutableRefObject<Map<string, PlanetEntry>>
type TimeRef = MutableRefObject<{ t: number }>

interface SceneProps {
  galaxy: GalaxyParams
  size: number
  speed: number
  /** 时间流速（快进系数） */
  timeScale: number
  /** 星系差速旋转强度（0/1） */
  differ: number
  autoRotate: boolean
  showOrbits: boolean
  bloom: boolean
  focusId: string | null
  onGlReady: (gl: THREE.WebGLRenderer) => void
  onFps: (fps: number) => void
  onLowPerf: () => void
  onSelectPlanet: (planet: PlanetDef) => void
}

const HOME_POS = new THREE.Vector3(0, 9, 18)
const ORIGIN = new THREE.Vector3(0, 0, 0)
const _dir = new THREE.Vector3()

interface OrbitControlsLike {
  target: THREE.Vector3
}

/** 共享仿真时钟：所有行星共用同一时间轴，可快进 */
function SimClock({ timeRef, timeScale }: { timeRef: TimeRef; timeScale: number }) {
  useFrame((_, delta) => {
    timeRef.current.t += Math.min(delta, 0.1) * timeScale
  })
  return null
}

/** 相机调度：聚焦行星时平滑飞近并跟随，解除时飞回总览视角 */
function CameraRig({ focusId, registry }: { focusId: string | null; registry: Registry }) {
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsLike | null
  const camera = useThree((s) => s.camera)
  const focusClock = useRef(0)
  const homeClock = useRef(0)
  const prevFocus = useRef<string | null>(null)

  useEffect(() => {
    if (focusId === prevFocus.current) return
    prevFocus.current = focusId
    focusClock.current = 0
    homeClock.current = 0
  }, [focusId])

  useFrame((_, delta) => {
    if (!controls) return
    const d = Math.min(delta, 0.05) // 防止切后台回来时大跳变

    if (focusId) {
      const entry = registry.current.get(focusId)
      if (!entry) return
      const p = entry.mesh.position
      focusClock.current += d
      // 目标点强锁定，行星始终居中（仍可自由拖拽环绕）
      controls.target.lerp(p, 1 - Math.exp(-d * 10))
      // 前 ~1.4s 平滑调整到合适观察距离
      if (focusClock.current < 1.4) {
        const dist = camera.position.distanceTo(p)
        const desired = Math.max(2.5, entry.def.size * 9)
        if (Math.abs(dist - desired) > 0.05) {
          const newDist = THREE.MathUtils.lerp(dist, desired, 1 - Math.exp(-d * 3))
          _dir.copy(camera.position).sub(p).normalize().multiplyScalar(newDist)
          camera.position.copy(p).add(_dir)
        }
      }
    } else if (homeClock.current < 1.2) {
      homeClock.current += d
      const t = 1 - Math.exp(-d * 4)
      controls.target.lerp(ORIGIN, t)
      camera.position.lerp(HOME_POS, t)
    }
  })

  return null
}

/** 性能监视：每 0.5s 上报 FPS；持续低帧率时自动降低采样 */
function PerfMonitor({ onFps, onLowPerf }: { onFps: (fps: number) => void; onLowPerf: () => void }) {
  const setDpr = useThree((s) => s.setDpr)
  const acc = useRef({ frames: 0, time: 0, lowStreak: 0, fired: false })

  useFrame((_, delta) => {
    const a = acc.current
    a.frames += 1
    a.time += Math.min(delta, 0.1)
    if (a.time < 0.5) return
    const fps = a.frames / a.time
    a.frames = 0
    a.time = 0
    onFps(fps)
    if (a.fired) return
    if (fps < 25) {
      a.lowStreak += 1
      if (a.lowStreak >= 6) {
        a.fired = true
        setDpr(1)
        onLowPerf()
      }
    } else {
      a.lowStreak = 0
    }
  })

  return null
}

/** 按轨道根数采样，绘制真实椭圆轨道（含偏心率与倾角） */
function OrbitPath({ el, color }: { el: OrbitElements; color: string }) {
  const points = useMemo(() => {
    const T = orbitalPeriod(el.a, MU)
    const N = 220
    const arr: [number, number, number][] = []
    for (let i = 0; i <= N; i++) {
      const p = positionAtTime(el, (i / N) * T)
      arr.push([p.x, p.y, p.z])
    }
    return arr
  }, [el])

  return <Line points={points} color={color} lineWidth={1.1} transparent opacity={0.4} />
}

/** 核心恒星：脉动的光球 */
function Core() {
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.6) * 0.05)
  })

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color="#ff9a4d"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#fff3d8" blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color="#ffc38a" intensity={2.2} decay={0} />
    </group>
  )
}

/** 轨道行星：开普勒运动 + 悬浮标签（聚焦时含实时遥测）+ 点击聚焦 */
function Planet({
  def,
  isFocused,
  timeRef,
  registry,
  onSelect,
}: {
  def: PlanetDef
  isFocused: boolean
  timeRef: TimeRef
  registry: Registry
  onSelect: (p: PlanetDef) => void
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const liveRef = useRef<HTMLSpanElement>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (mesh.current) registry.current.set(def.id, { mesh: mesh.current, def })
    return () => {
      registry.current.delete(def.id)
    }
  }, [def, registry])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    // 两体问题精确解：椭圆轨道、近日快/远日慢、周期满足第三定律
    positionAtTime(def, timeRef.current.t, m.position)

    if (isFocused && liveRef.current) {
      const r = m.position.length()
      const v = speedAtRadius(r, def.a, MU)
      liveRef.current.textContent = `距星 ${r.toFixed(2)} AU · 速度 ${v.toFixed(3)} AU/s`
    }
  })

  return (
    <mesh
      ref={mesh}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(def)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      <sphereGeometry args={[def.size, 32, 32]} />
      <meshStandardMaterial
        color={def.color}
        emissive={def.color}
        emissiveIntensity={isFocused ? 1.1 : hovered ? 0.6 : 0.25}
        roughness={0.35}
        metalness={0.15}
      />
      {def.ring && (
        <mesh rotation={[Math.PI / 2.6, 0.3, 0]}>
          <ringGeometry args={[def.size * 1.45, def.size * 2.3, 64]} />
          <meshBasicMaterial
            color={def.color}
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
      {(hovered || isFocused) && (
        <Html
          center
          position={[0, def.size + 0.55, 0]}
          zIndexRange={[40, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="planet-tag">
            <span className="planet-tag-name" style={{ color: def.color }}>
              {def.name}
            </span>
            {isFocused && (
              <span className="planet-tag-live" ref={liveRef}>
                —
              </span>
            )}
          </div>
        </Html>
      )}
    </mesh>
  )
}

export default function Scene({
  galaxy,
  size,
  speed,
  timeScale,
  differ,
  autoRotate,
  showOrbits,
  bloom,
  focusId,
  onGlReady,
  onFps,
  onLowPerf,
  onSelectPlanet,
}: SceneProps) {
  const registry = useRef(new Map<string, PlanetEntry>())
  const timeRef = useRef({ t: 0 })

  return (
    <Canvas
      camera={{ position: [0, 9, 18], fov: 50, near: 0.1, far: 300 }}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        onGlReady(gl)
      }}
    >
      <color attach="background" args={['#04050d']} />
      <fog attach="fog" args={['#04050d', 35, 110]} />
      <ambientLight intensity={0.45} />

      {/* 共享时钟先于行星挂载，保证每帧先推进时间 */}
      <SimClock timeRef={timeRef} timeScale={timeScale} />
      <PerfMonitor onFps={onFps} onLowPerf={onLowPerf} />

      <Stars radius={80} depth={60} count={5000} factor={4} saturation={0} fade speed={0.6} />

      <Galaxy params={galaxy} size={size} speed={speed} differ={differ} />
      <Core />

      {showOrbits && PLANETS.map((p) => <OrbitPath key={p.id} el={p} color={p.color} />)}
      {PLANETS.map((p) => (
        <Planet
          key={p.id}
          def={p}
          isFocused={p.id === focusId}
          timeRef={timeRef}
          registry={registry}
          onSelect={onSelectPlanet}
        />
      ))}

      <CameraRig focusId={focusId} registry={registry} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={1.5}
        maxDistance={60}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI * 0.85}
      />

      {bloom && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.18} intensity={0.75} radius={0.7} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
