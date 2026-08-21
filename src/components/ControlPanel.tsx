import { PRESETS, type GalaxyParams, type Preset } from '../types'

interface SliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  format?: (value: number) => string
}

function Slider({ label, min, max, step, value, onChange, format }: SliderProps) {
  return (
    <label className="slider">
      <span className="slider-head">
        <span>{label}</span>
        <span className="slider-value">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

interface ColorRowProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <label className="color-row">
      <span>{label}</span>
      <span className="color-wrap">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <code>{value}</code>
      </span>
    </label>
  )
}

interface ControlPanelProps {
  galaxy: GalaxyParams
  onGalaxyChange: (patch: Partial<GalaxyParams>) => void
  size: number
  onSizeChange: (v: number) => void
  speed: number
  onSpeedChange: (v: number) => void
  autoRotate: boolean
  onAutoRotateChange: (v: boolean) => void
  showOrbits: boolean
  onShowOrbitsChange: (v: boolean) => void
  bloom: boolean
  onBloomChange: (v: boolean) => void
  showHud: boolean
  onShowHudChange: (v: boolean) => void
  onPreset: (p: Preset) => void
  onRandom: () => void
  onScreenshot: () => void
  onReset: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function ControlPanel({
  galaxy,
  onGalaxyChange,
  size,
  onSizeChange,
  speed,
  onSpeedChange,
  autoRotate,
  onAutoRotateChange,
  showOrbits,
  onShowOrbitsChange,
  bloom,
  onBloomChange,
  showHud,
  onShowHudChange,
  onPreset,
  onRandom,
  onScreenshot,
  onReset,
  collapsed,
  onToggleCollapse,
}: ControlPanelProps) {
  return (
    <aside className={`panel${collapsed ? ' collapsed' : ''}`}>
      <div className="panel-head">
        <h2>星云控制台</h2>
        <button className="icon-btn" onClick={onToggleCollapse} aria-label={collapsed ? '展开' : '收起'}>
          {collapsed ? '+' : '—'}
        </button>
      </div>

      <div className="panel-body">
        <div>
          <div className="section-label">预设风格</div>
          <div className="preset-row">
            {PRESETS.map((p) => (
              <button key={p.name} className="preset-chip" onClick={() => onPreset(p)}>
                {p.name}
              </button>
            ))}
            <button className="preset-chip" onClick={onRandom}>
              🎲 随机
            </button>
          </div>
        </div>

        <div>
          <div className="section-label">星系参数</div>
          <div className="slider-stack">
            <Slider
              label="粒子数量"
              min={10000}
              max={200000}
              step={5000}
              value={galaxy.count}
              onChange={(v) => onGalaxyChange({ count: v })}
              format={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Slider label="粒子大小" min={10} max={140} step={2} value={size} onChange={onSizeChange} />
            <Slider
              label="旋臂数量"
              min={1}
              max={8}
              step={1}
              value={galaxy.branches}
              onChange={(v) => onGalaxyChange({ branches: v })}
            />
            <Slider
              label="螺旋扭曲"
              min={0}
              max={3}
              step={0.1}
              value={galaxy.spin}
              onChange={(v) => onGalaxyChange({ spin: v })}
              format={(v) => v.toFixed(1)}
            />
            <Slider
              label="随机扩散"
              min={0}
              max={1}
              step={0.05}
              value={galaxy.randomness}
              onChange={(v) => onGalaxyChange({ randomness: v })}
              format={(v) => v.toFixed(2)}
            />
            <Slider
              label="动态速度"
              min={0}
              max={3}
              step={0.1}
              value={speed}
              onChange={onSpeedChange}
              format={(v) => `${v.toFixed(1)}x`}
            />
          </div>
        </div>

        <div>
          <div className="section-label">颜色</div>
          <div className="color-stack">
            <ColorRow
              label="内侧颜色"
              value={galaxy.insideColor}
              onChange={(v) => onGalaxyChange({ insideColor: v })}
            />
            <ColorRow
              label="外侧颜色"
              value={galaxy.outsideColor}
              onChange={(v) => onGalaxyChange({ outsideColor: v })}
            />
          </div>
        </div>

        <div className="switch-row">
          <label className="switch">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => onAutoRotateChange(e.target.checked)}
            />
            <span>自动环绕</span>
          </label>
          <label className="switch">
            <input
              type="checkbox"
              checked={showOrbits}
              onChange={(e) => onShowOrbitsChange(e.target.checked)}
            />
            <span>显示轨道</span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={bloom} onChange={(e) => onBloomChange(e.target.checked)} />
            <span>辉光</span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={showHud} onChange={(e) => onShowHudChange(e.target.checked)} />
            <span>性能监视</span>
          </label>
        </div>

        <div className="btn-row">
          <button className="action-btn" onClick={onScreenshot}>📸 截图</button>
          <button className="action-btn" onClick={onReset}>↺ 重置</button>
        </div>
      </div>
    </aside>
  )
}
