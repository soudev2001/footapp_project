import { useEffect } from 'react'
import { useAuthStore } from '../store/auth'

const DEFAULT_PRIMARY = '#22c55e'
const DEFAULT_ACCENT = '#16a34a'

export function useClubTheme() {
  const personalization = useAuthStore((state) => state.user?.club_personalization)

  useEffect(() => {
    const root = document.documentElement
    const primary = personalization?.primaryColor ?? DEFAULT_PRIMARY
    const accent = personalization?.accentColor ?? DEFAULT_ACCENT
    const resolvedTheme = resolveTheme(personalization?.theme)

    applyRgbVar(root, '--primary-rgb', hexToRgb(primary))
    applyRgbVar(root, '--accent-rgb', hexToRgb(accent))
    applyPitchPalette(root, primary, accent)

    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.dataset.theme = resolvedTheme
    root.dataset.density = personalization?.density ?? 'comfortable'
    root.lang = personalization?.language ?? 'fr'
  }, [personalization])
}

function resolveTheme(theme?: 'dark' | 'light' | 'auto') {
  if (theme === 'light') return 'light'
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

function applyPitchPalette(root: HTMLElement, primaryHex: string, accentHex: string) {
  applyRgbVar(root, '--pitch-50-rgb', mixColors(primaryHex, '#ffffff', 0.9))
  applyRgbVar(root, '--pitch-100-rgb', mixColors(primaryHex, '#ffffff', 0.82))
  applyRgbVar(root, '--pitch-500-rgb', hexToRgb(primaryHex))
  applyRgbVar(root, '--pitch-600-rgb', hexToRgb(accentHex))
  applyRgbVar(root, '--pitch-700-rgb', mixColors(accentHex, '#000000', 0.18))
  applyRgbVar(root, '--pitch-800-rgb', mixColors(accentHex, '#000000', 0.3))
  applyRgbVar(root, '--pitch-900-rgb', mixColors(accentHex, '#000000', 0.45))
}

function applyRgbVar(root: HTMLElement, name: string, rgb: [number, number, number]) {
  root.style.setProperty(name, rgb.join(' '))
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex)
  const value = normalized.slice(1)

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function mixColors(baseHex: string, mixHex: string, mixAmount: number): [number, number, number] {
  const base = hexToRgb(baseHex)
  const mix = hexToRgb(mixHex)

  return base.map((channel, index) => {
    const mixed = Math.round(channel * (1 - mixAmount) + mix[index] * mixAmount)
    return clampChannel(mixed)
  }) as [number, number, number]
}

function normalizeHex(hex: string) {
  const fallback = DEFAULT_PRIMARY
  if (!hex) return fallback

  const candidate = hex.startsWith('#') ? hex : `#${hex}`
  if (/^#[0-9a-fA-F]{6}$/.test(candidate)) return candidate
  if (/^#[0-9a-fA-F]{3}$/.test(candidate)) {
    return `#${candidate[1]}${candidate[1]}${candidate[2]}${candidate[2]}${candidate[3]}${candidate[3]}`
  }
  return fallback
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, value))
}