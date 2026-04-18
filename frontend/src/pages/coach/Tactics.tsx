import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Swords, LayoutDashboard, Users, CalendarDays, Trophy, ClipboardList } from 'lucide-react'
import TacticsSidebar from './TacticsSidebar'
import TacticEditor from './TacticEditor'
import { type Tactic } from './tacticsConstants'
import type { Player } from '../../types'

export default function Tactics() {
  const qc = useQueryClient()
  const [selectedTacticId, setSelectedTacticId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: tactics = [], isLoading } = useQuery<Tactic[]>({
    queryKey: ['tactics'],
    queryFn: () => coachApi.tactics().then((r) => r.data),
  })

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then((r) => r.data),
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
      qc.invalidateQueries({ queryKey: ['tactics'] })
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
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Swords size={20} className="text-pitch-400" />
            <h1 className="text-lg font-bold">Tactiques</h1>
          </div>
          <nav className="flex items-center gap-1 text-xs">
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
