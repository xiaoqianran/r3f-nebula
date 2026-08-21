import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'
import { orbitStats } from './lib/orbit'
import {
  DEFAULT_GALAXY,
  DEFAULT_SIZE,
  DEFAULT_SPEED,
  loadSettings,
  saveSettings,
  randomGalaxyConfig,
  type GalaxyParams,
  type PlanetDef,
  type Preset,
} from './types'

export default function App() {
  // 从 localStorage 恢复上次的设置
  const persisted = useMemo(loadSettings, [])

  const [galaxy, setGalaxy] = useState<GalaxyParams>(persisted?.galaxy ?? DEFAULT_GALAXY)
  const [size, setSize] = useState(persisted?.size ?? DEFAULT_SIZE)
  const [speed, setSpeed] = useState(persisted?.speed ?? DEFAULT_SPEED)
  const [timeScale, setTimeScale] = useState(persisted?.timeScale ?? 1)
  const [differ, setDiffer] = useState(persisted?.differ ?? true)
  const [autoRotate, setAutoRotate] = useState(persisted?.autoRotate ?? true)
  const [showOrbits, setShowOrbits] = useState(persisted?.showOrbits ?? true)
  const [bloom, setBloom] = useState(persisted?.bloom ?? true)
  const [collapsed, setCollapsed] = useState(false)
  const [selected, setSelected] = useState<PlanetDef | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [showHud, setShowHud] = useState(true)
  const [fps, setFps] = useState(0)
  const [autoQuality, setAutoQuality] = useState(false)
  const glRef = useRef<THREE.WebGLRenderer | null>(null)

  // 结构性参数防抖：滑杆拖动时不频繁重建几何体
  const [applied, setApplied] = useState<GalaxyParams>(persisted?.galaxy ?? DEFAULT_GALAXY)
  useEffect(() => {
    const t = setTimeout(() => setApplied(galaxy), 180)
    return () => clearTimeout(t)
  }, [galaxy])

  // 设置持久化：防抖写入 localStorage
  useEffect(() => {
    const t = setTimeout(() => {
      saveSettings({ galaxy: applied, size, speed, timeScale, differ, autoRotate, showOrbits, bloom })
    }, 300)
    return () => clearTimeout(t)
  }, [applied, size, speed, timeScale, differ, autoRotate, showOrbits, bloom])

  const handleGalaxyChange = useCallback((patch: Partial<GalaxyParams>) => {
    setGalaxy((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleReset = useCallback(() => {
    setGalaxy(DEFAULT_GALAXY)
    setSize(DEFAULT_SIZE)
    setSpeed(DEFAULT_SPEED)
    setTimeScale(1)
    setDiffer(true)
    setSelected(null)
    setFocusId(null)
  }, [])

  const applyPreset = useCallback((p: Preset) => {
    setGalaxy({ ...DEFAULT_GALAXY, ...p.params })
    setSize(p.size)
    setSpeed(p.speed)
  }, [])

  const handleRandom = useCallback(() => {
    const cfg = randomGalaxyConfig()
    setGalaxy(cfg.galaxy)
    setSize(cfg.size)
    setSpeed(cfg.speed)
  }, [])

  const takeScreenshot = useCallback(() => {
    const gl = glRef.current
    if (!gl) return
    const a = document.createElement('a')
    a.href = gl.domElement.toDataURL('image/png')
    a.download = `nebula-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`
    a.click()
  }, [])

  const selectPlanet = useCallback((p: PlanetDef) => {
    setSelected(p)
    setFocusId(p.id)
  }, [])

  const exitFocus = useCallback(() => {
    setSelected(null)
    setFocusId(null)
  }, [])

  const handleFps = useCallback((v: number) => setFps(v), [])
  const handleLowPerf = useCallback(() => setAutoQuality(true), [])

  // 快捷键：Space 环绕 / S 截图 / R 重置 / Esc 返回总览
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.repeat) return
      if (e.code === 'Space') {
        e.preventDefault()
        setAutoRotate((v) => !v)
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset()
      } else if (e.key === 's' || e.key === 'S') {
        takeScreenshot()
      } else if (e.key === 'Escape') {
        exitFocus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleReset, takeScreenshot, exitFocus])

  return (
    <div className="app">
      <Scene
        galaxy={applied}
        size={size}
        speed={speed}
        timeScale={timeScale}
        differ={differ ? 1 : 0}
        autoRotate={autoRotate}
        showOrbits={showOrbits}
        bloom={bloom}
        focusId={focusId}
        onGlReady={(gl) => {
          glRef.current = gl
        }}
        onFps={handleFps}
        onLowPerf={handleLowPerf}
        onSelectPlanet={selectPlanet}
      />

      <header className="title">
        <h1>
          <em>NEBULA</em> 星云漫游
        </h1>
        <p>开普勒轨道 · 差速旋转 · React + Three.js</p>
      </header>

      {showHud && (
        <div className="hud">
          <span className="hud-fps">FPS {Math.round(fps)}</span>
          <span>{(applied.count / 1000).toFixed(0)}k 粒子</span>
          <span>μ=16 · 两体开普勒</span>
          {autoQuality && <span className="hud-warn">性能模式</span>}
        </div>
      )}

      <ControlPanel
        galaxy={galaxy}
        onGalaxyChange={handleGalaxyChange}
        size={size}
        onSizeChange={setSize}
        speed={speed}
        onSpeedChange={setSpeed}
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
        differ={differ}
        onDifferChange={setDiffer}
        autoRotate={autoRotate}
        onAutoRotateChange={setAutoRotate}
        showOrbits={showOrbits}
        onShowOrbitsChange={setShowOrbits}
        bloom={bloom}
        onBloomChange={setBloom}
        showHud={showHud}
        onShowHudChange={setShowHud}
        onPreset={applyPreset}
        onRandom={handleRandom}
        onScreenshot={takeScreenshot}
        onReset={handleReset}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {selected && (() => {
        const s = orbitStats(selected)
        return (
          <section className="planet-card">
            <span
              className="planet-dot"
              style={{ background: selected.color, boxShadow: `0 0 18px ${selected.color}` }}
            />
            <div className="planet-card-text">
              <h3>{selected.name}</h3>
              <p>{selected.desc}</p>
              <div className="orbit-stats">
                <span>周期 <b>{s.period.toFixed(1)} s</b></span>
                <span>半长轴 <b>{selected.a.toFixed(1)} AU</b></span>
                <span>偏心率 <b>{selected.e.toFixed(2)}</b></span>
                <span>倾角 <b>{s.inclinationDeg.toFixed(1)}°</b></span>
                <span>近日点 <b>{s.perihelion.toFixed(1)} AU</b></span>
                <span>远日点 <b>{s.aphelion.toFixed(1)} AU</b></span>
              </div>
              <p className="planet-card-sub">实时距离 / 速度见 3D 标签 · 按 Esc 返回总览</p>
            </div>
            <button className="icon-btn" onClick={exitFocus} aria-label="关闭并返回总览">
              ×
            </button>
          </section>
        )
      })()}

      <footer className="hint">
        拖拽旋转 · 滚轮缩放 · 点击行星聚焦 · 拉高时间流速看开普勒第三定律 · Esc 返回
      </footer>

      <div className="fade-in" aria-hidden="true" />
    </div>
  )
}
