# Nebula 星云漫游

基于 **React + Three.js（React Three Fiber）** 的交互式 3D 星系 Demo。程序化生成螺旋星系粒子，配合轨道行星与实时参数控制台。

## 功能特性

- 🌀 **程序化螺旋星系**：默认 9 万粒子，GLSL 顶点着色器实时驱动旋涡动画（additive 混合 + 软边缘光点）
- 🪐 **轨道行星**：四颗行星沿轨道公转，点击可查看资料卡片
- 🎛 **实时控制台**：粒子数量 / 大小 / 旋臂数 / 螺旋扭曲 / 随机扩散 / 动态速度 / 双色渐变，参数即时生效
- 🎥 **轨道相机**：拖拽旋转、滚轮缩放、可选自动环绕（drei `OrbitControls`）
- ✨ **背景星场** + 核心恒星脉动光晕
- 📱 移动端适配的 UI 布局

## 技术栈

- React 18 + TypeScript
- Vite 5
- three / @react-three/fiber / @react-three/drei

## 快速开始

```bash
npm install
npm run dev       # 本地开发，默认 http://localhost:5173
npm run build     # 类型检查 + 构建，产物在 dist/
npm run preview   # 预览构建产物
```

## 目录结构

```
src/
├── App.tsx                 # 应用外壳：状态管理 + UI 布局
├── main.tsx                # 入口
├── styles.css              # 玻璃拟态 UI 样式
├── types.ts                # GalaxyParams / PlanetDef 类型与默认值
├── lib/
│   └── galaxy.ts           # 程序化生成星系几何体（position/color/aScale/aRandomness）
└── components/
    ├── Scene.tsx           # R3F Canvas：相机、灯光、星场、行星、轨道线
    ├── Galaxy.tsx          # 粒子星系（自定义 ShaderMaterial + 几何体热替换）
    └── ControlPanel.tsx    # 参数面板（滑杆 / 颜色 / 开关）
```

## 实现原理速览

- **粒子分布**：`半径 = inner + √rand × (outer − inner)`（内密外疏），叠加旋臂角 `i % branches` 与螺旋角 `radius × spin`，再按幂次 `radius^randomnessPower` 施加随机扰动，得到真实的旋臂形态。
- **颜色**：随半径由内向外 `lerpColors(insideColor, outsideColor)`，逐顶点写入 `color` 属性，着色器中通过 `vColor` 传递。
- **动画**：顶点着色器里以到中心的距离为相位叠加 `sin/cos` 位移形成旋涡；`gl_PointSize` 按 `1 / 距离` 做透视缩放。时间、速度、尺寸均走 uniform，**无需重建几何体即可实时调节**。
- **几何体热替换**：结构性参数（数量/旋臂/扭曲/扩散/颜色）变化时 `useMemo` 重建 `BufferGeometry`，旧几何体在 effect 清理阶段 `dispose()` 释放 GPU 资源；大小/速度则直接更新 uniform。

## 自定义

- 调 `src/types.ts` 的 `DEFAULT_GALAXY` 更换默认星系形态。
- 改 `src/components/Galaxy.tsx` 里的两个 GLSL 着色器可做出更夸张的动画效果。
- 在 `PLANETS` 数组里增删行星即可，场景与 UI 会自动跟进。
