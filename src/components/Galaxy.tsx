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
  uniform float uDiffer;

  varying vec3 vColor;

  attribute float aScale;
  attribute vec3 aRandomness;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // 开普勒差速旋转：角速度 ∝ 1/sqrt(r)，越靠内转得越快（真实旋盘的差速特征）
    float r = length(modelPosition.xz);
    if (uDiffer > 0.0001 && r > 0.001) {
      float ang = atan(modelPosition.z, modelPosition.x);
      ang += uTime * uDiffer * 0.5 / sqrt(r);
      modelPosition.x = cos(ang) * r;
      modelPosition.z = sin(ang) * r;
    }

    modelPosition.xyz += aRandomness;

    // 旋涡呼吸（保留原有动态）
    float d = length(modelPosition.xz);
    float swirl = uSpeed * 0.35;
    modelPosition.x += sin(uTime * 0.6 + d * 1.4) * swirl * 0.35;
    modelPosition.z += cos(uTime * 0.5 + d * 1.4) * swirl * 0.35;
    modelPosition.y += sin(uTime * 0.35 + d * 0.8) * swirl * 0.35;

    gl_Position = projectionMatrix * modelViewMatrix * modelPosition;
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
  /** 差速旋转强度（0 关 / 1 开） */
  differ: number
}

export default function Galaxy({ params, size, speed, differ }: GalaxyProps) {
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
          uDiffer: { value: differ },
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

  useEffect(() => {
    material.uniforms.uDiffer.value = differ
  }, [differ, material])

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta * (0.25 + 0.75 * material.uniforms.uSpeed.value)
    if (pointsRef.current) pointsRef.current.rotation.y += delta * 0.015
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
