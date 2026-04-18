import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi, teamsApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import { Users, Search, Plus, X, Save, PieChart, GitCompare, CheckCircle, Trash2, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { Player } from '../../types'
import clsx from 'clsx'

// Map actual position codes to group
function getPositionGroup(pos: string): string {
  const p = (pos ?? '').toUpperCase()
  if (p === 'GK') return 'GK'
  if (['DEF', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'DEF'
  if (['MID', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'DM', 'AM'].includes(p)) return 'MID'
  if (['ATT', 'ST', 'CF', 'LW', 'RW', 'SS'].includes(p)) return 'ATT'
  return pos || 'Other'
}

const GROUP_LABEL: Record<string, string> = {
  GK: 'Gardiens',
  DEF: 'Défenseurs',
  MID: 'Milieux',
  ATT: 'Attaquants',
  Other: 'Autres',
}

const GROUP_ORDER = ['GK', 'DEF', 'MID', 'ATT', 'Other']

const GROUP_BADGE: Record<string, string> = {
  GK: 'bg-orange-900/60 text-orange-300',
  DEF: 'bg-blue-900/60 text-blue-300',
  MID: 'bg-emerald-900/60 text-emerald-300',
  ATT: 'bg-red-900/60 text-red-300',
  Other: 'bg-gray-800 text-gray-300',
}

const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'ST', 'LW', 'RW']

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  position: 'CM',
  jersey_number: '',
  team_id: '',
  height: '',
  weight: '',
}

export default function Roster() {
  const qc = useQueryClient()
  const { teams, activeTeamId } = useTeam()
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: players, isLoading } = useQuery({
    queryKey: ['coach-roster', activeTeamId],
    queryFn: () => coachApi.roster(activeTeamId ? { team_id: activeTeamId } : undefined).then((r) => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (data: object) => coachApi.addPlayer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-roster'] })
      qc.invalidateQueries({ queryKey: ['team-players'] })
      setAdding(false)
      setForm({ ...EMPTY_FORM, team_id: activeTeamId })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deletePlayer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach-roster'] }),
  })

  const filtered = (players as Player[] | undefined)?.filter((p: Player) => {
    const name = `${p.profile?.first_name ?? ''} ${p.profile?.last_name ?? ''}`.toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (posFilter && p.position !== posFilter) return false
    return true
  })

  // Group by canonical group (GK/DEF/MID/ATT)
  const grouped = filtered?.reduce((acc: Record<string, Player[]>, p: Player) => {
    const g = getPositionGroup(p.position)
    acc[g] = [...(acc[g] ?? []), p]
    return acc
  }, {})

  // Unique actual positions for filter pills
  const positions = [...new Set((players as Player[] | undefined)?.map((p: Player) => p.position).filter(Boolean))]

  function getAvatarUrl(player: Player): string {
    if (player.profile?.avatar) return player.profile.avatar
    const name = `${player.profile?.first_name ?? ''}+${player.profile?.last_name ?? ''}`
    return `https://ui-avatars.com/api/?name=${name}&background=10b981&color=fff&size=128`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users size={22} className="text-pitch-500" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">Effectif</h1>
          {players && (
            <span className="badge bg-gray-800 text-gray-300 ml-2">{(players as Player[]).length} joueurs</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/coach/analytics" className="btn-secondary text-xs gap-1">
            <PieChart size={13} /> Analyse
          </Link>
          <Link to="/coach/player-comparison" className="btn-secondary text-xs gap-1">
            <GitCompare size={13} /> Comparer
          </Link>
          <button type="button" onClick={() => setAdding(!adding)} className="btn-primary text-sm">
            {adding ? <><X size={14} /> Fermer</> : <><Plus size={14} /> Ajouter</>}
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-pitch-900/40 border border-pitch-700 rounded-lg px-4 py-3 text-pitch-300 text-sm flex items-center gap-2">
          <CheckCircle size={16} /> Joueur ajouté avec succès !
        </div>
      )}

      {/* Add player form */}
      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addMutation.mutate({
              profile: { first_name: form.first_name, last_name: form.last_name },
              position: form.position,
              jersey_number: form.jersey_number ? +form.jersey_number : undefined,
              team_id: form.team_id || undefined,
              height: form.height ? +form.height : undefined,
              weight: form.weight ? +form.weight : undefined,
            })
          }}
          className="card space-y-5 border-pitch-800"
        >
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Plus size={16} className="text-pitch-400" /> Nouveau joueur
          </h2>

          {/* Identity */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Identité</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Prénom *</label>
                <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input" placeholder="Prénom" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom *</label>
                <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input" placeholder="Nom" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Équipe</label>
                <select value={form.team_id || activeTeamId} onChange={(e) => setForm({ ...form, team_id: e.target.value })} className="input">
                  <option value="">Aucune</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Player profile */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Profil joueur</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Poste *</label>
                <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input" required>
                  {ALL_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">N° Maillot</label>
                <input value={form.jersey_number} onChange={(e) => setForm({ ...form, jersey_number: e.target.value })} type="number" min={1} max={99} className="input" placeholder="#" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Taille (cm)</label>
                <input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} type="number" min={150} max={220} className="input" placeholder="175" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Poids (kg)</label>
                <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} type="number" min={50} max={120} className="input" placeholder="70" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>
              <Save size={14} /> Enregistrer
            </button>
            <button type="button" onClick={() => { setAdding(false); setForm(EMPTY_FORM) }} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Search + position filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un joueur..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setPosFilter(null)}
            className={clsx('badge text-xs cursor-pointer', !posFilter ? 'bg-pitch-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200')}
          >
            Tous
          </button>
          {(positions as string[]).map((pos: string) => (
            <button
              key={pos}
              onClick={() => setPosFilter(posFilter === pos ? null : pos)}
              className={clsx(
                'badge text-xs cursor-pointer',
                posFilter === pos
                  ? GROUP_BADGE[getPositionGroup(pos)] ?? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              )}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-gray-400">Chargement de l'effectif…</p>}

      {/* Player cards grouped by position */}
      {grouped && GROUP_ORDER.filter((g) => grouped[g]?.length).map((group) => (
        <div key={group} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">{GROUP_LABEL[group]}</h2>
            <div className="h-px flex-1 bg-gray-800" />
            <span className={clsx('badge text-xs', GROUP_BADGE[group])}>{grouped[group].length}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(grouped[group] as Player[]).map((player: Player) => {
              const firstName = player.profile?.first_name ?? ''
              const lastName = player.profile?.last_name ?? ''
              const fullName = `${firstName} ${lastName}`.trim() || 'Joueur'
              const avatarUrl = getAvatarUrl(player)

              return (
                <div key={player.id} className="card group relative overflow-hidden hover:border-pitch-700 transition-all duration-300">
                  {/* Jersey ribbon */}
                  <div className="absolute top-0 right-8 z-10 bg-pitch-600 text-white text-sm font-bold w-8 h-12 flex items-end justify-center pb-1 rounded-b-xl group-hover:h-14 transition-all duration-300">
                    {player.jersey_number ?? '--'}
                  </div>

                  {/* Player info */}
                  <div className="flex items-center gap-4 mb-4 pr-10">
                    <div className="relative flex-shrink-0">
                      <img
                        src={avatarUrl}
                        alt={fullName}
                        className="w-16 h-16 rounded-2xl object-cover group-hover:scale-105 group-hover:rotate-1 transition-all duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=10b981&color=fff&size=128`
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 bg-pitch-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white uppercase truncate group-hover:text-pitch-400 transition-colors">
                        {fullName}
                      </p>
                      <span className={clsx('badge text-xs mt-1', GROUP_BADGE[getPositionGroup(player.position)] ?? 'bg-gray-800 text-gray-300')}>
                        {player.position}
                      </span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-800/60 rounded-xl p-2 text-center">
                      <p className="text-base font-bold text-white">{player.stats?.goals ?? 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Buts</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-2 text-center">
                      <p className="text-base font-bold text-white">{player.stats?.assists ?? 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Passes</p>
                    </div>
                    <div className="bg-pitch-900/40 rounded-xl p-2 text-center">
                      <p className="text-base font-bold text-pitch-300">{player.stats?.matches_played ?? 0}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Matchs</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/coach/roster/${player.id}`}
                      className="flex-1 text-center py-2 rounded-xl bg-pitch-600/20 hover:bg-pitch-600/40 text-pitch-300 text-xs font-bold uppercase tracking-wide transition-colors"
                    >
                      Analyser
                    </Link>
                    <Link
                      to={`/coach/roster/${player.id}`}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={13} />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer ${fullName} ?`)) deleteMutation.mutate(player.id)
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Background glow */}
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pitch-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {!isLoading && !filtered?.length && (
        <div className="card text-center py-12 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          {search || posFilter ? 'Aucun joueur trouvé.' : "Aucun joueur dans l'effectif."}
        </div>
      )}
    </div>
  )
}
