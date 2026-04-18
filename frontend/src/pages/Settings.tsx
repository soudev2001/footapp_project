import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { authApi } from '../api'
import { Settings as SettingsIcon, Bell, Shield, Globe, Loader2, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'account' | 'notifications' | 'security' | 'language'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'account', label: 'Compte', icon: <SettingsIcon size={16} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { key: 'security', label: 'Sécurité', icon: <Shield size={16} /> },
  { key: 'language', label: 'Langue & région', icon: <Globe size={16} /> },
]

export default function Settings() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('account')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [notifPrefs, setNotifPrefs] = useState({
    match: true, training: true, convocation: true, message: true, announcement: false,
  })

  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm: '' })

  const changePasswordMutation = useMutation({
    mutationFn: (data: object) => authApi.changePassword(data),
    onSuccess: () => { setSuccess('Mot de passe modifié avec succès.'); setPwdForm({ old_password: '', new_password: '', confirm: '' }) },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Erreur lors du changement de mot de passe.')
    },
  })

  const handleChangePassword = () => {
    setError('')
    setSuccess('')
    if (pwdForm.new_password.length < 6) { setError('Le nouveau mot de passe doit contenir au moins 6 caractères.'); return }
    if (pwdForm.new_password !== pwdForm.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    changePasswordMutation.mutate({ old_password: pwdForm.old_password, new_password: pwdForm.new_password })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <SettingsIcon size={22} className="text-pitch-500" /> Paramètres
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx('flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-w-[90px]',
              tab === t.key ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {success && <div className="alert-success flex items-center gap-2"><CheckCircle size={16} />{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      {/* Account tab */}
      {tab === 'account' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Informations du compte</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Prénom</label>
              <p className="input bg-gray-800/30 text-gray-300 cursor-default">{user?.profile?.first_name ?? '—'}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nom</label>
              <p className="input bg-gray-800/30 text-gray-300 cursor-default">{user?.profile?.last_name ?? '—'}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <p className="input bg-gray-800/30 text-gray-300 cursor-default">{user?.email ?? '—'}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Rôle</label>
            <p className="input bg-gray-800/30 text-gray-300 capitalize cursor-default">{user?.role ?? '—'}</p>
          </div>
          <p className="text-xs text-gray-500">Pour modifier vos informations, rendez-vous sur votre <a href="/profile" className="text-pitch-400 hover:underline">profil</a>.</p>
        </div>
      )}

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Préférences de notifications</h2>
          {[
            { key: 'match', label: 'Matchs', desc: 'Convocations et résultats' },
            { key: 'training', label: 'Entraînements', desc: 'Séances et annulations' },
            { key: 'convocation', label: 'Convocations', desc: 'Sélections et rappels' },
            { key: 'message', label: 'Messages', desc: 'Nouveaux messages reçus' },
            { key: 'announcement', label: 'Annonces', desc: 'Actualités du club' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <button
                onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                className={clsx('w-11 h-6 rounded-full transition-colors relative', notifPrefs[key as keyof typeof notifPrefs] ? 'bg-pitch-600' : 'bg-gray-700')}
              >
                <span className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', notifPrefs[key as keyof typeof notifPrefs] ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><Lock size={16} className="text-pitch-400" /> Changer le mot de passe</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={pwdForm.old_password}
                onChange={(e) => setPwdForm((p) => ({ ...p, old_password: e.target.value }))}
                className="input pr-10"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm((p) => ({ ...p, new_password: e.target.value }))}
                className="input pr-10"
                placeholder="Minimum 6 caractères"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={pwdForm.confirm}
              onChange={(e) => setPwdForm((p) => ({ ...p, confirm: e.target.value }))}
              className="input"
              placeholder="Répétez le mot de passe"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={changePasswordMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {changePasswordMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            Changer le mot de passe
          </button>
        </div>
      )}

      {/* Language tab */}
      {tab === 'language' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Langue & région</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Langue de l'interface</label>
            <select className="input">
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Format de date</label>
            <select className="input">
              <option value="dd/MM/yyyy">DD/MM/YYYY</option>
              <option value="MM/dd/yyyy">MM/DD/YYYY</option>
              <option value="yyyy-MM-dd">YYYY-MM-DD</option>
            </select>
          </div>
          <p className="text-xs text-gray-500">Les préférences de langue seront sauvegardées localement.</p>
        </div>
      )}
    </div>
  )
}
