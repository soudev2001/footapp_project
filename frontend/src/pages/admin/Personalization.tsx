import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { useAuthStore } from '../../store/auth'
import {
  Palette, Upload, Image as ImageIcon, Check, Save, RefreshCcw,
  Eye, Globe, Bell as BellIcon, Monitor, Moon, Sun, Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import type { ClubPersonalization } from '../../types'

type Theme = 'dark' | 'light' | 'auto'
type Density = 'comfortable' | 'compact'

interface Branding {
  clubName: string
  tagline: string
  primaryColor: string
  accentColor: string
  logoUrl: string | null
  coverUrl: string | null
}

const COLOR_PRESETS = [
  { name: 'Pitch', primary: '#22c55e', accent: '#16a34a' },
  { name: 'Royal', primary: '#3b82f6', accent: '#1d4ed8' },
  { name: 'Crimson', primary: '#ef4444', accent: '#b91c1c' },
  { name: 'Amber', primary: '#f59e0b', accent: '#b45309' },
  { name: 'Violet', primary: '#8b5cf6', accent: '#6d28d9' },
  { name: 'Teal', primary: '#14b8a6', accent: '#0f766e' },
]

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
]

const TIMEZONES = [
  'Europe/Paris', 'Europe/London', 'Africa/Casablanca', 'America/New_York', 'UTC',
]

export default function Personalization() {
  const qc = useQueryClient()
  const { user, setUser } = useAuthStore()
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const { data: savedData } = useQuery({
    queryKey: ['admin-personalization'],
    queryFn: () => adminApi.personalization().then((r) => r.data),
  })
  const saveMutation = useMutation({
    mutationFn: (payload: object) => adminApi.updatePersonalization(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-personalization'] })
      if (user) {
        setUser({
          ...user,
          club_personalization: {
            ...(user.club_personalization ?? {}),
            ...buildPersonalizationPayload({
              branding,
              theme,
              density,
              language,
              timezone,
              dateFormat,
              showSidebarLabels,
              animations,
              toastSound,
            }),
          },
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })
  const logoUploadMutation = useMutation({
    mutationFn: (formData: FormData) => adminApi.uploadClubLogo(formData),
    onSuccess: (response) => {
      const logoUrl = response.data.url as string
      setBranding((current) => ({ ...current, logoUrl }))
      qc.invalidateQueries({ queryKey: ['admin-personalization'] })
      if (user) {
        setUser({
          ...user,
          club_personalization: {
            ...(user.club_personalization ?? {}),
            logoUrl,
          },
        })
      }
    },
  })
  const coverUploadMutation = useMutation({
    mutationFn: (formData: FormData) => adminApi.uploadClubCover(formData),
    onSuccess: (response) => {
      const coverUrl = response.data.url as string
      setBranding((current) => ({ ...current, coverUrl }))
      qc.invalidateQueries({ queryKey: ['admin-personalization'] })
      if (user) {
        setUser({
          ...user,
          club_personalization: {
            ...(user.club_personalization ?? {}),
            coverUrl,
          },
        })
      }
    },
  })

  const [branding, setBranding] = useState<Branding>({
    clubName: 'FootApp FC',
    tagline: 'Le club de demain, aujourd\u2019hui.',
    primaryColor: '#22c55e',
    accentColor: '#16a34a',
    logoUrl: null,
    coverUrl: null,
  })
  const [theme, setTheme] = useState<Theme>('dark')
  const [density, setDensity] = useState<Density>('comfortable')
  const [language, setLanguage] = useState('fr')
  const [timezone, setTimezone] = useState('Europe/Paris')
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy')
  const [showSidebarLabels, setShowSidebarLabels] = useState(true)
  const [animations, setAnimations] = useState(true)
  const [toastSound, setToastSound] = useState(false)
  const [saved, setSaved] = useState(false)

  // Hydrate from server data when loaded
  useEffect(() => {
    if (!savedData) return
    setBranding({
      clubName: savedData.clubName ?? 'FootApp FC',
      tagline: savedData.tagline ?? 'Le club de demain, aujourd\u2019hui.',
      primaryColor: savedData.primaryColor ?? '#22c55e',
      accentColor: savedData.accentColor ?? '#16a34a',
      logoUrl: savedData.logoUrl ?? null,
      coverUrl: savedData.coverUrl ?? null,
    })
    if (savedData.theme) setTheme(savedData.theme)
    if (savedData.density) setDensity(savedData.density)
    if (savedData.language) setLanguage(savedData.language)
    if (savedData.timezone) setTimezone(savedData.timezone)
    if (savedData.dateFormat) setDateFormat(savedData.dateFormat)
    if (savedData.showSidebarLabels !== undefined) setShowSidebarLabels(savedData.showSidebarLabels)
    if (savedData.animations !== undefined) setAnimations(savedData.animations)
    if (savedData.toastSound !== undefined) setToastSound(savedData.toastSound)
  }, [savedData])

  const applyPreset = (p: typeof COLOR_PRESETS[number]) => {
    setBranding((b) => ({ ...b, primaryColor: p.primary, accentColor: p.accent }))
  }

  const handleImageError = (key: 'logoUrl' | 'coverUrl') => () => {
    setFailedImages((prev) => new Set([...prev, key]))
  }

  const handleFile = (key: 'logoUrl' | 'coverUrl') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFailedImages((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    const formData = new FormData()
    formData.append('file', file)
    if (key === 'logoUrl') {
      logoUploadMutation.mutate(formData)
      return
    }
    coverUploadMutation.mutate(formData)
  }

  const handleSave = () => {
    saveMutation.mutate(buildPersonalizationPayload({
      branding,
      theme,
      density,
      language,
      timezone,
      dateFormat,
      showSidebarLabels,
      animations,
      toastSound,
    }))
  }

  const handleReset = () => {
    if (!confirm('R\u00e9initialiser toutes les pr\u00e9f\u00e9rences de personnalisation ?')) return
    setBranding({
      clubName: 'FootApp FC',
      tagline: 'Le club de demain, aujourd\u2019hui.',
      primaryColor: '#22c55e',
      accentColor: '#16a34a',
      logoUrl: null,
      coverUrl: null,
    })
    setTheme('dark')
    setDensity('comfortable')
    setLanguage('fr')
    setTimezone('Europe/Paris')
    setDateFormat('dd/MM/yyyy')
    setShowSidebarLabels(true)
    setAnimations(true)
    setToastSound(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Palette size={22} className="text-pitch-500" /> Personnalisation
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Adaptez l\u2019identit\u00e9 visuelle et l\u2019exp\u00e9rience utilisateur pour votre club.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary text-sm">
            <RefreshCcw size={14} /> R\u00e9initialiser
          </button>
          <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary text-sm">
            <Save size={14} /> {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="alert-success flex items-center gap-2">
          <Check size={16} /> Pr\u00e9f\u00e9rences enregistr\u00e9es avec succ\u00e8s.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Branding */}
        <div className="card space-y-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-pitch-400" />
            <h2 className="font-semibold text-white">Identit\u00e9 du club</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nom du club</label>
              <input
                className="input"
                value={branding.clubName}
                onChange={(e) => setBranding({ ...branding, clubName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Slogan</label>
              <input
                className="input"
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Logo</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                  {branding.logoUrl && !failedImages.has('logo') ? (
                    <img src={branding.logoUrl} alt="logo" className="w-full h-full object-cover" onError={() => setFailedImages(f => new Set([...f, 'logo']))} />
                  ) : (
                    <ImageIcon size={22} className="text-gray-600" />
                  )}
                </div>
                <label className="btn-secondary text-sm cursor-pointer">
                  <Upload size={14} /> {logoUploadMutation.isPending ? 'Import…' : 'Importer'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile('logoUrl')} />
                </label>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">PNG/SVG, 512x512 recommand\u00e9.</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">Banni\u00e8re</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-16 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                  {branding.coverUrl && !failedImages.has('cover') ? (
                    <img src={branding.coverUrl} alt="banner" className="w-full h-full object-cover" onError={() => setFailedImages(f => new Set([...f, 'cover']))} />
                  ) : (
                    <ImageIcon size={22} className="text-gray-600" />
                  )}
                </div>
                <label className="btn-secondary text-sm cursor-pointer">
                  <Upload size={14} /> {coverUploadMutation.isPending ? 'Import…' : 'Importer'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile('coverUrl')} />
                </label>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">1600x400 recommand\u00e9.</p>
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Couleurs du club</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 transition-colors',
                    branding.primaryColor === p.primary
                      ? 'border-pitch-500 bg-pitch-900/20 text-pitch-300'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600',
                  )}
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: p.primary }} />
                  {p.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-10 h-10 bg-transparent border border-gray-700 rounded-lg cursor-pointer"
                />
                <div>
                  <p className="text-[11px] text-gray-500">Primaire</p>
                  <p className="text-sm text-gray-300 font-mono">{branding.primaryColor}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="w-10 h-10 bg-transparent border border-gray-700 rounded-lg cursor-pointer"
                />
                <div>
                  <p className="text-[11px] text-gray-500">Accent</p>
                  <p className="text-sm text-gray-300 font-mono">{branding.accentColor}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-pitch-400" />
            <h2 className="font-semibold text-white">Aper\u00e7u</h2>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-800">
            <div
              className="h-20 relative"
              style={{
                background: branding.coverUrl && !failedImages.has('cover-preview')
                  ? `url(${branding.coverUrl}) center/cover`
                  : `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})`,
              }}
            >
              {branding.coverUrl && !failedImages.has('cover-preview') && (
                <img src={branding.coverUrl} alt="" className="hidden" onError={() => setFailedImages(f => new Set([...f, 'cover-preview']))} />
              )}
              <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-xl border-2 border-gray-900 bg-gray-800 overflow-hidden flex items-center justify-center">
                {branding.logoUrl && !failedImages.has('logo-preview') ? (
                  <img src={branding.logoUrl} alt="" className="w-full h-full object-cover" onError={() => setFailedImages(f => new Set([...f, 'logo-preview']))} />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {branding.clubName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </span>
                )}
              </div>
            </div>
            <div className="pt-8 px-4 pb-4 bg-gray-800/40">
              <p className="font-semibold text-white">{branding.clubName}</p>
              <p className="text-xs text-gray-400">{branding.tagline}</p>
              <button
                className="mt-3 w-full py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: branding.primaryColor }}
              >
                Bouton primaire
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* UI prefs */}
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-pitch-400" />
            <h2 className="font-semibold text-white">Apparence & interface</h2>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Th\u00e8me</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'dark' as Theme, label: 'Sombre', icon: <Moon size={14} /> },
                { v: 'light' as Theme, label: 'Clair', icon: <Sun size={14} /> },
                { v: 'auto' as Theme, label: 'Auto', icon: <Monitor size={14} /> },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setTheme(o.v)}
                  className={clsx(
                    'flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-colors',
                    theme === o.v
                      ? 'border-pitch-500 bg-pitch-900/20 text-pitch-300'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600',
                  )}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Densit\u00e9</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'comfortable' as Density, label: 'Confortable' },
                { v: 'compact' as Density, label: 'Compacte' },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setDensity(o.v)}
                  className={clsx(
                    'py-2 rounded-lg text-sm border transition-colors',
                    density === o.v
                      ? 'border-pitch-500 bg-pitch-900/20 text-pitch-300'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <Toggle
            label="Afficher les libell\u00e9s dans la barre lat\u00e9rale"
            desc="Masquer pour un affichage plus compact."
            value={showSidebarLabels}
            onChange={setShowSidebarLabels}
          />
          <Toggle
            label="Animations d\u2019interface"
            desc="D\u00e9sactiver pour am\u00e9liorer les performances."
            value={animations}
            onChange={setAnimations}
          />
          <Toggle
            label="Son des notifications"
            desc="Jouer un son lorsqu\u2019une notification arrive."
            value={toastSound}
            onChange={setToastSound}
          />
        </div>

        {/* Region */}
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-pitch-400" />
            <h2 className="font-semibold text-white">Langue & r\u00e9gion</h2>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Langue par d\u00e9faut</label>
            <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Fuseau horaire</label>
            <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Format de date</label>
            <select className="input" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
              <option value="dd/MM/yyyy">DD/MM/YYYY</option>
              <option value="MM/dd/yyyy">MM/DD/YYYY</option>
              <option value="yyyy-MM-dd">YYYY-MM-DD</option>
            </select>
          </div>

          <div className="pt-2 border-t border-gray-800 text-xs text-gray-500 flex items-center gap-2">
            <BellIcon size={12} /> Ces pr\u00e9f\u00e9rences s\u2019appliquent \u00e0 tous les nouveaux membres du club.
          </div>
        </div>
      </div>
    </div>
  )
}

function buildPersonalizationPayload({
  branding,
  theme,
  density,
  language,
  timezone,
  dateFormat,
  showSidebarLabels,
  animations,
  toastSound,
}: {
  branding: Branding
  theme: Theme
  density: Density
  language: string
  timezone: string
  dateFormat: string
  showSidebarLabels: boolean
  animations: boolean
  toastSound: boolean
}): ClubPersonalization {
  return {
    ...branding,
    theme,
    density,
    language,
    timezone,
    dateFormat,
    showSidebarLabels,
    animations,
    toastSound,
  }
}

function Toggle({
  label, desc, value, onChange,
}: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={clsx(
          'w-11 h-6 rounded-full transition-colors relative shrink-0',
          value ? 'bg-pitch-600' : 'bg-gray-700',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
