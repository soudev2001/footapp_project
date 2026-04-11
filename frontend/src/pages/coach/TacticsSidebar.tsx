import { useState } from 'react'
import { Plus, Search, ChevronDown, ChevronUp, Pencil, Copy, Trash2, RotateCcw, Crown, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import PitchSVG from '../../components/PitchSVG'
import { FORMATION_POSITIONS } from '../../components/PitchSVG'
import {
  type Tactic,
  PRESSING_COLORS, PRESSING_LABELS, PRESSING_BORDER,
  BLOCK_LABELS, PASSING_LABELS, TEMPO_LABELS, WIDTH_LABELS,
  PLAY_SPACE_LABELS, GK_DIST_LABELS,
  SET_PIECE_TYPES,
} from './tacticsConstants'
import type { Player } from '../../types'

interface TacticsSidebarProps {
  tactics: Tactic[] | undefined
  isLoading: boolean
  onNew: () => void
  onEdit: (t: Tactic) => void
  onDuplicate: (t: Tactic) => void
  onDelete: (id: string) => void
  getPlayerLabel: (id: string) => string
  activeTacticId?: string | null
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function TacticsSidebar({
  tactics,
  isLoading,
  onNew,
  onEdit,
  onDuplicate,
  onDelete,
  getPlayerLabel,
  activeTacticId,
  sidebarOpen,
  onToggleSidebar,
}: TacticsSidebarProps) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filtered = (tactics ?? []).filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (t.name ?? '').toLowerCase().includes(q) || (t.formation ?? '').includes(q)
  })

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="lg:hidden fixed bottom-4 left-4 z-40 bg-pitch-600 text-white p-3 rounded-full shadow-lg hover:bg-pitch-500 transition-colors"
        title={sidebarOpen ? 'Fermer' : 'Tactiques'}
      >
        {sidebarOpen ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>

      {/* Backdrop (mobile) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={onToggleSidebar} />
      )}

      {/* Sidebar panel */}
      <aside className={clsx(
        'fixed lg:sticky top-0 left-0 z-40 lg:z-auto h-screen lg:h-[calc(100vh-4rem)] w-72 bg-gray-900/95 lg:bg-gray-900/60 border-r border-gray-800 flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="p-3 border-b border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide">Tactiques</h2>
            <button
              type="button"
              onClick={onNew}
              className="flex items-center gap-1 text-xs bg-pitch-600 hover:bg-pitch-500 text-white px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> Nouvelle
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-pitch-600 focus:outline-none"
              placeholder="Rechercher..."
            />
          </div>
          <span className="text-[10px] text-gray-500">{filtered.length} tactique(s)</span>
        </div>

        {/* Tactics list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {isLoading && <p className="text-xs text-gray-500 text-center py-4">Chargement...</p>}

          {!isLoading && filtered.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-8">Aucune tactique</p>
          )}

          {filtered.map((t) => {
            const pressing = t.pressing ?? t.instructions?.pressing ?? 'medium'
            const block = t.defensive_block ?? t.instructions?.defensive_block ?? 'medium'
            const passingStyle = t.passing_style ?? t.instructions?.passing_style ?? '—'
            const tempo = t.tempo ?? t.instructions?.tempo ?? 'balanced'
            const width = t.width ?? t.instructions?.width ?? 'normal'
            const marking = t.marking ?? t.instructions?.marking ?? 'zone'
            const playSpace = t.play_space ?? t.instructions?.play_space
            const gkDist = t.gk_distribution ?? t.instructions?.gk_distribution
            const counterPressing = t.counter_pressing ?? t.instructions?.counter_pressing ?? false
            const expanded = expandedId === t.id
            const isActive = activeTacticId === t.id

            return (
              <div
                key={t.id}
                className={clsx(
                  'rounded-xl border-l-[3px] transition-all',
                  PRESSING_BORDER[pressing] ?? 'border-l-gray-600',
                  isActive ? 'bg-pitch-900/30 ring-1 ring-pitch-600/40' : 'bg-gray-800/40 hover:bg-gray-800/70'
                )}
              >
                {/* Collapsed header — click to expand */}
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : t.id)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{t.formation ?? '—'}</span>
                      <span className={clsx('text-[9px] px-1.5 py-0.5 rounded font-medium', PRESSING_COLORS[pressing] ?? 'bg-gray-700 text-gray-300')}>
                        {PRESSING_LABELS[pressing] ?? pressing}
                      </span>
                    </div>
                    {t.name && <p className="text-xs text-pitch-400 truncate mt-0.5">{t.name}</p>}
                  </div>
                  {expanded ? <ChevronUp size={14} className="text-gray-500 shrink-0" /> : <ChevronDown size={14} className="text-gray-500 shrink-0" />}
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {/* Tactical config grid */}
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className="bg-gray-900/60 rounded px-2 py-1">
                        <span className="text-gray-500">Passes</span>
                        <p className="text-gray-300">{PASSING_LABELS[passingStyle] ?? passingStyle}</p>
                      </div>
                      <div className="bg-gray-900/60 rounded px-2 py-1">
                        <span className="text-gray-500">Bloc</span>
                        <p className="text-gray-300">{BLOCK_LABELS[block] ?? block}</p>
                      </div>
                      <div className="bg-gray-900/60 rounded px-2 py-1">
                        <span className="text-gray-500">Tempo</span>
                        <p className="text-gray-300">{TEMPO_LABELS[tempo] ?? tempo}</p>
                      </div>
                      <div className="bg-gray-900/60 rounded px-2 py-1">
                        <span className="text-gray-500">Largeur</span>
                        <p className="text-gray-300">{WIDTH_LABELS[width] ?? width}</p>
                      </div>
                      <div className="bg-gray-900/60 rounded px-2 py-1">
                        <span className="text-gray-500">Marquage</span>
                        <p className="text-gray-300">{marking === 'individual' ? 'Individuel' : 'Zone'}</p>
                      </div>
                      {playSpace && (
                        <div className="bg-gray-900/60 rounded px-2 py-1">
                          <span className="text-gray-500">Espace</span>
                          <p className="text-gray-300">{PLAY_SPACE_LABELS[playSpace] ?? playSpace}</p>
                        </div>
                      )}
                    </div>

                    {/* Extra badges */}
                    {(gkDist || counterPressing) && (
                      <div className="flex gap-1 flex-wrap text-[9px]">
                        {gkDist && <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">GK: {GK_DIST_LABELS[gkDist] ?? gkDist}</span>}
                        {counterPressing && <span className="px-1.5 py-0.5 rounded bg-red-900/50 text-red-300">Contre-press</span>}
                      </div>
                    )}

                    {/* Captains */}
                    {t.captains && t.captains.length > 0 && (
                      <div className="flex gap-1 flex-wrap text-[9px]">
                        {t.captains.slice(0, 3).map((cid, ci) => (
                          <span key={cid} className="inline-flex items-center gap-0.5 text-yellow-400">
                            <Crown size={8} /> {ci === 0 ? 'C' : `C${ci + 1}`} {getPlayerLabel(cid)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Set-piece summary */}
                    {t.set_pieces && Object.entries(t.set_pieces).filter(([, v]) => (v as string[]).length > 0).length > 0 && (
                      <div className="flex gap-1 flex-wrap text-[9px]">
                        {Object.entries(t.set_pieces).filter(([, v]) => (v as string[]).length > 0).map(([k, v]) => {
                          const sp = SET_PIECE_TYPES.find((s) => s.key === k)
                          return (
                            <span key={k} className="px-1.5 py-0.5 rounded bg-pitch-900/40 text-pitch-300 border border-pitch-800/40">
                              {sp?.icon} {(v as string[]).length}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {/* Description */}
                    {t.description && (
                      <p className="text-[10px] text-gray-400 line-clamp-2">{t.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 pt-1 border-t border-gray-700/50">
                      <button type="button" onClick={() => onEdit(t)} className="flex-1 flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-yellow-400 bg-gray-800/60 hover:bg-gray-800 rounded-lg py-1.5 transition-colors">
                        <Pencil size={11} /> Modifier
                      </button>
                      <button type="button" onClick={() => onDuplicate(t)} className="flex-1 flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-blue-400 bg-gray-800/60 hover:bg-gray-800 rounded-lg py-1.5 transition-colors">
                        <Copy size={11} /> Dupliquer
                      </button>
                      {confirmDeleteId === t.id ? (
                        <div className="flex items-center gap-0.5">
                          <button type="button" onClick={() => { onDelete(t.id); setConfirmDeleteId(null) }} className="p-1.5 rounded-lg bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors">
                            <Trash2 size={11} />
                          </button>
                          <button type="button" onClick={() => setConfirmDeleteId(null)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors">
                            <RotateCcw size={11} />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmDeleteId(t.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </>
  )
}
