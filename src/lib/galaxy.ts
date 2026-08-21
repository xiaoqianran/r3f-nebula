import * as THREE from 'three'
import type { GalaxyParams } from '../types'

/** 根据参数生成螺旋星系粒子几何体 */
export function createGalaxyGeometry(params: GalaxyParams): THREE.BufferGeometry {
  const {
    count,
    inner,
    outer,
    branches,
    spin,
    randomness,
    randomnessPower,
    insideColor,
    outsideColor,
  } = params

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const randomnessArr = new Float32Array(count * 3)

  const colorInside = new THREE.Color(insideColor)
  const colorOutside = new THREE.Color(outsideColor)
  const color = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    // 半径分布：sqrt 让内侧更密、外侧更稀
    const radius = inner + Math.sqrt(Math.random()) * (outer - inner)
    const branchAngle = ((i % branches) / branches) * Math.PI * 2
    const spinAngle = radius * spin

    // 随机扰动，随半径增大而扩散
    const rand = () =>
      (Math.random() < 0.5 ? 1 : -1) *
      Math.pow(Math.random(), randomnessPower) *
      randomness *
      radius
    const randX = rand()
    const randY = rand() * 0.45
    const randZ = rand()

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randX
    positions[i3 + 1] = randY
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randZ

    // 用于顶点着色器的微动动画
    randomnessArr[i3] = (Math.random() - 0.5) * 0.25
    randomnessArr[i3 + 1] = (Math.random() - 0.5) * 0.25
    randomnessArr[i3 + 2] = (Math.random() - 0.5) * 0.25

    // 随机缩放（让粒子大小有差异）
    scales[i] = 0.4 + Math.random() * 1.2

    // 颜色：由内向外渐变
    color.lerpColors(
      colorInside,
      colorOutside,
      Math.min(1, (radius - inner) / (outer - inner)),
    )
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessArr, 3))

  return geometry
}
