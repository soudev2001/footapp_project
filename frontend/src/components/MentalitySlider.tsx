import clsx from 'clsx'

interface MentalitySelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const MENTALITY_LEVELS = [
  { value: 'ultra_defensive', label: '🛡️ Ultra Déf', description: 'Pression minimale, ligne basse' },
  { value: 'defensive', label: '🔵 Défensif', description: 'Défensif, bloc médian' },
  { value: 'balanced', label: '⚖️ Équilibré', description: 'Équilibre attaque/défense' },
  { value: 'attacking', label: '🔴 Offensif', description: 'Offensif, risques modérés' },
  { value: 'ultra_attacking', label: '⚡ Ultra Off', description: 'Pression maximale, ligne haute' },
]

export default function MentalitySlider({
  value,
  onChange,
  className,
}: MentalitySelectorProps) {
  const currentLevel = MENTALITY_LEVELS.findIndex((level) => level.value === value)
  const currentMentality = MENTALITY_LEVELS[currentLevel] || MENTALITY_LEVELS[2]

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Mentalité générale</label>
        <div className="flex items-center gap-2">
          {MENTALITY_LEVELS.map((level, idx) => (
            <button
              key={level.value}
              onClick={() => onChange(level.value)}
              className={clsx(
                'flex-1 py-2 px-2 text-xs font-medium rounded transition-all',
                value === level.value
                  ? 'bg-green-600/80 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
              title={level.description}
            >
              <div className="text-sm">{level.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual indicator */}
      <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
        <div className="text-sm font-medium text-gray-300 mb-1">{currentMentality.label}</div>
        <div className="text-xs text-gray-400">{currentMentality.description}</div>
      </div>

      {/* Slider fallback for touch devices */}
      <input
        type="range"
        min="0"
        max="4"
        value={currentLevel}
        onChange={(e) => onChange(MENTALITY_LEVELS[parseInt(e.target.value)].value)}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
      />
    </div>
  )
}
