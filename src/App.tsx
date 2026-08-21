import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'
import {
  DEFAULT_GALAXY,
  randomGalaxyConfig,
  type GalaxyParams,
  type PlanetDef,
  type Preset,
} from './types'

const DEFAULT_SIZE = 60
const DEFAULT_SPEED = 1

export default function App() {
  const [galaxy, setGalaxy] = useState<GalaxyParams>(DEFAULT_GALAXY)
  const [size, setSize] = useState(DEFAULT_SIZE)
  const [speed, setSpeed] = useState(DEFAULT_SPEED)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showOrbits, setShowOrbits] = useState(true)
  const [bloom, setBloom] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [selected, setSelected] = useState<PlanetDef | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const glRef = useRef<THREE.WebGLRenderer | null>(null)

  // 结构性参数防抖：滑杆拖动时不频繁重建几何体
  const [applied, setApplied] = useState<GalaxyParams>(DEFAULT_GALAXY)
  useEffect(() => {
    const t = setTimeout(() => setApplied(galaxy), 180)
    return () => clearTimeout(t)
  }, [galaxy])

  const handleGalaxyChange = useCallback((patch: Partial<GalaxyParams>) => {
    setGalaxy((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleReset = useCallback(() => {
    setGalaxy(DEFAULT_GALAXY)
    setSize(DEFAULT_SIZE)
    setSpeed(DEFAULT_SPEED)
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
        autoRotate={autoRotate}
        showOrbits={showOrbits}
        bloom={bloom}
        focusId={focusId}
        selectedId={selected?.id ?? null}
        onGlReady={(gl) => {
          glRef.current = gl
        }}
        onSelectPlanet={selectPlanet}
      />

      <header className="title">
        <h1>
          <em>NEBULA</em> 星云漫游
        </h1>
        <p>React 18 · React Three Fiber · Three.js</p>
      </header>

      <ControlPanel
        galaxy={galaxy}
        onGalaxyChange={handleGalaxyChange}
        size={size}
        onSizeChange={setSize}
        speed={speed}
        onSpeedChange={setSpeed}
        autoRotate={autoRotate}
        onAutoRotateChange={setAutoRotate}
        showOrbits={showOrbits}
        onShowOrbitsChange={setShowOrbits}
        bloom={bloom}
        onBloomChange={setBloom}
        onPreset={applyPreset}
        onRandom={handleRandom}
        onScreenshot={takeScreenshot}
        onReset={handleReset}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {selected && (
        <section className="planet-card">
          <span
            className="planet-dot"
            style={{ background: selected.color, boxShadow: `0 0 18px ${selected.color}` }}
          />
          <div className="planet-card-text">
            <h3>{selected.name}</h3>
            <p>{selected.desc}</p>
            <p className="planet-card-sub">相机已跟随 · 按 Esc 或关闭返回总览</p>
          </div>
          <button className="icon-btn" onClick={exitFocus} aria-label="关闭并返回总览">
            ×
          </button>
        </section>
      )}

      <footer className="hint">
        拖拽旋转 · 滚轮缩放 · 点击行星聚焦 · Esc 返回 · Space 环绕 · S 截图 · R 重置
      </footer>
    </div>
  )
}
