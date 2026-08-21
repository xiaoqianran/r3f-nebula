import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { createGalaxyGeometry } from '../lib/galaxy'
import type { GalaxyParams } from '../types'

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uSpeed;

  varying vec3 vColor;

  attribute float aScale;
  attribute vec3 aRandomness;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float distanceFromCenter = length(modelPosition.xy);

    // 微粒抖动
    modelPosition.xyz += aRandomness;

    // 随时间起伏的旋涡
    float swirl = uSpeed * 0.4;
    modelPosition.x += sin(uTime * 0.6 + distanceFromCenter * 1.4) * swirl;
    modelPosition.z += cos(uTime * 0.5 + distanceFromCenter * 1.4) * swirl;
    modelPosition.y += sin(uTime * 0.35 + distanceFromCenter * 0.8) * swirl * 0.35;

    gl_Position = projectionMatrix * modelViewMatrix * modelPosition;

    // 距离透视缩放
    gl_PointSize = uSize * aScale * uPixelRatio;
    gl_PointSize *= (1.0 / -modelViewMatrix.z);

    vColor = color;
  }
`

const fragmentShader = /* glsl */ `
  precision mediump float;

  varying vec3 vColor;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float strength = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, strength * 0.85);
  }
`

interface GalaxyProps {
  params: GalaxyParams
  /** 粒子大小（uniform，实时生效） */
  size: number
  /** 动态速度（uniform，实时生效） */
  speed: number
}

export default function Galaxy({ params, size, speed }: GalaxyProps) {
  const pointsRef = useRef<THREE.Points>(null)

  // 参数变化时重新生成几何体
  const geometry = useMemo(() => createGalaxyGeometry(params), [params])

  // 材质只创建一次，动态参数走 uniform
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uSpeed: { value: speed },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
      }),
    // 首次挂载时的初始值
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // 几何体更换后释放旧的
  useEffect(() => () => geometry.dispose(), [geometry])
  // 卸载时释放材质
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    material.uniforms.uSize.value = size
  }, [size, material])

  useEffect(() => {
    material.uniforms.uSpeed.value = speed
  }, [speed, material])

  useFrame((_, delta) => {
    const u = material.uniforms
    u.uTime.value += delta * (0.25 + 0.75 * u.uSpeed.value)
    if (pointsRef.current) pointsRef.current.rotation.y += delta * 0.02
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  )
}
