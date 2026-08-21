import type { OrbitElements } from './lib/orbit'

/** 星云几何参数（改变时会重新生成粒子几何体） */
export interface GalaxyParams {
  /** 粒子数量 */
  count: number
  /** 内半径 */
  inner: number
  /** 外半径 */
  outer: number
  /** 旋臂数量 */
  branches: number
  /** 螺旋扭曲强度 */
  spin: number
  /** 随机扩散强度 */
  randomness: number
  /** 随机扩散衰减幂次 */
  randomnessPower: number
  /** 核心（内侧）颜色 */
  insideColor: string
  /** 边缘（外侧）颜色 */
  outsideColor: string
}

export const DEFAULT_GALAXY: GalaxyParams = {
  count: 90000,
  inner: 1.2,
  outer: 11,
  branches: 3,
  spin: 1.1,
  randomness: 0.32,
  randomnessPower: 2.7,
  insideColor: '#ff6030',
  outsideColor: '#2743d8',
}

export const DEFAULT_SIZE = 60
export const DEFAULT_SPEED = 1

/** 行星定义：继承开普勒轨道根数 + 展示属性 */
export interface PlanetDef extends OrbitElements {
  id: string
  name: string
  desc: string
  color: string
  size: number
  /** 是否带光环（气态巨行星） */
  ring?: boolean
}

export const PLANETS: PlanetDef[] = [
  {
    id: 'linghu',
    name: '灵狐 · Linghu',
    desc: '最靠近核心恒星的炽热岩质行星，公转最快——开普勒第三定律的直观体现。',
    color: '#fca5a5',
    size: 0.17,
    a: 3.4, e: 0.06, inclination: 0.04,
    longitudeOfAscendingNode: 0.0, argumentOfPeriapsis: 0.5, meanAnomalyAtEpoch: 0.6,
  },
  {
    id: 'yueying',
    name: '月萤 · Yueying',
    desc: '拥有冰蓝大气层的类地行星，轨道近乎正圆。',
    color: '#7dd3fc',
    size: 0.26,
    a: 5.8, e: 0.05, inclination: 0.03,
    longitudeOfAscendingNode: 0.9, argumentOfPeriapsis: 1.3, meanAnomalyAtEpoch: 2.4,
  },
  {
    id: 'jinshu',
    name: '金枢 · Jinshu',
    desc: '体积最大的气态巨行星，带冰粒光环；掠过近日点时明显加速（面积速度守恒）。',
    color: '#fde68a',
    size: 0.42,
    ring: true,
    a: 8.6, e: 0.12, inclination: 0.07,
    longitudeOfAscendingNode: 1.6, argumentOfPeriapsis: 2.1, meanAnomalyAtEpoch: 4.2,
  },
  {
    id: 'xuanji',
    name: '玄机 · Xuanji',
    desc: '轨道最外侧、偏心率最大的冰巨星——近日点与远日点的速度差最为剧烈。',
    color: '#c4b5fd',
    size: 0.3,
    a: 12.4, e: 0.19, inclination: 0.1,
    longitudeOfAscendingNode: 2.5, argumentOfPeriapsis: 0.8, meanAnomalyAtEpoch: 5.6,
  },
]

/** 预设风格：一键应用一组星系参数 */
export interface Preset {
  name: string
  params: Partial<GalaxyParams>
  size: number
  speed: number
}

export const PRESETS: Preset[] = [
  { name: '经典旋涡', params: {}, size: 60, speed: 1 },
  {
    name: '烈焰双螺旋',
    params: {
      branches: 2, spin: 1.6, randomness: 0.22, randomnessPower: 3,
      count: 110000, insideColor: '#ffd166', outsideColor: '#ef4444',
    },
    size: 70,
    speed: 1.3,
  },
  {
    name: '多臂蓝星',
    params: {
      branches: 5, spin: 0.7, randomness: 0.5, outer: 13,
      insideColor: '#fef08a', outsideColor: '#38bdf8',
    },
    size: 48,
    speed: 0.9,
  },
  {
    name: '混沌星云',
    params: {
      branches: 7, spin: 0.15, randomness: 0.85, randomnessPower: 1.6,
      outer: 14, count: 130000, insideColor: '#f472b6', outsideColor: '#6366f1',
    },
    size: 80,
    speed: 1.4,
  },
]

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/** 随机生成一组星系配置 */
export function randomGalaxyConfig(): { galaxy: GalaxyParams; size: number; speed: number } {
  const r = (a: number, b: number) => a + Math.random() * (b - a)
  const hex = () => hslToHex(Math.floor(r(0, 360)), Math.floor(r(55, 95)), Math.floor(r(45, 62)))
  return {
    galaxy: {
      count: Math.round(r(50000, 160000) / 5000) * 5000,
      inner: r(0.8, 2),
      outer: r(8, 15),
      branches: Math.floor(r(1, 8)),
      spin: r(0, 2),
      randomness: r(0.1, 0.8),
      randomnessPower: r(1.5, 3.5),
      insideColor: hex(),
      outsideColor: hex(),
    },
    size: Math.round(r(40, 100)),
    speed: Math.round(r(0.4, 1.6) * 10) / 10,
  }
}

/** 持久化设置 */
export interface PersistedSettings {
  galaxy: GalaxyParams
  size: number
  speed: number
  timeScale: number
  differ: boolean
  autoRotate: boolean
  showOrbits: boolean
  bloom: boolean
}

const STORAGE_KEY = 'nebula-settings-v1'

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

/** 读取持久化设置（带默认值兜底，兼容旧数据） */
export function loadSettings(): PersistedSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object' || !p.galaxy || typeof p.galaxy !== 'object') return null
    const g = p.galaxy as Partial<GalaxyParams>
    return {
      galaxy: {
        ...DEFAULT_GALAXY,
        ...g,
        count: clampNum(g.count, 10000, 200000, DEFAULT_GALAXY.count),
        branches: Math.round(clampNum(g.branches, 1, 8, DEFAULT_GALAXY.branches)),
      },
      size: clampNum(p.size, 10, 140, DEFAULT_SIZE),
      speed: clampNum(p.speed, 0, 3, DEFAULT_SPEED),
      timeScale: clampNum(p.timeScale, 0.1, 10, 1),
      differ: asBool(p.differ, true),
      autoRotate: asBool(p.autoRotate, true),
      showOrbits: asBool(p.showOrbits, true),
      bloom: asBool(p.bloom, true),
    }
  } catch {
    return null
  }
}

/** 保存持久化设置（存储不可用时静默忽略） */
export function saveSettings(s: PersistedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* 隐私模式等场景下忽略 */
  }
}
