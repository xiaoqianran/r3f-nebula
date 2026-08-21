import * as THREE from 'three'

/** 中心天体的标准引力参数 μ = G·M（场景单位）。决定所有轨道的周期与速度。 */
export const MU = 16

/** 开普勒轨道根数（两体问题的六个独立常数） */
export interface OrbitElements {
  /** 半长轴 */
  a: number
  /** 偏心率（0 = 圆轨道） */
  e: number
  /** 轨道倾角 i（弧度） */
  inclination: number
  /** 升交点经度 Ω（弧度） */
  longitudeOfAscendingNode: number
  /** 近日点辐角 ω（弧度） */
  argumentOfPeriapsis: number
  /** 历元平近点角 M₀（弧度），决定初始相位 */
  meanAnomalyAtEpoch: number
}

/** 开普勒第三定律：轨道周期 T = 2π·√(a³/μ) */
export function orbitalPeriod(a: number, mu: number = MU): number {
  return 2 * Math.PI * Math.sqrt((a * a * a) / mu)
}

/** 平运动（平均角速度）n = 2π / T */
export function meanMotion(a: number, mu: number = MU): number {
  return 2 * Math.PI / orbitalPeriod(a, mu)
}

/**
 * 解开普勒方程 M = E − e·sinE（牛顿迭代）。
 * 归一化到 [-π, π] 可显著加快收敛，对任意偏心率都稳定。
 */
export function solveKepler(meanAnomaly: number, e: number): number {
  let M = meanAnomaly % (2 * Math.PI)
  if (M > Math.PI) M -= 2 * Math.PI
  else if (M < -Math.PI) M += 2 * Math.PI

  let E = e < 0.8 ? M : Math.sign(M || 1) * Math.PI
  for (let i = 0; i < 16; i++) {
    const f = E - e * Math.sin(E) - M
    const fp = 1 - e * Math.cos(E)
    const dE = f / fp
    E -= dE
    if (Math.abs(dE) < 1e-10) break
  }
  return E
}

/**
 * 两体问题精确解：给定轨道根数与自历元起经过的时间 t（秒），
 * 返回惯性系（Y 朝上、轨道面大致落在 XZ 平面）中的位置。
 *
 * 由此自然得到三条开普勒定律：
 *  - 第一定律：轨道为椭圆，中心天体在一个焦点上；
 *  - 第二定律：面积速度守恒 → 近日点快、远日点慢；
 *  - 第三定律：T² ∝ a³。
 */
export function positionAtTime(
  el: OrbitElements,
  t: number,
  out?: THREE.Vector3,
  mu: number = MU,
): THREE.Vector3 {
  const {
    a, e,
    inclination: inc,
    longitudeOfAscendingNode: Omega,
    argumentOfPeriapsis: w,
    meanAnomalyAtEpoch: M0,
  } = el

  const n = meanMotion(a, mu)
  const M = M0 + n * t
  const E = solveKepler(M, e)

  const cosE = Math.cos(E)
  const sinE = Math.sin(E)
  // 轨道面内坐标（以近日点为 x 轴）
  const xOrb = a * (cosE - e)
  const yOrb = a * Math.sqrt(1 - e * e) * sinE

  const cosw = Math.cos(w)
  const sinw = Math.sin(w)
  const cosO = Math.cos(Omega)
  const sinO = Math.sin(Omega)
  const cosi = Math.cos(inc)
  const sini = Math.sin(inc)

  // 平移到参考面（黄道）
  const xP = xOrb * cosw - yOrb * sinw
  const yP = xOrb * sinw + yOrb * cosw

  // 旋转到惯性系
  const x = cosO * xP - sinO * yP * cosi
  const y = sinO * xP + cosO * yP * cosi
  const z = yP * sini

  const v = out ?? new THREE.Vector3()
  // 惯性 (x, y) → Three (X, Z)，惯性 z（离面分量）→ Three Y
  v.set(x, z, -y)
  return v
}

/** 活力公式（vis-viva）：给定到中心距离 r 处的瞬时轨道速度 v = √(μ(2/r − 1/a)) */
export function speedAtRadius(r: number, a: number, mu: number = MU): number {
  const v2 = mu * (2 / r - 1 / a)
  return Math.sqrt(Math.max(0, v2))
}

/** 开普勒轨道的若干展示统计量 */
export function orbitStats(el: OrbitElements, mu: number = MU) {
  return {
    period: orbitalPeriod(el.a, mu),
    perihelion: el.a * (1 - el.e),
    aphelion: el.a * (1 + el.e),
    inclinationDeg: (el.inclination * 180) / Math.PI,
  }
}
