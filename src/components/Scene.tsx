import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import Galaxy from './Galaxy'
import { PLANETS, type GalaxyParams, type PlanetDef } from '../types'

export type PlanetEntry = { mesh: THREE.Mesh; def: PlanetDef }
type Registry = MutableRefObject<Map<string, PlanetEntry>>

interface SceneProps {
  galaxy: GalaxyParams
  size: number
  speed: number
  autoRotate: boolean
  showOrbits: boolean
  bloom: boolean
  focusId: string | null
  selectedId: string | null
  onGlReady: (gl: THREE.WebGLRenderer) => void
  onSelectPlanet: (planet: PlanetDef) => void
}

const HOME_POS = new THREE.Vector3(0, 9, 18)
const ORIGIN = new THREE.Vector3(0, 0, 0)
const _dir = new THREE.Vector3()

interface OrbitControlsLike {
  target: THREE.Vector3
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
      // 目标点强锁定，行星始终居中
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

/** 轨道行星：公转 + 悬浮标签 + 点击聚焦 */
function Planet({
  def,
  selected,
  registry,
  onSelect,
}: {
  def: PlanetDef
  selected: boolean
  registry: Registry
  onSelect: (p: PlanetDef) => void
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const angle = useRef(def.offset)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (mesh.current) registry.current.set(def.id, { mesh: mesh.current, def })
    return () => {
      registry.current.delete(def.id)
    }
  }, [def, registry])

  useFrame((_, delta) => {
    const m = mesh.current
    if (!m) return
    angle.current += delta * def.speed
    m.position.set(
      Math.cos(angle.current) * def.orbitRadius,
      Math.sin(angle.current * 2.3) * 0.15,
      Math.sin(angle.current) * def.orbitRadius,
    )
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
        emissiveIntensity={selected ? 1.1 : hovered ? 0.6 : 0.25}
        roughness={0.35}
        metalness={0.15}
      />
      {(hovered || selected) && (
        <Html
          center
          position={[0, def.size + 0.45, 0]}
          zIndexRange={[40, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="planet-label">{def.name}</div>
        </Html>
      )}
    </mesh>
  )
}

/** 轨道线 */
function OrbitRing({ def }: { def: PlanetDef }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[def.orbitRadius - 0.015, def.orbitRadius + 0.015, 160]} />
      <meshBasicMaterial
        color={def.color}
        transparent
        opacity={0.22}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function Scene({
  galaxy,
  size,
  speed,
  autoRotate,
  showOrbits,
  bloom,
  focusId,
  selectedId,
  onGlReady,
  onSelectPlanet,
}: SceneProps) {
  const registry = useRef(new Map<string, PlanetEntry>())

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

      <Stars radius={80} depth={60} count={5000} factor={4} saturation={0} fade speed={0.6} />

      <Galaxy params={galaxy} size={size} speed={speed} />
      <Core />

      {showOrbits && PLANETS.map((p) => <OrbitRing key={p.id} def={p} />)}
      {PLANETS.map((p) => (
        <Planet
          key={p.id}
          def={p}
          selected={p.id === selectedId}
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
