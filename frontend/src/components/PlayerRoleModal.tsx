import clsx from 'clsx'
import { X } from 'lucide-react'
import { useState } from 'react'

interface PlayerRoleModalProps {
  isOpen: boolean
  playerName: string
  playerPosition?: string
  currentRole?: {
    role: string
    duty: 'defend' | 'support' | 'attack'
    freedom: 'stay_position' | 'roam' | 'free'
    specific_tasks: string[]
  }
  onSave: (instructions: {
    role: string
    duty: 'defend' | 'support' | 'attack'
    freedom: 'stay_position' | 'roam' | 'free'
    specific_tasks: string[]
  }) => void
  onClose: () => void
  positionRoles?: Record<string, string[]>
}

const DEFAULT_ROLES = {
  GK: ['sweeper_keeper', 'traditional'],
  CB: ['ball_playing_defender', 'stopper', 'cover'],
  LB: ['fullback', 'wingback', 'ball_playing_defender'],
  RB: ['fullback', 'wingback', 'ball_playing_defender'],
  CDM: ['deep_playmaker', 'ball_winner', 'box_to_box'],
  CM: ['box_to_box', 'deep_playmaker', 'ball_winner'],
  CAM: ['advanced_playmaker', 'attacking_midfielder', 'box_to_box'],
  LM: ['inverted_winger', 'traditional_winger', 'wide_midfielder'],
  RM: ['inverted_winger', 'traditional_winger', 'wide_midfielder'],
  LW: ['inverted_winger', 'inside_forward', 'traditional_winger'],
  RW: ['inverted_winger', 'inside_forward', 'traditional_winger'],
  ST: ['poacher', 'target_man', 'false_nine', 'advanced_forward'],
  CF: ['target_man', 'advanced_forward', 'complete_forward'],
}

const ROLE_LABELS: Record<string, string> = {
  sweeper_keeper: 'Libéro',
  traditional: 'Traditionnel',
  ball_playing_defender: 'Défenseur qui joue',
  stopper: 'Défenseur agressif',
  cover: 'Défenseur de couverture',
  wingback: 'Piston',
  fullback: 'Arrière',
  deep_playmaker: 'Créateur depuis la profondeur',
  ball_winner: 'Récupérateur',
  box_to_box: 'Milieu de terrain complet',
  advanced_playmaker: 'Créateur avancé',
  attacking_midfielder: 'Milieu offensif',
  inverted_winger: 'Ailier inversé',
  traditional_winger: 'Ailier traditionnel',
  inside_forward: 'Avant intérieur',
  wide_midfielder: 'Milieu large',
  target_man: 'Pivot',
  poacher: 'Renard des surfaces',
  false_nine: 'Faux 9',
  advanced_forward: 'Avant avancé',
  complete_forward: 'Attaquant complet',
}

const SPECIFIC_TASKS = [
  { key: 'run_channels', label: 'Courses en profondeur' },
  { key: 'take_long_shots', label: 'Tirs de loin' },
  { key: 'dribble_more', label: 'Dribbler plus' },
  { key: 'stay_wide', label: 'Rester large' },
  { key: 'get_forward', label: 'Monter en attaque' },
  { key: 'mark_specific', label: 'Marquer spécifique' },
  { key: 'play_simple', label: 'Jeu simple' },
  { key: 'crosses_often', label: 'Centrer souvent' },
  { key: 'sit_narrow', label: 'Se rapprocher' },
]

export default function PlayerRoleModal({
  isOpen,
  playerName,
  playerPosition = 'ST',
  currentRole,
  onSave,
  onClose,
  positionRoles,
}: PlayerRoleModalProps) {
  const [role, setRole] = useState(currentRole?.role || '')
  const [duty, setDuty] = useState<'defend' | 'support' | 'attack'>(currentRole?.duty || 'support')
  const [freedom, setFreedom] = useState<'stay_position' | 'roam' | 'free'>(currentRole?.freedom || 'stay_position')
  const [tasks, setTasks] = useState<string[]>(currentRole?.specific_tasks || [])

  const availableRoles = positionRoles?.[playerPosition] || DEFAULT_ROLES[playerPosition as keyof typeof DEFAULT_ROLES] || []

  const toggleTask = (taskKey: string) => {
    setTasks((prev) =>
      prev.includes(taskKey) ? prev.filter((t) => t !== taskKey) : [...prev, taskKey]
    )
  }

  const handleSave = () => {
    onSave({
      role,
      duty,
      freedom,
      specific_tasks: tasks,
    })
    onClose()
  }

  const handleReset = () => {
    setRole('')
    setDuty('support')
    setFreedom('stay_position')
    setTasks([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <div className="text-sm text-gray-400">Rôle de</div>
            <div className="font-bold text-white">{playerName}</div>
            <div className="text-xs text-gray-500">{playerPosition}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Rôle</label>
            <div className="space-y-1">
              {availableRoles.map((r) => (
                <label key={r} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">{ROLE_LABELS[r] || r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Duty Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Devoir</label>
            <div className="flex gap-2">
              {['defend', 'support', 'attack'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuty(d as 'defend' | 'support' | 'attack')}
                  className={clsx(
                    'flex-1 py-2 px-2 text-xs font-medium rounded transition-colors',
                    duty === d
                      ? 'bg-green-600/80 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {d === 'defend' ? '🛡️ Défendre' : d === 'support' ? '⚖️ Soutenir' : '⚡ Attaquer'}
                </button>
              ))}
            </div>
          </div>

          {/* Freedom Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Liberté de mouvement</label>
            <select
              value={freedom}
              onChange={(e) => setFreedom(e.target.value as 'stay_position' | 'roam' | 'free')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-300 text-sm"
            >
              <option value="stay_position">Strictement positionnée</option>
              <option value="roam">Peut se décaler</option>
              <option value="free">Liberté totale</option>
            </select>
          </div>

          {/* Specific Tasks */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Tâches spécifiques</label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {SPECIFIC_TASKS.map((task) => (
                <label key={task.key} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tasks.includes(task.key)}
                    onChange={() => toggleTask(task.key)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">{task.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-2 bg-green-600/80 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  )
}
