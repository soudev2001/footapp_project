import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Swords, LayoutDashboard, Users, CalendarDays, Trophy, ClipboardList, Save, Crown, Target, Settings2, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import TacticsSidebar from './TacticsSidebar'
import TacticEditor, { type TacticEditorHandle } from './TacticEditor'
import { type Tactic, PRESSING_COLORS, PRESSING_LABELS, BLOCK_LABELS, PASSING_LABELS, TEMPO_LABELS, WIDTH_LABELS, ROLE_LABELS, DUTY_LABELS, SET_PIECE_TYPES } from './tacticsConstants'
import type { Player } from '../../types'
import clsx from 'clsx'

export default function Tactics() {
  const qc = useQueryClient()
  const { activeTeamId } = useTeam()
  const [selectedTacticId, setSelectedTacticId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const teamParams = activeTeamId ? { team_id: activeTeamId } : undefined

  const { data: tactics = [], isLoading } = useQuery<Tactic[]>({
    queryKey: ['coach-tactics', activeTeamId],
    queryFn: () => coachApi.tactics(teamParams).then((r) => r.data),
  })

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ['coach-roster', activeTeamId],
    queryFn: () => coachApi.roster(teamParams).then((r) => r.data),
  })

  // Auto-load first tactic when page opens
  useEffect(() => {
    if (tactics.length > 0 && !selectedTacticId && !isCreating) {
      setSelectedTacticId(tactics[0].id)
    }
  }, [tactics]) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deleteTactic(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-tactics'] })
      if (selectedTacticId) setSelectedTacticId(null)
    },
  })

  const selectedTactic = selectedTacticId ? tactics.find((t) => t.id === selectedTacticId) ?? null : null
  const editorTactic = isCreating ? null : selectedTactic
  const showEditor = isCreating || selectedTactic !== null

  const handleNew = useCallback(() => {
    setIsCreating(true)
    setSelectedTacticId(null)
    setSidebarOpen(false)
  }, [])

  const handleEdit = useCallback((t: Tactic) => {
    setSelectedTacticId(t.id)
    setIsCreating(false)
    setSidebarOpen(false)
  }, [])

  const handleDuplicate = useCallback((t: Tactic) => {
    // Create a copy with modified name — will be saved as new (no id sent)
    setIsCreating(true)
    setSelectedTacticId(null)
    setSidebarOpen(false)
    // The TacticEditor will receive null tactic (new), but we need to pre-fill
    // We'll use a special state for this
    setDuplicateSource(t)
  }, [])

  const [duplicateSource, setDuplicateSource] = useState<Tactic | null>(null)
  const editorRef = useRef<TacticEditorHandle>(null)
  const [activeAccordion, setActiveAccordion] = useState<'captains' | 'general' | 'instructions' | 'roles' | null>(null)

  const handleSaved = useCallback(() => {
    setIsCreating(false)
    setDuplicateSource(null)
    qc.invalidateQueries({ queryKey: ['tactics'] })
  }, [qc])

  const handleCancel = useCallback(() => {
    setIsCreating(false)
    setSelectedTacticId(null)
    setDuplicateSource(null)
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id)
  }, [deleteMutation])

  const getPlayerLabel = useCallback((id: string) => {
    const p = players.find((pl: Player) => pl.id === id)
    return p ? `#${p.jersey_number ?? '?'} ${p.profile?.last_name ?? ''}` : id
  }, [players])

  // For duplicate: create a pseudo-tactic with no id
  const editorValue = duplicateSource
    ? { ...duplicateSource, id: undefined as any, name: `${duplicateSource.name} (copie)` }
    : editorTactic

  return (
    <div className="min-h-screen bg-fifa-dark text-white">
      {/* Header */}
      <header className="bg-gray-900/80 border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto space-y-0">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Swords size={20} className="text-pitch-400" />
              <h1 className="text-lg font-bold">Tactiques</h1>
              {selectedTactic && (
                <span className="text-xs font-bold text-pitch-400 bg-pitch-900/40 px-2 py-0.5 rounded border border-pitch-800/40">{selectedTactic.name || 'Sans nom'}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Nav links */}
              <nav className="flex items-center gap-1 text-xs mr-2">
                {[
                  { to: '/coach', icon: <LayoutDashboard size={12} />, label: 'Dashboard' },
                  { to: '/coach/roster', icon: <Users size={12} />, label: 'Effectif' },
                  { to: '/coach/lineup', icon: <ClipboardList size={12} />, label: 'Compo' },
                  { to: '/coach/calendar', icon: <CalendarDays size={12} />, label: 'Calendrier' },
                ].map((l) => (
                  <Link key={l.to} to={l.to} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                    {l.icon} <span className="hidden sm:inline">{l.label}</span>
                  </Link>
                ))}
              </nav>
              {/* Save button */}
              <button
                type="button"
                onClick={() => editorRef.current?.save()}
                disabled={!showEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pitch-500 to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              >
                <Save size={14} /> <span className="hidden sm:inline">Sauvegarder</span>
              </button>
            </div>
          </div>

          {/* Accordion info bar — only when a tactic is selected */}
          {selectedTactic && (
            <div className="mt-2 bg-gray-900/60 backdrop-blur border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center gap-1 px-3 py-1.5 flex-wrap">
                {([
                  { key: 'captains' as const, icon: '⚽', label: 'Capitaines & Tireurs' },
                  { key: 'general' as const, icon: '⚙️', label: 'Général' },
                  { key: 'instructions' as const, icon: '🎯', label: 'Instructions' },
                  { key: 'roles' as const, icon: '👤', label: 'Rôles' },
                ]).map(({ key, icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveAccordion(activeAccordion === key ? null : key)}
                    className={clsx(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border',
                      activeAccordion === key
                        ? 'bg-gradient-to-r from-pitch-500/20 to-emerald-500/10 border-pitch-500/30 text-pitch-300'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-transparent'
                    )}
                  >
                    <span>{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                    {activeAccordion === key ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                  </button>
                ))}
                {selectedTactic.formation && (
                  <span className="ml-auto text-[10px] font-bold text-pitch-400 bg-pitch-900/40 px-2 py-0.5 rounded border border-pitch-800/30">{selectedTactic.formation}</span>
                )}
              </div>

              {/* Panel: Capitaines & Tireurs */}
              {activeAccordion === 'captains' && (
                <div className="border-t border-white/5 p-3 bg-gray-950/40 space-y-3">
                  {/* Captains */}
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1"><Crown size={10} className="text-yellow-400" /> Capitaines</p>
                    {(selectedTactic.captains ?? []).length === 0
                      ? <p className="text-[11px] text-gray-600">Aucun capitaine assigné</p>
                      : (
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedTactic.captains ?? []).map((id, ci) => {
                            const p = players.find((pl: Player) => pl.id === id)
                            return (
                              <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-[10px] font-bold">
                                <Crown size={9} /> {ci === 0 ? 'C' : `C${ci + 1}`} {p ? `#${p.jersey_number ?? '?'} ${p.profile?.last_name ?? ''}` : id.slice(0, 6)}
                              </span>
                            )
                          })}
                        </div>
                      )
                    }
                  </div>
                  {/* Set pieces */}
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1"><Target size={10} className="text-pitch-400" /> Tireurs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SET_PIECE_TYPES.map(({ key: spKey, label }) => {
                        const ids = selectedTactic.set_pieces?.[spKey] ?? []
                        if (ids.length === 0) return null
                        return ids.map((id) => {
                          const p = players.find((pl: Player) => pl.id === id)
                          return (
                            <span key={`${spKey}-${id}`} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pitch-900/40 border border-pitch-700/30 text-pitch-300 text-[10px] font-medium">
                              {label}: #{p?.jersey_number ?? '?'} {p?.profile?.last_name ?? id.slice(0, 4)}
                            </span>
                          )
                        })
                      })}
                      {SET_PIECE_TYPES.every(({ key: spKey }) => (selectedTactic.set_pieces?.[spKey] ?? []).length === 0) && (
                        <p className="text-[11px] text-gray-600">Aucun tireur assigné</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Panel: Général */}
              {activeAccordion === 'general' && (
                <div className="border-t border-white/5 p-3 bg-gray-950/40">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/30">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Formation</span>
                      <span className="text-sm font-bold text-white">{selectedTactic.formation ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/30">
                      <Swords size={13} className="text-pitch-400" />
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Nom</span>
                      <span className="text-sm font-bold text-white">{selectedTactic.name || 'Sans nom'}</span>
                    </div>
                    {selectedTactic.description && (
                      <p className="text-[11px] text-gray-400 bg-gray-800/40 rounded-lg px-3 py-2 border-l-2 border-pitch-600/50 flex-1 min-w-[200px]">{selectedTactic.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Panel: Instructions */}
              {activeAccordion === 'instructions' && (() => {
                const ins = selectedTactic.instructions ?? {}
                const pressing = selectedTactic.pressing ?? ins.pressing ?? 'medium'
                const block = selectedTactic.defensive_block ?? ins.defensive_block ?? 'medium'
                const passingStyle = selectedTactic.passing_style ?? ins.passing_style ?? 'short'
                const tempo = selectedTactic.tempo ?? ins.tempo ?? 'balanced'
                const width = selectedTactic.width ?? ins.width ?? 'normal'
                const marking = selectedTactic.marking ?? ins.marking ?? 'zone'
                const counterPressing = selectedTactic.counter_pressing ?? ins.counter_pressing ?? false
                return (
                  <div className="border-t border-white/5 p-3 bg-gray-950/40 space-y-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                        <p className="text-[9px] text-gray-500 uppercase mb-1">Pressing</p>
                        <span className={clsx('inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold', PRESSING_COLORS[pressing] ?? 'bg-gray-700 text-gray-300')}>{PRESSING_LABELS[pressing] ?? pressing}</span>
                      </div>
                      <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                        <p className="text-[9px] text-gray-500 uppercase mb-1">Bloc déf.</p>
                        <p className="text-cyan-300 font-semibold text-[10px]">{BLOCK_LABELS[block] ?? block}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                        <p className="text-[9px] text-gray-500 uppercase mb-1">Passes</p>
                        <p className="text-gray-200 font-medium text-[10px]">{PASSING_LABELS[passingStyle] ?? passingStyle}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                        <p className="text-[9px] text-gray-500 uppercase mb-1">Tempo</p>
                        <p className="text-gray-200 font-medium text-[10px]">{TEMPO_LABELS[tempo] ?? tempo}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                        <p className="text-[9px] text-gray-500 uppercase mb-1">Largeur</p>
                        <p className="text-gray-200 font-medium text-[10px]">{WIDTH_LABELS[width] ?? width}</p>
                      </div>
                      <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                        <p className="text-[9px] text-gray-500 uppercase mb-1">Marquage</p>
                        <p className="text-gray-200 font-medium text-[10px]">{marking}</p>
                      </div>
                    </div>
                    {counterPressing && (
                      <span className="px-2 py-0.5 rounded-lg bg-red-900/50 text-red-300 text-[10px] font-semibold border border-red-900/30">Contre-pressing ⚡</span>
                    )}
                  </div>
                )
              })()}

              {/* Panel: Rôles */}
              {activeAccordion === 'roles' && (
                <div className="border-t border-white/5 p-3 bg-gray-950/40">
                  {(selectedTactic.player_instructions && Object.keys(selectedTactic.player_instructions).length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedTactic.player_instructions).map(([pid, instr]) => {
                        const p = players.find((pl: Player) => pl.id === pid)
                        return (
                          <div key={pid} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-700/40 bg-gray-800/60 text-xs">
                            <Shield size={10} className="text-pitch-400" />
                            <span className="text-gray-300 font-medium">{p ? `#${p.jersey_number ?? '?'} ${p.profile?.last_name ?? ''}` : pid.slice(0, 6)}</span>
                            <span className="px-1.5 py-0.5 rounded-lg bg-purple-900/40 border border-purple-700/30 text-purple-300 text-[9px] font-bold">
                              {ROLE_LABELS[instr.role] ?? instr.role}
                              {instr.duty && <span className="text-purple-500"> · {DUTY_LABELS[instr.duty] ?? instr.duty}</span>}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-600">Aucun rôle défini — assignez les rôles dans l'éditeur ci-dessous</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main layout: sidebar + content */}
      <div className="flex max-w-7xl mx-auto">
        <TacticsSidebar
          tactics={tactics}
          isLoading={isLoading}
          onNew={handleNew}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          getPlayerLabel={getPlayerLabel}
          activeTacticId={selectedTacticId}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 overflow-y-auto">
          {showEditor ? (
            <TacticEditor
              key={editorValue?.id ?? (isCreating ? 'new' : 'none')}
              tactic={editorValue}
              players={players}
              onSaved={handleSaved}
              onCancel={handleCancel}
              onDuplicate={handleDuplicate}
              ref={editorRef}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-600">
              <Swords size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Sélectionnez une tactique</p>
              <p className="text-sm mt-1">ou créez-en une nouvelle depuis le menu à gauche</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
