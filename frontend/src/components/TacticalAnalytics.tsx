import { useState, useMemo } from 'react'
import { X, BarChart3, Zap, Lightbulb, Flame } from 'lucide-react'
import { FORMATION_POSITIONS, type PitchPosition } from './PitchSVG'
import clsx from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
  formation: string
  config?: {
    pressing?: string
    defensive_block?: string
    passing_style?: string
    width?: string
    tempo?: string
    marking?: string
    counter_pressing?: boolean
  }
  starters?: string[]
}

type Tab = 'metrics' | 'chemistry' | 'suggestions' | 'heatmap'

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'metrics', label: 'Métriques', icon: BarChart3 },
  { key: 'chemistry', label: 'Chimie', icon: Zap },
  { key: 'suggestions', label: 'Suggestions', icon: Lightbulb },
  { key: 'heatmap', label: 'Heatmap', icon: Flame },
]

function computeMetrics(positions: PitchPosition[], config: Props['config']) {
  if (!positions.length) return { defWidth: 0, atkDepth: 0, compactness: 0, balance: 0, fitScore: 0, lineGap: 0, pressingIntensity: 0, counterThreat: 0 }

  const outfield = positions.filter((p) => p.name !== 'GK')
  const xs = outfield.map((p) => p.x)
  const ys = outfield.map((p) => p.y)
  const defLine = outfield.filter((p) => p.y >= 60)
  const midLine = outfield.filter((p) => p.y >= 35 && p.y < 60)
  const atkLine = outfield.filter((p) => p.y < 35)

  const defWidth = defLine.length > 1 ? Math.min(100, Math.round(((Math.max(...defLine.map((p) => p.x)) - Math.min(...defLine.map((p) => p.x))) / 80) * 100)) : 50
  const atkDepth = atkLine.length > 0 ? Math.min(100, Math.round((1 - Math.min(...atkLine.map((p) => p.y)) / 90) * 100)) : 40
  const ySpread = Math.max(...ys) - Math.min(...ys)
  const xSpread = Math.max(...xs) - Math.min(...xs)
  const compactness = Math.min(100, Math.round((1 - (ySpread * xSpread) / (80 * 70)) * 100))

  const leftCount = outfield.filter((p) => p.x < 40).length
  const rightCount = outfield.filter((p) => p.x > 60).length
  const balance = Math.max(0, 100 - Math.abs(leftCount - rightCount) * 15)

  // Line gap: distance between def avg y and mid avg y + mid avg y and atk avg y
  const avgY = (line: PitchPosition[]) => line.length ? line.reduce((s, p) => s + p.y, 0) / line.length : 50
  const defMidGap = defLine.length && midLine.length ? Math.abs(avgY(defLine) - avgY(midLine)) : 20
  const midAtkGap = midLine.length && atkLine.length ? Math.abs(avgY(midLine) - avgY(atkLine)) : 20
  const lineGap = Math.min(100, Math.round(100 - ((defMidGap + midAtkGap) / 60) * 100))

  // Pressing intensity from config
  let pressingIntensity = 50
  if (config?.pressing === 'low') pressingIntensity = 25
  else if (config?.pressing === 'medium') pressingIntensity = 50
  else if (config?.pressing === 'high') pressingIntensity = 78
  else if (config?.pressing === 'gegenpressing') pressingIntensity = 95
  if (config?.counter_pressing) pressingIntensity = Math.min(100, pressingIntensity + 10)
  if (config?.defensive_block === 'high') pressingIntensity = Math.min(100, pressingIntensity + 8)

  // Counter-attack threat
  let counterThreat = 50
  if (atkLine.length >= 2) counterThreat += 15
  if (defLine.length <= 3) counterThreat += 15
  if (config?.tempo === 'fast') counterThreat += 10
  counterThreat = Math.min(100, Math.max(0, counterThreat))

  let fitScore = 70
  if (config?.pressing === 'high' || config?.pressing === 'gegenpressing') fitScore += 8
  if (config?.defensive_block === 'high') fitScore += 5
  if (config?.tempo === 'fast') fitScore += 4
  if (midLine.length >= 3) fitScore += 5
  if (balance >= 80) fitScore += 3
  if (compactness >= 60) fitScore += 3
  fitScore = Math.min(100, Math.max(0, fitScore))

  return { defWidth, atkDepth, compactness, balance, fitScore, lineGap, pressingIntensity, counterThreat }
}

function computeChemistry(positions: PitchPosition[]) {
  const outfield = positions.filter((p) => p.name !== 'GK')
  const def = outfield.filter((p) => p.y >= 60)
  const mid = outfield.filter((p) => p.y >= 35 && p.y < 60)
  const atk = outfield.filter((p) => p.y < 35)

  const lineChemistry = (line: PitchPosition[]) => {
    if (line.length <= 1) return 75
    let score = 80
    const xs = line.map((p) => p.x).sort((a, b) => a - b)
    for (let i = 1; i < xs.length; i++) {
      const gap = xs[i] - xs[i - 1]
      if (gap < 10) score -= 5
      else if (gap > 30) score -= 8
      else score += 3
    }
    return Math.min(100, Math.max(40, score))
  }

  const defChem = lineChemistry(def)
  const midChem = lineChemistry(mid)
  const atkChem = lineChemistry(atk)
  const overall = Math.round((defChem + midChem + atkChem) / 3)

  return { overall, defense: defChem, midfield: midChem, attack: atkChem }
}

function getSuggestions(formation: string, config: Props['config']): { title: string; text: string; type: 'info' | 'warning' | 'success' }[] {
  const suggestions: { title: string; text: string; type: 'info' | 'warning' | 'success' }[] = []
  const positions = FORMATION_POSITIONS[formation] ?? []
  const def = positions.filter((p) => p.y >= 60 && p.name !== 'GK').length
  const mid = positions.filter((p) => p.y >= 35 && p.y < 60).length
  const atk = positions.filter((p) => p.y < 35).length

  if (def >= 5) suggestions.push({ title: 'Défense solide', text: `${def} défenseurs offrent une excellente couverture arrière. Idéal contre des équipes offensives.`, type: 'success' })
  if (def <= 3) suggestions.push({ title: 'Défense exposée', text: `Seulement ${def} défenseurs — attention aux contres rapides. Renforcez le milieu défensif.`, type: 'warning' })
  if (mid >= 5) suggestions.push({ title: 'Contrôle du milieu', text: `${mid} milieux garantissent la possession et le contrôle du tempo.`, type: 'success' })
  if (atk >= 3) suggestions.push({ title: 'Puissance offensive', text: `${atk} attaquants pour maximiser la pression haute. Pressing intense recommandé.`, type: 'info' })
  if (config?.pressing === 'gegenpressing' && def <= 3) suggestions.push({ title: 'Risque gegenpressing', text: 'Le gegenpressing avec peu de défenseurs est très risqué. Considérez un bloc plus bas.', type: 'warning' })
  if (config?.width === 'narrow' && formation.includes('3-')) suggestions.push({ title: 'Ajustement largeur', text: 'Une formation à 3 défenseurs bénéficie de largeur via les ailiers/pistons.', type: 'info' })
  if (config?.tempo === 'fast' && config?.passing_style === 'short') suggestions.push({ title: 'Tempo vs Passes', text: 'Un tempo rapide avec passes courtes demande une excellente technique. Envisagez des passes mixtes.', type: 'info' })
  if (config?.defensive_block === 'low' && config?.pressing === 'high') suggestions.push({ title: 'Incohérence tactique', text: 'Bloc bas avec pressing haut est contradictoire. Alignez le bloc sur le pressing.', type: 'warning' })
  if (config?.marking === 'individual' && def <= 3) suggestions.push({ title: 'Marquage risqué', text: 'Le marquage individuel avec seulement 3 défenseurs expose dangereusement votre arrière-garde.', type: 'warning' })
  if (def >= 4 && mid >= 4) suggestions.push({ title: 'Solidité collective', text: `${def}+${mid} joueurs derrière le ballon offrent un excellent bloc défensif.`, type: 'success' })
  if (suggestions.length === 0) suggestions.push({ title: 'Configuration équilibrée', text: 'La tactique actuelle est bien équilibrée. Aucun ajustement majeur nécessaire.', type: 'success' })

  return suggestions
}

function ProgressBar({ value, color = 'bg-pitch-500', label, suffix = '%' }: { value: number; color?: string; label: string; suffix?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm"><span className="text-gray-400">{label}</span><span className="text-white font-semibold">{value}{suffix}</span></div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className={clsx('h-full rounded-full transition-all duration-700', color)} style={{ width: `${value}%` }} /></div>
    </div>
  )
}

function ChemistryCircle({ value, label, size = 80 }: { value: number; label: string; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const color = value >= 85 ? '#22c55e' : value >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-700" />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="18" fontWeight="bold" className="rotate-90" transform={`rotate(90 ${size / 2} ${size / 2})`}>{value}</text>
      </svg>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

function RadarChart({ values, labels, size = 200 }: { values: number[]; labels: string[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38
  const n = values.length
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const point = (i: number, v: number) => ({
    x: cx + r * (v / 100) * Math.cos(angle(i)),
    y: cy + r * (v / 100) * Math.sin(angle(i)),
  })
  const polygon = values.map((v, i) => { const p = point(i, v); return `${p.x},${p.y}` }).join(' ')

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid */}
      {[25, 50, 75, 100].map((level) => (
        <polygon key={level} points={Array.from({ length: n }, (_, i) => { const p = point(i, level); return `${p.x},${p.y}` }).join(' ')} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Axes */}
      {labels.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={point(i, 100).x} y2={point(i, 100).y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {/* Data */}
      <polygon points={polygon} fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="2" />
      {values.map((v, i) => {
        const p = point(i, v)
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#22c55e" stroke="white" strokeWidth="1.5" />
      })}
      {/* Labels */}
      {labels.map((l, i) => {
        const p = point(i, 120)
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="#9ca3af" fontSize="10" fontWeight="500">{l}</text>
      })}
    </svg>
  )
}

export default function TacticalAnalytics({ open, onClose, formation, config, starters }: Props) {
  const [tab, setTab] = useState<Tab>('metrics')
  const positions = FORMATION_POSITIONS[formation] ?? FORMATION_POSITIONS['4-3-3']

  const metrics = useMemo(() => computeMetrics(positions, config), [positions, config])
  const chemistry = useMemo(() => computeChemistry(positions), [positions])
  const suggestions = useMemo(() => getSuggestions(formation, config), [formation, config])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-900/80">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><BarChart3 size={20} className="text-pitch-400" />Analyse Tactique</h2>
            <p className="text-xs text-gray-500 mt-0.5">Formation {formation} • Mise à jour en temps réel</p>
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
          {tab === 'metrics' && (
            <div className="space-y-5">
              {/* Radar overview */}
              <RadarChart
                values={[metrics.defWidth, metrics.atkDepth, metrics.compactness, metrics.balance, metrics.pressingIntensity, metrics.lineGap]}
                labels={['Largeur', 'Profondeur', 'Compacité', 'Équilibre', 'Pressing', 'Cohésion']}
                size={220}
              />
              <div className="grid grid-cols-2 gap-4">
                <ProgressBar value={metrics.defWidth} label="Largeur défensive" color="bg-blue-500" />
                <ProgressBar value={metrics.atkDepth} label="Profondeur d'attaque" color="bg-red-500" />
                <ProgressBar value={metrics.compactness} label="Compacité" color="bg-amber-500" />
                <ProgressBar value={metrics.balance} label="Équilibre G/D" color="bg-green-500" />
                <ProgressBar value={metrics.lineGap} label="Cohésion inter-lignes" color="bg-purple-500" />
                <ProgressBar value={metrics.pressingIntensity} label="Intensité pressing" color="bg-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-800/60 rounded-xl">
                  <p className="text-gray-500 text-xs">Menace contre-attaque</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${metrics.counterThreat}%` }} /></div>
                    <span className={clsx('text-sm font-bold', metrics.counterThreat >= 70 ? 'text-red-400' : metrics.counterThreat >= 50 ? 'text-amber-400' : 'text-green-400')}>{metrics.counterThreat}%</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs">Score formation</p>
                    <p className="text-[10px] text-gray-600">Adéquation globale</p>
                  </div>
                  <div className={clsx('text-2xl font-black', metrics.fitScore >= 80 ? 'text-green-400' : metrics.fitScore >= 60 ? 'text-amber-400' : 'text-red-400')}>{metrics.fitScore}<span className="text-sm text-gray-500">/100</span></div>
                </div>
              </div>
            </div>
          )}

          {tab === 'chemistry' && (
            <div className="space-y-6">
              <div className="flex justify-center"><ChemistryCircle value={chemistry.overall} label="Chimie Globale" size={120} /></div>
              <div className="grid grid-cols-3 gap-4">
                <ChemistryCircle value={chemistry.defense} label="Défense" />
                <ChemistryCircle value={chemistry.midfield} label="Milieu" />
                <ChemistryCircle value={chemistry.attack} label="Attaque" />
              </div>
              {/* Inter-line connections */}
              <div className="bg-gray-800/40 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400">Connexions inter-lignes</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-blue-400 text-sm font-bold">DEF</p>
                    <p className="text-[10px] text-gray-500">{positions.filter((p) => p.y >= 60 && p.name !== 'GK').length} joueurs</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all" style={{ width: `${Math.round((chemistry.defense + chemistry.midfield) / 2)}%` }} /></div>
                    <p className="text-[10px] text-gray-500 text-center mt-1">{Math.round((chemistry.defense + chemistry.midfield) / 2)}%</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-green-400 text-sm font-bold">MIL</p>
                    <p className="text-[10px] text-gray-500">{positions.filter((p) => p.y >= 35 && p.y < 60).length} joueurs</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-green-500 to-red-500 transition-all" style={{ width: `${Math.round((chemistry.midfield + chemistry.attack) / 2)}%` }} /></div>
                    <p className="text-[10px] text-gray-500 text-center mt-1">{Math.round((chemistry.midfield + chemistry.attack) / 2)}%</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-red-400 text-sm font-bold">ATT</p>
                    <p className="text-[10px] text-gray-500">{positions.filter((p) => p.y < 35).length} joueurs</p>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-gray-600 mt-2">La chimie mesure l'harmonie positionnelle entre lignes</div>
            </div>
          )}

          {tab === 'suggestions' && (
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className={clsx('rounded-xl p-4 border', s.type === 'success' ? 'bg-green-900/20 border-green-800/40' : s.type === 'warning' ? 'bg-amber-900/20 border-amber-800/40' : 'bg-blue-900/20 border-blue-800/40')}>
                  <p className={clsx('text-sm font-semibold', s.type === 'success' ? 'text-green-300' : s.type === 'warning' ? 'text-amber-300' : 'text-blue-300')}>{s.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.text}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'heatmap' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-[#1a1a2e]" style={{ height: 320 }}>
                <svg viewBox="0 0 680 1050" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id="grass-heat" patternUnits="userSpaceOnUse" width="680" height="80">
                      <rect width="680" height="40" fill="#14532d" /><rect y="40" width="680" height="40" fill="#166534" />
                    </pattern>
                    {positions.filter((p) => p.name !== 'GK').map((p, i) => (
                      <radialGradient key={`hg-${i}`} id={`heat-${i}`}>
                        <stop offset="0%" stopColor={p.y >= 60 ? 'rgba(59,130,246,0.5)' : p.y >= 35 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'} />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                      </radialGradient>
                    ))}
                  </defs>
                  <rect width="680" height="1050" fill="url(#grass-heat)" />
                  <rect x="30" y="30" width="620" height="990" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                  <line x1="30" y1="525" x2="650" y2="525" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                  <circle cx="340" cy="525" r="91.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />

                  {/* Heatmap zones with radial gradients */}
                  {positions.filter((p) => p.name !== 'GK').map((p, i) => (
                    <circle key={i} cx={(p.x / 100) * 620 + 30} cy={(p.y / 100) * 990 + 30} r="80" fill={`url(#heat-${i})`} />
                  ))}

                  {/* Player dots */}
                  {positions.map((p, i) => (
                    <g key={i}>
                      <circle cx={(p.x / 100) * 620 + 30} cy={(p.y / 100) * 990 + 30} r="14" fill={p.name === 'GK' ? '#f59e0b' : p.y >= 60 ? '#3b82f6' : p.y >= 35 ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth="2" className="drop-shadow-md" />
                      <text x={(p.x / 100) * 620 + 30} y={(p.y / 100) * 990 + 34} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{p.name}</text>
                    </g>
                  ))}
                </svg>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" />Défense</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" />Milieu</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" />Attaque</span>
              </div>
              {/* Zone occupation summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg py-2">
                  <p className="text-blue-300 text-lg font-bold">{positions.filter((p) => p.y >= 60 && p.name !== 'GK').length}</p>
                  <p className="text-[10px] text-gray-500">Zone défensive</p>
                </div>
                <div className="bg-green-900/20 border border-green-800/30 rounded-lg py-2">
                  <p className="text-green-300 text-lg font-bold">{positions.filter((p) => p.y >= 35 && p.y < 60).length}</p>
                  <p className="text-[10px] text-gray-500">Zone milieu</p>
                </div>
                <div className="bg-red-900/20 border border-red-800/30 rounded-lg py-2">
                  <p className="text-red-300 text-lg font-bold">{positions.filter((p) => p.y < 35).length}</p>
                  <p className="text-[10px] text-gray-500">Zone offensive</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
