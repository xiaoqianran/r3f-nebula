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

/** 行星定义 */
export interface PlanetDef {
  id: string
  name: string
  desc: string
  orbitRadius: number
  size: number
  color: string
  /** 角速度（弧度/秒） */
  speed: number
  /** 初始相位（弧度） */
  offset: number
}

export const PLANETS: PlanetDef[] = [
  {
    id: 'linghu',
    name: '灵狐 · Linghu',
    desc: '最靠近核心恒星的炽热岩质行星，表面熔岩遍布，公转周期最短。',
    orbitRadius: 3.4,
    size: 0.17,
    color: '#fca5a5',
    speed: 0.55,
    offset: 0.6,
  },
  {
    id: 'yueying',
    name: '月萤 · Yueying',
    desc: '拥有冰蓝大气层的类地行星，云层间闪烁着永夜城市的微光。',
    orbitRadius: 5.8,
    size: 0.26,
    color: '#7dd3fc',
    speed: 0.38,
    offset: 2.4,
  },
  {
    id: 'jinshu',
    name: '金枢 · Jinshu',
    desc: '体积最大的气态巨行星，风暴带昼夜不息，光环由上亿颗冰粒构成。',
    orbitRadius: 8.6,
    size: 0.42,
    color: '#fde68a',
    speed: 0.24,
    offset: 4.2,
  },
  {
    id: 'xuanji',
    name: '玄机 · Xuanji',
    desc: '轨道最外侧的暗色冰巨星，极光在永夜的天幕上缓慢流动。',
    orbitRadius: 12.4,
    size: 0.3,
    color: '#c4b5fd',
    speed: 0.16,
    offset: 5.8,
  },
]
