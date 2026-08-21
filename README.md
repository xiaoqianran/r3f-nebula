# Nebula 星云漫游

[![GitHub Actions](https://img.shields.io/badge/CI-GitHub%20Actions-2ea44f?logo=github)](.github/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/Pages-Live-6ea8ff?logo=githubpages)](https://xiaoqianran.github.io/r3f-nebula/)
[![License: MIT](https://img.shields.io/badge/License-MIT-6ea8ff)](LICENSE)

基于 **React + Three.js（React Three Fiber）** 的交互式 3D 星系，**行星采用真实开普勒轨道力学**，星系盘具备**差速旋转**。

## 真实物理逻辑

行星不再是匀速圆周运动，而是**两体问题（点质量中心恒星）的精确解析解**：

- **开普勒第一定律**：轨道为椭圆，中心恒星位于一个焦点。行星由轨道根数 `(a, e, i, Ω, ω, M₀)` 描述，轨道线按根数采样绘制（含偏心率与倾角）。
- **开普勒第二定律**（面积速度守恒）：每帧解开普勒方程 `M = E − e·sinE`（牛顿迭代），位置随真实近/远点变化——**近日点快、远日点慢**。聚焦时 3D 标签用活力公式 `v = √(μ(2/r − 1/a))` 实时显示瞬时速度，可直观看到速度随 r 变化。
- **开普勒第三定律**：轨道周期 `T = 2π√(a³/μ)`，由半长轴决定。拉高「时间流速」可看到外行星明显更慢。
- **差速旋转**：星系粒子顶点着色器加入角速度 `∝ 1/√r` 的差速旋转——越靠内转得越快，符合真实旋盘的旋转曲线特征（可用面板开关）。

> 这是自洽的玩具模型（统一 `μ=16`、场景单位为“AU”），用于清晰演示开普勒定律；如需真实太阳系参数，改 `lib/orbit.ts` 的 `MU` 与各行星根数即可。

## 其他功能

- 🌀 **程序化螺旋星系**：默认 9 万粒子，GLSL 顶点着色器驱动旋涡动画（additive 混合 + 软边缘光点）
- 🪐 **轨道行星 + 相机聚焦**：点击行星相机平滑飞近并跟随其公转，Esc / 关闭卡片返回总览；气态巨行星带冰粒光环
- 🎛 **实时控制台**：粒子数量/大小/旋臂/扭曲/扩散/速度/双色渐变，结构性参数自动防抖
- 🎨 **预设风格 + 随机生成**：经典旋涡 / 烈焰双螺旋 / 多臂蓝星 / 混沌星云，一键 🎲
- ⏩ **时间流速**（0.1×–10×）：快进观察开普勒第三定律
- ✨ **Bloom 辉光**（可开关）+ 背景星场 + 核心恒星脉动光晕
- 📊 **性能监视 + 自动降质**：实时 FPS/粒子数；持续低帧率自动降采样
- 💾 **设置持久化**：参数与开关存入 localStorage，刷新恢复
- 🎥 **轨道相机**：拖拽旋转、滚轮缩放、可选自动环绕
- 📸 **一键 PNG 截图** + 快捷键：`Space` 环绕 / `S` 截图 / `R` 重置 / `Esc` 返回总览
- 📱 移动端适配 UI

## 技术栈

- React 18 + TypeScript
- Vite 5
- three / @react-three/fiber / @react-three/drei / @react-three/postprocessing

## 快速开始

```bash
npm install
npm run dev       # 本地开发，默认 http://localhost:5173
npm run build     # 类型检查 + 构建，产物在 dist/
npm run preview   # 预览构建产物
```

## 部署到 GitHub Pages

本项目内置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），**每次推送到 `main` 分支都会自动构建并部署**。

**首次使用需手动开启一次**（即“让 Pages 指向 Actions”）：

1. 进入仓库 **Settings → Pages**
2. **Build and deployment** → **Source** 选择 **GitHub Actions**
3. 保存

之后每次 push 到 `main`（或在 Actions 页手动运行 *Deploy to GitHub Pages*）即可自动更新站点：

```
https://<你的用户名>.github.io/r3f-nebula/
```

> 说明：`vite.config.ts` 里设置了 `base: './'`（相对路径），因此无需在构建时写死仓库名，产物即可在 Pages 的子路径下正常加载静态资源。

## 目录结构

```
src/
├── App.tsx                 # 应用外壳：状态 + 快捷键 + 截图 + 持久化 + 轨道参数卡
├── main.tsx                # 入口
├── styles.css              # 玻璃拟态 UI 样式
├── types.ts                # 类型、默认值、行星根数、预设、随机与持久化
├── lib/
│   ├── orbit.ts            # 开普勒两体轨道引擎（周期/方程/位置/速度/统计）
│   └── galaxy.ts           # 程序化生成星系几何体
└── components/
    ├── Scene.tsx           # R3F Canvas：SimClock/轨道线/开普勒行星/相机/性能/Bloom
    ├── Galaxy.tsx          # 粒子星系（差速旋转 + 旋涡着色器 + 几何体热替换）
    └── ControlPanel.tsx    # 参数面板（预设/滑杆/颜色/物理时间/开关）
```

## 物理实现要点

- **`lib/orbit.ts`**：`orbitalPeriod`(T=2π√(a³/μ)) → `meanMotion`(n=2π/T) → 每帧 `M = M₀ + n·t` → `solveKepler`(牛顿迭代求离心近点角 E) → 轨道面内坐标 → 经 `ω, i, Ω` 旋转到惯性系（Three.js Y 朝上，轨道面落在 XZ 平面）。
- **共享时钟（SimClock）**：所有行星读同一仿真时间，乘以「时间流速」实现统一快进，相对运动始终符合物理。
- **实时遥测**：仅对聚焦行星，在 `useFrame` 中直接写 DOM 文本（`r` 与 vis-viva 速度），避免每帧触发 React 重渲染。
- **几何体热替换**：结构性参数防抖 180ms 后重建 `BufferGeometry`，旧几何体在 effect 清理阶段 `dispose()`。

## 自定义

- 调 `src/types.ts` 的 `DEFAULT_GALAXY` 更换默认星系形态。
- 改 `lib/orbit.ts` 的 `MU` 与各行星轨道根数，可获得任意轨道（含真实太阳系尺度）。
- 在 `PLANETS` 数组里增删行星即可（`ring: true` 获得光环），场景与 UI 自动跟进。
