import { useState, useMemo } from 'react'
import { X, Eye, Layers, ArrowUpDown, Play, Ruler } from 'lucide-react'
import { FORMATION_POSITIONS, type PitchPosition } from './PitchSVG'
import clsx from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
  formation: string
  starters?: string[]
}

type Tab = 'pitch' | 'coverage' | 'passing' | 'phases' | 'distances'

const TABS: { key: Tab; label: string; icon: typeof Eye }[] = [
  { key: 'pitch', label: 'Terrain', icon: Eye },
  { key: 'coverage', label: 'Couverture', icon: Layers },
  { key: 'passing', label: 'Passes', icon: ArrowUpDown },
  { key: 'phases', label: 'Phases', icon: Play },
  { key: 'distances', label: 'Distances', icon: Ruler },
]

const SVG_W = 680
const SVG_H = 1050
const toSvgX = (pct: number) => (pct / 100) * 620 + 30
const toSvgY = (pct: number) => (pct / 100) * 990 + 30

function PitchBase({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="grass-viz" patternUnits="userSpaceOnUse" width="680" height="80">
          <rect width="680" height="40" fill="#14532d" /><rect y="40" width="680" height="40" fill="#166534" />
        </pattern>
      </defs>
      <rect width={SVG_W} height={SVG_H} fill="url(#grass-viz)" />
      {/* Field markings */}
      <rect x="30" y="30" width="620" height="990" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      <line x1="30" y1="525" x2="650" y2="525" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <circle cx="340" cy="525" r="91.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      {/* Penalty areas */}
      <rect x="165" y="850" width="350" height="170" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <rect x="165" y="30" width="350" height="170" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      {/* Goal areas */}
      <rect x="240" y="930" width="200" height="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="240" y="30" width="200" height="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {children}
    </svg>
  )
}

function PlayerDot({ p, size = 14, color, label }: { p: PitchPosition; size?: number; color: string; label?: string }) {
  const cx = toSvgX(p.x)
  const cy = toSvgY(p.y)
  return (
    <g>
      <circle cx={cx} cy={cy} r={size} fill={color} stroke="white" strokeWidth="2" className="drop-shadow-md" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{label ?? p.name}</text>
    </g>
  )
}

function playerColor(p: PitchPosition) {
  if (p.name === 'GK') return '#f59e0b'
  if (p.y >= 60) return '#3b82f6'
  if (p.y >= 35) return '#22c55e'
  return '#ef4444'
}

function getPhasePositions(positions: PitchPosition[], phase: 'defense' | 'transition' | 'attack'): PitchPosition[] {
  return positions.map((p) => {
    if (p.name === 'GK') return p
    switch (phase) {
      case 'defense':
        return { ...p, y: Math.min(90, p.y + 12), x: p.x + (50 - p.x) * 0.15 }
      case 'transition':
        return p
      case 'attack':
        return { ...p, y: Math.max(8, p.y - 10), x: p.x + (p.x < 50 ? -3 : p.x > 50 ? 3 : 0) }
    }
  })
}

function computePassingLines(positions: PitchPosition[]): [PitchPosition, PitchPosition][] {
  const outfield = positions.filter((p) => p.name !== 'GK')
  const lines: [PitchPosition, PitchPosition][] = []
  for (let i = 0; i < outfield.length; i++) {
    for (let j = i + 1; j < outfield.length; j++) {
      const dx = outfield[i].x - outfield[j].x
      const dy = outfield[i].y - outfield[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 28) lines.push([outfield[i], outfield[j]])
    }
  }
  return lines
}

function computeCoverageZones(positions: PitchPosition[]) {
  const outfield = positions.filter((p) => p.name !== 'GK')
  const def = outfield.filter((p) => p.y >= 60)
  const mid = outfield.filter((p) => p.y >= 35 && p.y < 60)
  const atk = outfield.filter((p) => p.y < 35)

  const zone = (line: PitchPosition[]) => {
    if (!line.length) return null
    const xs = line.map((p) => p.x)
    const ys = line.map((p) => p.y)
    const pad = 8
    return { x1: Math.max(0, Math.min(...xs) - pad), y1: Math.max(0, Math.min(...ys) - pad), x2: Math.min(100, Math.max(...xs) + pad), y2: Math.min(100, Math.max(...ys) + pad) }
  }

  return { defense: zone(def), midfield: zone(mid), attack: zone(atk) }
}

function computeTeamShape(positions: PitchPosition[]): string {
  const outfield = positions.filter((p) => p.name !== 'GK')
  if (outfield.length < 3) return ''
  // Convex hull using gift wrapping for the SVG polygon
  const pts = outfield.map((p) => ({ x: toSvgX(p.x), y: toSvgY(p.y) }))
  const start = pts.reduce((a, b) => (a.y > b.y ? a : a.y === b.y && a.x < b.x ? a : b))
  const hull: typeof pts = [start]
  let current = start
  for (let i = 0; i < pts.length; i++) {
    let next = pts[0]
    for (const p of pts) {
      if (p === current) continue
      const cross = (next.x - current.x) * (p.y - current.y) - (next.y - current.y) * (p.x - current.x)
      if (next === current || cross < 0 || (cross === 0 && Math.hypot(p.x - current.x, p.y - current.y) > Math.hypot(next.x - current.x, next.y - current.y))) {
        next = p
      }
    }
    if (next === start) break
    hull.push(next)
    current = next
  }
  return hull.map((p) => `${p.x},${p.y}`).join(' ')
}

function computeDistances(positions: PitchPosition[]) {
  const outfield = positions.filter((p) => p.name !== 'GK')
  const def = outfield.filter((p) => p.y >= 60)
  const mid = outfield.filter((p) => p.y >= 35 && p.y < 60)
  const atk = outfield.filter((p) => p.y < 35)

  const avgDist = (line: PitchPosition[]) => {
    if (line.length < 2) return 0
    let total = 0, count = 0
    for (let i = 0; i < line.length; i++) {
      for (let j = i + 1; j < line.length; j++) {
        total += Math.hypot(line[i].x - line[j].x, line[i].y - line[j].y)
        count++
      }
    }
    return Math.round(total / count)
  }

  const lineAvgY = (line: PitchPosition[]) => line.length ? Math.round(line.reduce((s, p) => s + p.y, 0) / line.length) : 0
  const defMidGap = def.length && mid.length ? Math.abs(lineAvgY(def) - lineAvgY(mid)) : 0
  const midAtkGap = mid.length && atk.length ? Math.abs(lineAvgY(mid) - lineAvgY(atk)) : 0

  return { defAvgDist: avgDist(def), midAvgDist: avgDist(mid), atkAvgDist: avgDist(atk), defMidGap, midAtkGap, defCount: def.length, midCount: mid.length, atkCount: atk.length }
}

export default function TacticalVisualizer({ open, onClose, formation, starters }: Props) {
  const [tab, setTab] = useState<Tab>('pitch')
  const [phase, setPhase] = useState<'defense' | 'transition' | 'attack'>('transition')
  const positions = FORMATION_POSITIONS[formation] ?? FORMATION_POSITIONS['4-3-3']

  const passingLines = useMemo(() => computePassingLines(positions), [positions])
  const coverage = useMemo(() => computeCoverageZones(positions), [positions])
  const phasePositions = useMemo(() => getPhasePositions(positions, phase), [positions, phase])
  const teamShape = useMemo(() => computeTeamShape(positions), [positions])
  const distances = useMemo(() => computeDistances(positions), [positions])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-900/80">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Eye size={20} className="text-pitch-400" />Visualisation Tactique</h2>
            <p className="text-xs text-gray-500 mt-0.5">Formation {formation} • Vue avancée</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={clsx('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === t.key ? 'bg-pitch-800 text-pitch-200' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800')}>
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Terrain tab */}
          {tab === 'pitch' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-[#1a1a2e]" style={{ height: 340 }}>
                <PitchBase>
                  {/* Team shape outline */}
                  {teamShape && <polygon points={teamShape} fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.25)" strokeWidth="2" strokeDasharray="8,4" />}
                  {positions.map((p, i) => <PlayerDot key={i} p={p} color={playerColor(p)} />)}
                </PitchBase>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-5 h-0.5 border border-dashed border-green-500/40" />Forme d'équipe</span>
                <span>{positions.filter((p) => p.y >= 60 && p.name !== 'GK').length} DEF • {positions.filter((p) => p.y >= 35 && p.y < 60).length} MIL • {positions.filter((p) => p.y < 35).length} ATT</span>
              </div>
            </div>
          )}

          {/* Coverage tab */}
          {tab === 'coverage' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-[#1a1a2e]" style={{ height: 340 }}>
                <PitchBase>
                  {coverage.defense && (
                    <rect x={toSvgX(coverage.defense.x1)} y={toSvgY(coverage.defense.y1)} width={toSvgX(coverage.defense.x2) - toSvgX(coverage.defense.x1)} height={toSvgY(coverage.defense.y2) - toSvgY(coverage.defense.y1)} rx="12" fill="rgba(59,130,246,0.18)" stroke="rgba(59,130,246,0.5)" strokeWidth="2" strokeDasharray="6,4" />
                  )}
                  {coverage.midfield && (
                    <rect x={toSvgX(coverage.midfield.x1)} y={toSvgY(coverage.midfield.y1)} width={toSvgX(coverage.midfield.x2) - toSvgX(coverage.midfield.x1)} height={toSvgY(coverage.midfield.y2) - toSvgY(coverage.midfield.y1)} rx="12" fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.5)" strokeWidth="2" strokeDasharray="6,4" />
                  )}
                  {coverage.attack && (
                    <rect x={toSvgX(coverage.attack.x1)} y={toSvgY(coverage.attack.y1)} width={toSvgX(coverage.attack.x2) - toSvgX(coverage.attack.x1)} height={toSvgY(coverage.attack.y2) - toSvgY(coverage.attack.y1)} rx="12" fill="rgba(239,68,68,0.18)" stroke="rgba(239,68,68,0.5)" strokeWidth="2" strokeDasharray="6,4" />
                  )}
                  {positions.map((p, i) => <PlayerDot key={i} p={p} size={10} color={playerColor(p)} />)}
                </PitchBase>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500/40 border border-blue-500" />Défense</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500" />Milieu</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500" />Attaque</span>
              </div>
            </div>
          )}

          {/* Passing tab */}
          {tab === 'passing' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-[#1a1a2e]" style={{ height: 340 }}>
                <PitchBase>
                  {/* Team shape background */}
                  {teamShape && <polygon points={teamShape} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />}
                  {passingLines.map(([a, b], i) => {
                    const dist = Math.hypot(a.x - b.x, a.y - b.y)
                    const strength = dist < 15 ? 0.8 : dist < 22 ? 0.5 : 0.3
                    return (
                      <line key={i} x1={toSvgX(a.x)} y1={toSvgY(a.y)} x2={toSvgX(b.x)} y2={toSvgY(b.y)} stroke={`rgba(250,204,21,${strength})`} strokeWidth={dist < 15 ? 3 : 2} strokeDasharray={dist < 15 ? 'none' : '8,4'} />
                    )
                  })}
                  {positions.map((p, i) => <PlayerDot key={i} p={p} color={playerColor(p)} />)}
                </PitchBase>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-yellow-500/80" />Forte</span>
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 border border-dashed border-yellow-500/40" />Moyenne</span>
                <span>{passingLines.length} connexions</span>
              </div>
            </div>
          )}

          {/* Phases tab */}
          {tab === 'phases' && (
            <div className="space-y-3">
              <div className="flex justify-center gap-2">
                {(['defense', 'transition', 'attack'] as const).map((ph) => (
                  <button key={ph} onClick={() => setPhase(ph)} className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all', phase === ph ? (ph === 'defense' ? 'bg-blue-700 text-blue-100 shadow-lg shadow-blue-900/40' : ph === 'transition' ? 'bg-amber-700 text-amber-100 shadow-lg shadow-amber-900/40' : 'bg-red-700 text-red-100 shadow-lg shadow-red-900/40') : 'bg-gray-800 text-gray-500 hover:text-gray-300')}>
                    {ph === 'defense' ? 'Défense' : ph === 'transition' ? 'Transition' : 'Attaque'}
                  </button>
                ))}
              </div>
              <div className="relative rounded-xl overflow-hidden bg-[#1a1a2e]" style={{ height: 340 }}>
                <PitchBase>
                  {/* Phase team shape */}
                  {(() => { const shape = computeTeamShape(phasePositions); return shape ? <polygon points={shape} fill={phase === 'defense' ? 'rgba(59,130,246,0.05)' : phase === 'attack' ? 'rgba(239,68,68,0.05)' : 'rgba(251,191,36,0.05)'} stroke={phase === 'defense' ? 'rgba(59,130,246,0.2)' : phase === 'attack' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'} strokeWidth="1.5" strokeDasharray="6,3" /> : null })()}
                  {/* Ghost original positions */}
                  {phase !== 'transition' && positions.map((p, i) => (
                    <circle key={`ghost-${i}`} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r="8" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3,3" />
                  ))}
                  {/* Movement arrows */}
                  {phase !== 'transition' && positions.map((p, i) => {
                    const np = phasePositions[i]
                    if (p.name === 'GK') return null
                    const dx = toSvgX(np.x) - toSvgX(p.x), dy = toSvgY(np.y) - toSvgY(p.y)
                    if (Math.hypot(dx, dy) < 5) return null
                    return <line key={`arr-${i}`} x1={toSvgX(p.x)} y1={toSvgY(p.y)} x2={toSvgX(np.x)} y2={toSvgY(np.y)} stroke={phase === 'defense' ? 'rgba(59,130,246,0.4)' : 'rgba(239,68,68,0.4)'} strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                  })}
                  <defs><marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="rgba(255,255,255,0.5)" /></marker></defs>
                  {phasePositions.map((p, i) => <PlayerDot key={i} p={p} color={playerColor(positions[i])} />)}
                </PitchBase>
              </div>
              <div className={clsx('text-center text-xs p-2 rounded-lg', phase === 'defense' ? 'bg-blue-900/20 text-blue-300' : phase === 'transition' ? 'bg-amber-900/20 text-amber-300' : 'bg-red-900/20 text-red-300')}>
                {phase === 'defense' ? 'Bloc bas — joueurs resserrés et reculés pour protéger la surface' : phase === 'transition' ? 'Position de base — formation initiale en phase de possession' : 'Phase offensive — bloc avancé, largeur maximale, pression haute'}
              </div>
            </div>
          )}

          {/* Distances tab */}
          {tab === 'distances' && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-[#1a1a2e]" style={{ height: 280 }}>
                <PitchBase>
                  {/* Inter-line gap visualization */}
                  {distances.defMidGap > 0 && (() => {
                    const defY = positions.filter((p) => p.y >= 60 && p.name !== 'GK')
                    const midY = positions.filter((p) => p.y >= 35 && p.y < 60)
                    if (!defY.length || !midY.length) return null
                    const dy = Math.round(defY.reduce((s, p) => s + p.y, 0) / defY.length)
                    const my = Math.round(midY.reduce((s, p) => s + p.y, 0) / midY.length)
                    return (
                      <g>
                        <line x1={toSvgX(20)} y1={toSvgY(dy)} x2={toSvgX(80)} y2={toSvgY(dy)} stroke="rgba(59,130,246,0.3)" strokeWidth="1" strokeDasharray="4,4" />
                        <line x1={toSvgX(20)} y1={toSvgY(my)} x2={toSvgX(80)} y2={toSvgY(my)} stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeDasharray="4,4" />
                        <line x1={toSvgX(50)} y1={toSvgY(dy)} x2={toSvgX(50)} y2={toSvgY(my)} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <text x={toSvgX(52)} y={toSvgY((dy + my) / 2)} fill="rgba(255,255,255,0.5)" fontSize="14" fontWeight="bold">{distances.defMidGap}%</text>
                      </g>
                    )
                  })()}
                  {distances.midAtkGap > 0 && (() => {
                    const midY = positions.filter((p) => p.y >= 35 && p.y < 60)
                    const atkY = positions.filter((p) => p.y < 35)
                    if (!midY.length || !atkY.length) return null
                    const my = Math.round(midY.reduce((s, p) => s + p.y, 0) / midY.length)
                    const ay = Math.round(atkY.reduce((s, p) => s + p.y, 0) / atkY.length)
                    return (
                      <g>
                        <line x1={toSvgX(50)} y1={toSvgY(my)} x2={toSvgX(50)} y2={toSvgY(ay)} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <text x={toSvgX(52)} y={toSvgY((my + ay) / 2)} fill="rgba(255,255,255,0.5)" fontSize="14" fontWeight="bold">{distances.midAtkGap}%</text>
                      </g>
                    )
                  })()}
                  {positions.map((p, i) => <PlayerDot key={i} p={p} size={10} color={playerColor(p)} />)}
                </PitchBase>
              </div>

              {/* Distance stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-900/15 border border-blue-800/30 rounded-xl p-3 text-center">
                  <p className="text-blue-400 text-xl font-bold">{distances.defAvgDist || '—'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Écart moy. DEF</p>
                  <p className="text-[10px] text-gray-600">{distances.defCount} joueurs</p>
                </div>
                <div className="bg-green-900/15 border border-green-800/30 rounded-xl p-3 text-center">
                  <p className="text-green-400 text-xl font-bold">{distances.midAvgDist || '—'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Écart moy. MIL</p>
                  <p className="text-[10px] text-gray-600">{distances.midCount} joueurs</p>
                </div>
                <div className="bg-red-900/15 border border-red-800/30 rounded-xl p-3 text-center">
                  <p className="text-red-400 text-xl font-bold">{distances.atkAvgDist || '—'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Écart moy. ATT</p>
                  <p className="text-[10px] text-gray-600">{distances.atkCount} joueurs</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/40 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">Gap DEF↔MIL</p>
                    <span className={clsx('text-sm font-bold', distances.defMidGap > 25 ? 'text-red-400' : distances.defMidGap > 18 ? 'text-amber-400' : 'text-green-400')}>{distances.defMidGap}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full mt-1.5 overflow-hidden"><div className={clsx('h-full rounded-full', distances.defMidGap > 25 ? 'bg-red-500' : distances.defMidGap > 18 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${Math.min(100, distances.defMidGap * 3)}%` }} /></div>
                </div>
                <div className="bg-gray-800/40 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">Gap MIL↔ATT</p>
                    <span className={clsx('text-sm font-bold', distances.midAtkGap > 25 ? 'text-red-400' : distances.midAtkGap > 18 ? 'text-amber-400' : 'text-green-400')}>{distances.midAtkGap}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full mt-1.5 overflow-hidden"><div className={clsx('h-full rounded-full', distances.midAtkGap > 25 ? 'bg-red-500' : distances.midAtkGap > 18 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${Math.min(100, distances.midAtkGap * 3)}%` }} /></div>
                </div>
              </div>
              <p className="text-center text-[10px] text-gray-600">Les écarts entre lignes inférieurs à 20% indiquent une bonne compacité</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
