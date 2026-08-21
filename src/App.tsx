import { useCallback, useState } from 'react'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'
import { DEFAULT_GALAXY, type GalaxyParams, type PlanetDef } from './types'

const DEFAULT_SIZE = 60
const DEFAULT_SPEED = 1

export default function App() {
  const [galaxy, setGalaxy] = useState<GalaxyParams>(DEFAULT_GALAXY)
  const [size, setSize] = useState(DEFAULT_SIZE)
  const [speed, setSpeed] = useState(DEFAULT_SPEED)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showOrbits, setShowOrbits] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [selected, setSelected] = useState<PlanetDef | null>(null)

  const handleGalaxyChange = useCallback((patch: Partial<GalaxyParams>) => {
    setGalaxy((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleReset = useCallback(() => {
    setGalaxy(DEFAULT_GALAXY)
    setSize(DEFAULT_SIZE)
    setSpeed(DEFAULT_SPEED)
    setSelected(null)
  }, [])

  return (
    <div className="app">
      <Scene
        galaxy={galaxy}
        size={size}
        speed={speed}
        autoRotate={autoRotate}
        showOrbits={showOrbits}
        selectedId={selected?.id ?? null}
        onSelectPlanet={setSelected}
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
          </div>
          <button className="icon-btn" onClick={() => setSelected(null)} aria-label="关闭">
            ×
          </button>
        </section>
      )}

      <footer className="hint">拖拽旋转视角 · 滚轮缩放 · 点击行星查看详情</footer>
    </div>
  )
}
