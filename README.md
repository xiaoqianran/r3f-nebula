# Nebula 星云漫游

[![GitHub Actions](https://img.shields.io/badge/CI-GitHub%20Actions-2ea44f?logo=github)](.github/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/Pages-Live-6ea8ff?logo=githubpages)](https://xiaoqianran.github.io/r3f-nebula/)
[![License: MIT](https://img.shields.io/badge/License-MIT-6ea8ff)](LICENSE)

基于 **React + Three.js（React Three Fiber）** 的交互式 3D 星系 Demo。程序化生成螺旋星系粒子，配合轨道行星与实时参数控制台。

## 功能特性

- 🌀 **程序化螺旋星系**：默认 9 万粒子，GLSL 顶点着色器实时驱动旋涡动画（additive 混合 + 软边缘光点）
- 🪐 **轨道行星 + 相机聚焦**：四颗行星沿轨道公转（气态巨行星带冰粒光环），点击后相机平滑飞近并跟随，Esc / 关闭卡片返回总览
- 🎛 **实时控制台**：粒子数量 / 大小 / 旋臂 / 扭曲 / 扩散 / 速度 / 双色渐变，参数即时生效（结构性参数自动防抖）
- 🎨 **预设风格 + 随机生成**：经典旋涡 / 烈焰双螺旋 / 多臂蓝星 / 混沌星云，一键 🎲
- ✨ **Bloom 辉光后处理**（可开关）+ 背景星场 + 核心恒星脉动光晕
- 📊 **性能监视 + 自动降质**：实时 FPS / 粒子数显示；持续低帧率时自动降低采样并提示
- 💾 **设置持久化**：参数与开关自动保存到 localStorage，刷新后恢复
- 🎥 **轨道相机**：拖拽旋转、滚轮缩放、可选自动环绕（drei `OrbitControls`）
- 📸 **一键 PNG 截图** + 快捷键：`Space` 环绕 / `S` 截图 / `R` 重置 / `Esc` 返回总览
- 📱 移动端适配的 UI 布局

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
├── App.tsx                 # 应用外壳：状态管理 + 快捷键 + 截图 + 持久化
├── main.tsx                # 入口
├── styles.css              # 玻璃拟态 UI 样式
├── types.ts                # 类型、默认值、预设、随机与持久化
├── lib/
│   └── galaxy.ts           # 程序化生成星系几何体（position/color/aScale/aRandomness）
└── components/
    ├── Scene.tsx           # R3F Canvas：相机、灯光、星场、行星、CameraRig、PerfMonitor、Bloom
    ├── Galaxy.tsx          # 粒子星系（自定义 ShaderMaterial + 几何体热替换）
    └── ControlPanel.tsx    # 参数面板（预设 / 滑杆 / 颜色 / 开关）
```

## 实现原理速览

- **粒子分布**：`半径 = inner + √rand × (outer − inner)`（内密外疏），叠加旋臂角 `i % branches` 与螺旋角 `radius × spin`，再按幂次 `radius^randomnessPower` 施加随机扰动，得到真实的旋臂形态。
- **颜色**：随半径由内向外 `lerpColors(insideColor, outsideColor)`，逐顶点写入 `color` 属性，着色器中通过 `vColor` 传递。
- **动画**：顶点着色器里以到中心的距离为相位叠加 `sin/cos` 位移形成旋涡；`gl_PointSize` 按 `1 / 距离` 做透视缩放。时间、速度、尺寸均走 uniform，**无需重建几何体即可实时调节**。
- **几何体热替换**：结构性参数（数量/旋臂/扭曲/扩散/颜色）变化时防抖 180ms 后 `useMemo` 重建 `BufferGeometry`，旧几何体在 effect 清理阶段 `dispose()` 释放 GPU 资源；大小/速度则直接更新 uniform。
- **相机聚焦（CameraRig）**：行星 mesh 注册进共享 Map，聚焦时对 `OrbitControls.target` 做强 lerp 锁定 + 对相机距离做指数缓动，1.4s 内收敛到合适观察距离；解除后飞回总览位。
- **自动降质（PerfMonitor）**：每 0.5s 统计一次 FPS；连续约 3s 低于 25fps 时调用 `setDpr(1)` 降低采样率并在 HUD 提示“性能模式”。
- **设置持久化**：参数与开关防抖 300ms 写入 localStorage（带版本 key 与默认值兜底），启动时 `loadSettings()` 恢复。

## 自定义

- 调 `src/types.ts` 的 `DEFAULT_GALAXY` 更换默认星系形态。
- 改 `src/components/Galaxy.tsx` 里的两个 GLSL 着色器可做出更夸张的动画效果。
- 在 `PLANETS` 数组里增删行星即可（加 `ring: true` 可获得光环），场景与 UI 会自动跟进。
