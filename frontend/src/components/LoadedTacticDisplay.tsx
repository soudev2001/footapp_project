import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface LoadedTacticDisplayProps {
  tacticName: string
  formation: string
  mentality: string
  instructions: Record<string, any>
  playerInstructions?: Record<string, any>
  onModify?: () => void
  onApply?: () => void
  onDuplicate?: () => void
  className?: string
}

const LABEL_MAP: Record<string, string> = {
  passing_style: 'Passes',
  tempo: 'Tempo',
  width: 'Largeur',
  play_space: 'Espace de jeu',
  buildup_style: 'Construction',
  creative_freedom: 'Liberté créative',
  pressing: 'Pressing',
  defensive_block: 'Bloc défensif',
  defensive_shape: 'Forme défensive',
  offensive_width: 'Largeur offensive',
  defensive_width: 'Largeur défensive',
  offside_trap: 'Piège hors-jeu',
  pressing_trigger: 'Déclenchement pressing',
  counter_pressing: 'Contre-pressing',
  transition_speed: 'Vitesse transitions',
  gk_distribution: 'Relance GK',
  marking: 'Marquage',
  mentality: 'Mentalité',
}

interface Section {
  icon: string
  title: string
  color: string
  fields: string[]
}

export default function LoadedTacticDisplay({
  tacticName,
  formation,
  mentality,
  instructions,
  playerInstructions = {},
  onModify,
  onApply,
  onDuplicate,
  className,
}: LoadedTacticDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    attack: true,
    defense: true,
    transition: false,
    roles: false,
  })

  const sections: Record<string, Section> = {
    attack: {
      icon: '🔴',
      title: 'Phase Offensive',
      color: 'red',
      fields: ['passing_style', 'tempo', 'width', 'play_space', 'buildup_style', 'creative_freedom'],
    },
    defense: {
      icon: '🔵',
      title: 'Phase Défensive',
      color: 'blue',
      fields: ['pressing', 'defensive_block', 'defensive_shape', 'defensive_width', 'offside_trap', 'pressing_trigger', 'marking'],
    },
    transition: {
      icon: '🟡',
      title: 'Transitions',
      color: 'yellow',
      fields: ['counter_pressing', 'transition_speed', 'gk_distribution'],
    },
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const formatValue = (key: string, value: any): string => {
    if (typeof value === 'boolean') return value ? '✅' : '❌'
    if (value === null || value === undefined) return '—'
    return String(value).charAt(0).toUpperCase() + String(value).slice(1)
  }

  const getMentalityEmoji = (mentality: string) => {
    const emojiMap: Record<string, string> = {
      ultra_defensive: '🛡️🛡️🛡️🛡️🛡️',
      defensive: '🛡️🛡️🛡️🛡️□',
      balanced: '🛡️🛡️🛡️□□',
      attacking: '⚡⚡⚡□□',
      ultra_attacking: '⚡⚡⚡⚡⚡',
    }
    return emojiMap[mentality] || '⚖️⚖️⚖️□□'
  }

  const colorMap = {
    red: 'bg-red-900/20 border-red-800 text-red-300',
    blue: 'bg-blue-900/20 border-blue-800 text-blue-300',
    yellow: 'bg-yellow-900/20 border-yellow-800 text-yellow-300',
  }

  const activeRolesCount = Object.keys(playerInstructions).length

  return (
    <div
      className={clsx(
        'bg-gray-900 border border-green-800 rounded-lg p-4 mb-4 space-y-3',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-green-400 font-medium">✅ Tactique chargée</div>
          <div className="text-lg font-bold text-white">{tacticName}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Formation</div>
          <div className="text-2xl font-bold text-green-400">{formation}</div>
        </div>
      </div>

      {/* Mentality indicator */}
      <div className="px-3 py-2 bg-gray-800/50 rounded border border-gray-700">
        <div className="text-xs text-gray-400 mb-1">Mentalité générale</div>
        <div className="text-sm font-medium text-gray-300">{getMentalityEmoji(mentality)}</div>
      </div>

      {/* Sections */}
      {Object.entries(sections).map(([key, section]) => {
        const isExpanded = expandedSections[key]

        return (
          <div key={key} className={clsx('border rounded overflow-hidden', colorMap[section.color])}>
            <button
              onClick={() => toggleSection(key)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-black/20 transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-sm">
                <span>{section.icon}</span>
                {section.title}
              </div>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded && (
              <div className="px-3 py-2 border-t border-current/20 text-xs space-y-1">
                {section.fields.map((field) => {
                  const value = instructions[field]
                  if (value === null || value === undefined) return null

                  return (
                    <div key={field} className="flex justify-between gap-2">
                      <span className="text-gray-400">{LABEL_MAP[field] || field}:</span>
                      <span className="font-medium text-gray-200">{formatValue(field, value)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Player Roles Summary */}
      {activeRolesCount > 0 && (
        <div className="bg-purple-900/20 border border-purple-800 rounded px-3 py-2">
          <div className="text-sm font-medium text-purple-300">
            👤 Rôles spécialisés: {activeRolesCount} joueur{activeRolesCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        {onModify && (
          <button
            onClick={onModify}
            className="flex-1 px-3 py-2 bg-blue-600/80 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            Modifier
          </button>
        )}
        {onApply && (
          <button
            onClick={onApply}
            className="flex-1 px-3 py-2 bg-green-600/80 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
          >
            Appliquer au match
          </button>
        )}
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className="flex-1 px-3 py-2 bg-gray-600/80 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
          >
            Dupliquer
          </button>
        )}
      </div>
    </div>
  )
}
