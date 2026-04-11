import type { Player } from '../../types'

/* ─── Position labels ─── */
export const POS_FR: Record<string, string> = {
  GK: 'G', LB: 'AG', CB: 'DC', RB: 'AD', LWB: 'AG', RWB: 'AD',
  CDM: 'MDC', CM: 'MC', CAM: 'MOC', LM: 'MG', RM: 'MD',
  LW: 'AIG', RW: 'AID', ST: 'BU', CF: 'AC',
}

/* ─── Pressing ─── */
export const PRESSING_COLORS: Record<string, string> = {
  low: 'bg-blue-900 text-blue-300',
  medium: 'bg-yellow-900 text-yellow-300',
  high: 'bg-orange-900 text-orange-300',
  gegenpressing: 'bg-red-900 text-red-300',
}

export const PRESSING_LABELS: Record<string, string> = {
  low: 'Bas',
  medium: 'Médian',
  high: 'Haut',
  gegenpressing: 'Gegenpress',
}

export const PRESSING_BORDER: Record<string, string> = {
  low: 'border-l-blue-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-orange-500',
  gegenpressing: 'border-l-red-500',
}

/* ─── Defensive ─── */
export const BLOCK_LABELS: Record<string, string> = {
  low: 'Bloc bas',
  medium: 'Bloc médian',
  high: 'Bloc haut',
}

export const DEFENSIVE_SHAPE_LABELS: Record<string, string> = {
  compact: 'Compacte',
  normal: 'Normale',
  spread: 'Étalée',
}

export const DEFENSIVE_WIDTH_LABELS: Record<string, string> = {
  narrow: 'Étroit',
  normal: 'Normal',
  wide: 'Large',
}

export const PRESSING_TRIGGER_LABELS: Record<string, string> = {
  immediate: 'Immédiat',
  losing_ball: 'Perte de balle',
  opponent_half: 'Demi-terrain adverse',
  final_third: 'Dernier tiers',
}

/* ─── Offensive ─── */
export const PASSING_LABELS: Record<string, string> = {
  short: 'Courtes',
  direct: 'Directes',
  long_ball: 'Longues',
  long: 'Longues',
  mixed: 'Mixtes',
}

export const TEMPO_LABELS: Record<string, string> = {
  slow: 'Lent',
  balanced: 'Équilibré',
  fast: 'Rapide',
}

export const WIDTH_LABELS: Record<string, string> = {
  narrow: 'Étroit',
  normal: 'Normal',
  wide: 'Large',
}

export const PLAY_SPACE_LABELS: Record<string, string> = {
  left: 'Couloir gauche',
  right: 'Couloir droit',
  center: 'Axe central',
  both_wings: 'Deux couloirs',
  mixed: 'Mixte',
}

export const BUILDUP_STYLE_LABELS: Record<string, string> = {
  goalkeeper_short: 'Relance courte GK',
  defenders_build: 'Construction défenseurs',
  midfield_drop: 'Milieux décalés',
  long_ball: 'Lancement direct',
  mixed: 'Mixte',
}

export const CREATIVE_FREEDOM_LABELS: Record<string, string> = {
  strict: 'Stricte',
  balanced: 'Équilibrée',
  high: 'Libre',
}

export const TRANSITION_SPEED_LABELS: Record<string, string> = {
  slow: 'Lent',
  balanced: 'Équilibré',
  fast: 'Rapide',
}

/* ─── GK ─── */
export const GK_DIST_LABELS: Record<string, string> = {
  short: 'Courte',
  long: 'Longue',
  fast: 'Rapide',
}

/* ─── Mentality ─── */
export const MENTALITY_LABELS: Record<string, string> = {
  ultra_defensive: '🛡️ Ultra Déf',
  defensive: '🔵 Défensif',
  balanced: '⚖️ Équilibré',
  attacking: '🔴 Offensif',
  ultra_attacking: '⚡ Ultra Off',
}

/* ─── Player Roles ─── */
export const GK_ROLES = ['sweeper_keeper', 'traditional']
export const DEFENDER_ROLES = ['ball_playing_defender', 'stopper', 'cover', 'wingback', 'fullback']
export const MIDFIELDER_ROLES = ['deep_playmaker', 'ball_winner', 'box_to_box', 'advanced_playmaker', 'attacking_midfielder']
export const WINGER_ROLES = ['inverted_winger', 'traditional_winger', 'inside_forward', 'wide_midfielder']
export const FORWARD_ROLES = ['target_man', 'poacher', 'false_nine', 'advanced_forward', 'complete_forward']

export const ROLE_LABELS: Record<string, string> = {
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

export const DUTY_LABELS: Record<string, string> = {
  defend: 'Défendre',
  support: 'Soutenir',
  attack: 'Attaquer',
}

export const FREEDOM_LABELS: Record<string, string> = {
  stay_position: 'Strictement positionnée',
  roam: 'Peut se décaler',
  free: 'Liberté totale',
}

export const SPECIFIC_TASKS = [
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

/* ─── Filters ─── */
export const POS_FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'GK', label: 'GK' },
  { key: 'DEF', label: 'DÉF' },
  { key: 'MID', label: 'MIL' },
  { key: 'ATT', label: 'ATT' },
] as const

export const posMatchesFilter = (pos: string | undefined, filter: string) => {
  if (filter === 'all') return true
  if (filter === 'GK') return pos === 'GK'
  if (filter === 'DEF') return ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos ?? '')
  if (filter === 'MID') return ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos ?? '')
  if (filter === 'ATT') return ['LW', 'RW', 'ST', 'CF'].includes(pos ?? '')
  return true
}

/* ─── Set pieces ─── */
export const SET_PIECE_TYPES = [
  { key: 'penalties', label: 'Pénaltys', icon: '⚽', max: 3 },
  { key: 'free_kicks_direct', label: 'Coups francs directs', icon: '🎯', max: 3 },
  { key: 'free_kicks_indirect', label: 'Coups francs indirects', icon: '🔄', max: 3 },
  { key: 'corners_left', label: 'Corners gauche', icon: '↙️', max: 3 },
  { key: 'corners_right', label: 'Corners droit', icon: '↘️', max: 3 },
] as const

export const EMPTY_SET_PIECES = {
  penalties: [] as string[],
  free_kicks_direct: [] as string[],
  free_kicks_indirect: [] as string[],
  corners_left: [] as string[],
  corners_right: [] as string[],
}

/* ─── Helpers ─── */
export const formationCategory = (f: string) => {
  if (['3-5-2', '5-3-2', '5-4-1'].includes(f)) return { label: '🛡️ Défensif', cls: 'bg-blue-900/40 text-blue-300' }
  if (['4-1-2-1-2', '3-4-3', '4-1-4-1', '4-3-2-1'].includes(f)) return { label: '⚡ Offensif', cls: 'bg-red-900/40 text-red-300' }
  return { label: '⚖️ Équilibré', cls: 'bg-gray-800 text-gray-300' }
}

/* ─── Interfaces ─── */
export interface PlayerInstruction {
  role: string
  duty: 'defend' | 'support' | 'attack'
  freedom: 'stay_position' | 'roam' | 'free'
  specific_tasks: string[]
}

export interface TacticForm {
  name: string
  formation: string
  passing_style: string
  defensive_block: string
  pressing: string
  description: string
  tempo: string
  width: string
  marking: string
  play_space: string
  gk_distribution: string
  counter_pressing: boolean
  mentality: string
  defensive_shape: string
  buildup_style: string
  transition_speed: string
  offside_trap: boolean
  creative_freedom: string
  defensive_width: string
  pressing_trigger: string
  captains: string[]
  set_pieces: {
    penalties: string[]
    free_kicks_direct: string[]
    free_kicks_indirect: string[]
    corners_left: string[]
    corners_right: string[]
  }
}

export interface Tactic {
  id: string
  formation?: string
  name?: string
  passing_style?: string
  defensive_block?: string
  pressing?: string
  description?: string
  style?: string
  tempo?: string
  width?: string
  marking?: string
  play_space?: string
  gk_distribution?: string
  counter_pressing?: boolean
  mentality?: string
  defensive_shape?: string
  buildup_style?: string
  transition_speed?: string
  offside_trap?: boolean
  creative_freedom?: string
  defensive_width?: string
  pressing_trigger?: string
  captains?: string[]
  set_pieces?: Record<string, string[]>
  starters?: string[] | Record<string, string>
  substitutes?: string[]
  player_instructions?: Record<string, PlayerInstruction>
  instructions?: {
    passing_style?: string
    pressing?: string
    defensive_block?: string
    marking?: string
    tempo?: string
    width?: string
    play_space?: string
    gk_distribution?: string
    counter_pressing?: boolean
    mentality?: string
    defensive_shape?: string
    buildup_style?: string
    transition_speed?: string
    offside_trap?: boolean
    creative_freedom?: string
    defensive_width?: string
    pressing_trigger?: string
  }
}
