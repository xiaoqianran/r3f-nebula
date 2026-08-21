import { useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Galaxy from './Galaxy'
import { PLANETS, type GalaxyParams, type PlanetDef } from '../types'

interface SceneProps {
  galaxy: GalaxyParams
  size: number
  speed: number
  autoRotate: boolean
  showOrbits: boolean
  selectedId: string | null
  onSelectPlanet: (planet: PlanetDef) => void
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
        <meshBasicMaterial
          color="#fff3d8"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight color="#ffc38a" intensity={2.2} decay={0} />
    </group>
  )
}

/** 轨道行星 */
function Planet({
  def,
  selected,
  onSelect,
}: {
  def: PlanetDef
  selected: boolean
  onSelect: (p: PlanetDef) => void
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const angle = useRef(def.offset)

  useFrame((_, delta) => {
    if (!mesh.current) return
    angle.current += delta * def.speed
    mesh.current.position.set(
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
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'default')}
    >
      <sphereGeometry args={[def.size, 32, 32]} />
      <meshStandardMaterial
        color={def.color}
        emissive={def.color}
        emissiveIntensity={selected ? 1.1 : 0.25}
        roughness={0.35}
        metalness={0.15}
      />
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
  selectedId,
  onSelectPlanet,
}: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 9, 18], fov: 50, near: 0.1, far: 300 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#04050d']} />
      <fog attach="fog" args={['#04050d', 35, 110]} />
      <ambientLight intensity={0.45} />

      <Stars radius={80} depth={60} count={5000} factor={4} saturation={0} fade speed={0.6} />

      <Galaxy params={galaxy} size={size} speed={speed} />
      <Core />

      {showOrbits && PLANETS.map((p) => <OrbitRing key={p.id} def={p} />)}
      {PLANETS.map((p) => (
        <Planet key={p.id} def={p} selected={p.id === selectedId} onSelect={onSelectPlanet} />
      ))}

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={4}
        maxDistance={60}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI * 0.85}
      />
    </Canvas>
  )
}
