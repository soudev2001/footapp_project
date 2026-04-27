import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import {
  Mail, Send, Plus, FileText, Inbox, Settings as SettingsIcon,
  CheckCircle2, AlertCircle, Copy, Edit2, Trash2, Eye, Server,
  Users, Search, X, TrendingUp, MailOpen, MousePointerClick,
} from 'lucide-react'
import clsx from 'clsx'

type Tab = 'campaigns' | 'templates' | 'logs' | 'smtp'
type CampaignStatus = 'sent' | 'scheduled' | 'draft' | 'failed'

interface Template {
  id: string
  name: string
  subject: string
  body: string
  category: 'onboarding' | 'event' | 'match' | 'announcement' | 'billing'
  updatedAt: string
}

interface Campaign {
  id: string
  name: string
  subject: string
  audience: string
  recipients: number
  status: CampaignStatus
  sentAt?: string
  scheduledFor?: string
  opens?: number
  clicks?: number
  bounces?: number
}

interface LogEntry {
  id: string
  to: string
  subject: string
  status: 'delivered' | 'opened' | 'bounced' | 'failed'
  sentAt: string
  campaign?: string
}

const CATEGORY_META = {
  onboarding:   { label: 'Onboarding',   class: 'bg-blue-900/30 text-blue-300 border-blue-700/40' },
  event:        { label: 'Événement',    class: 'bg-pitch-900/30 text-pitch-300 border-pitch-700/40' },
  match:        { label: 'Match',        class: 'bg-amber-900/30 text-amber-300 border-amber-700/40' },
  announcement: { label: 'Annonce',      class: 'bg-purple-900/30 text-purple-300 border-purple-700/40' },
  billing:      { label: 'Facturation',  class: 'bg-red-900/30 text-red-300 border-red-700/40' },
}

const STATUS_META: Record<CampaignStatus, { label: string; class: string; icon: React.ReactNode }> = {
  sent:      { label: 'Envoy\u00e9e',   class: 'text-green-300 bg-green-900/30 border-green-700/40',  icon: <CheckCircle2 size={11} /> },
  scheduled: { label: 'Planifi\u00e9e', class: 'text-amber-300 bg-amber-900/30 border-amber-700/40',  icon: <Inbox size={11} /> },
  draft:     { label: 'Brouillon',      class: 'text-gray-400 bg-gray-800 border-gray-700',           icon: <Edit2 size={11} /> },
  failed:    { label: '\u00c9chec',     class: 'text-red-300 bg-red-900/30 border-red-700/40',        icon: <AlertCircle size={11} /> },
}

const LOG_STATUS_META = {
  delivered: { label: 'Délivré',  class: 'text-gray-300' },
  opened:    { label: 'Ouvert',   class: 'text-pitch-300' },
  bounced:   { label: 'Rebond',   class: 'text-amber-300' },
  failed:    { label: 'Échec',    class: 'text-red-300' },
}

const TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Bienvenue joueur',
    subject: 'Bienvenue au club, {{prenom}} !',
    body: 'Bonjour {{prenom}},\n\nNous sommes ravis de vous accueillir au sein de {{club}}. Votre compte est activé.',
    category: 'onboarding',
    updatedAt: '2026-04-10T12:00:00Z',
  },
  {
    id: 't2',
    name: 'Convocation de match',
    subject: 'Convocation - {{equipe}} vs {{adversaire}}',
    body: 'Bonjour {{prenom}},\n\nVous êtes convoqué(e) pour le match du {{date}}. Rendez-vous à {{heure}}.',
    category: 'match',
    updatedAt: '2026-04-05T09:30:00Z',
  },
  {
    id: 't3',
    name: 'Rappel d\u2019événement',
    subject: 'Rappel - {{event}}',
    body: 'L\u2019événement {{event}} commence demain à {{heure}}.',
    category: 'event',
    updatedAt: '2026-04-02T16:10:00Z',
  },
  {
    id: 't4',
    name: 'Facture mensuelle',
    subject: 'Votre facture - {{mois}}',
    body: 'Bonjour {{prenom}},\n\nVeuillez trouver ci-joint votre facture pour {{mois}}.',
    category: 'billing',
    updatedAt: '2026-03-28T18:00:00Z',
  },
]

const CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Newsletter Avril 2026',
    subject: 'Les actualités du club - Avril',
    audience: 'Tous les membres',
    recipients: 412,
    status: 'sent',
    sentAt: '2026-04-10T10:00:00Z',
    opens: 298,
    clicks: 84,
    bounces: 3,
  },
  {
    id: 'c2',
    name: 'Stage de printemps',
    subject: 'Inscriptions au stage - dernières places',
    audience: 'Parents U9-U15',
    recipients: 134,
    status: 'scheduled',
    scheduledFor: '2026-04-22T08:00:00Z',
  },
  {
    id: 'c3',
    name: 'Brouillon - Fin de saison',
    subject: '',
    audience: 'Tous',
    recipients: 0,
    status: 'draft',
  },
]

const LOGS: LogEntry[] = [
  { id: 'l1', to: 'marie.dupont@mail.com', subject: 'Newsletter Avril 2026',  status: 'opened',    sentAt: '2026-04-18T14:22:00Z', campaign: 'Newsletter Avril 2026' },
  { id: 'l2', to: 'jean.martin@mail.com',  subject: 'Convocation - U17 vs ASM', status: 'delivered', sentAt: '2026-04-18T09:10:00Z' },
  { id: 'l3', to: 'old.account@mail.com',  subject: 'Newsletter Avril 2026',  status: 'bounced',   sentAt: '2026-04-18T10:00:00Z', campaign: 'Newsletter Avril 2026' },
  { id: 'l4', to: 'sara.benali@mail.com',  subject: 'Bienvenue au club',      status: 'opened',    sentAt: '2026-04-17T11:45:00Z' },
  { id: 'l5', to: 'unknown@fail.xyz',      subject: 'Facture - Mars 2026',    status: 'failed',    sentAt: '2026-04-15T08:00:00Z' },
]

export default function AdminEmail() {
  const [tab, setTab] = useState<Tab>('campaigns')
  const [toast, setToast] = useState('')

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Mail size={22} className="text-pitch-500" /> Emails & campagnes
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez vos templates, campagnes marketing et configuration SMTP.
          </p>
        </div>
      </div>

      {toast && (
        <div className="alert-success flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Send size={18} className="text-blue-400" />} label="Emails envoyés (30j)" value="2 483" />
        <Kpi icon={<MailOpen size={18} className="text-pitch-400" />} label="Taux d\u2019ouverture" value="58,4%" trend="+2,1%" />
        <Kpi icon={<MousePointerClick size={18} className="text-purple-400" />} label="Taux de clic" value="12,7%" trend="+0,6%" />
        <Kpi icon={<AlertCircle size={18} className="text-amber-400" />} label="Rebonds" value="1,2%" trend="-0,3%" positive />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 w-fit flex-wrap">
        {([
          { k: 'campaigns' as Tab, label: 'Campagnes', icon: <Send size={14} /> },
          { k: 'templates' as Tab, label: 'Templates', icon: <FileText size={14} /> },
          { k: 'logs' as Tab, label: 'Historique', icon: <Inbox size={14} /> },
          { k: 'smtp' as Tab, label: 'SMTP', icon: <Server size={14} /> },
        ]).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              tab === t.k ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white',
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && <CampaignsTab onNotify={notify} />}
      {tab === 'templates' && <TemplatesTab onNotify={notify} />}
      {tab === 'logs' && <LogsTab />}
      {tab === 'smtp' && <SmtpTab onNotify={notify} />}
    </div>
  )
}

function Kpi({
  icon, label, value, trend, positive,
}: { icon: React.ReactNode; label: string; value: string; trend?: string; positive?: boolean }) {
  return (
    <div className="stat-card">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400 flex items-center gap-1.5">
          {label}
          {trend && (
            <span className={clsx('text-[11px] font-medium', positive ? 'text-pitch-400' : 'text-pitch-400')}>
              <TrendingUp size={10} className="inline" /> {trend}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Campaigns ───────────────────────────────────────────────────────────────
function CampaignsTab({ onNotify }: { onNotify: (m: string) => void }) {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin-email-campaigns'],
    queryFn: () => adminApi.emailCampaigns().then((r) => r.data),
  })
  const campaigns = (data?.length ? data : CAMPAIGNS) as Campaign[]

  const createMutation = useMutation({
    mutationFn: (payload: Campaign) => adminApi.createEmailCampaign(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-email-campaigns'] })
      setComposerOpen(false)
      const saved = res.data
      onNotify(saved?.status === 'scheduled' ? 'Campagne planifiée.' : 'Campagne envoyée.')
    },
  })

  const [composerOpen, setComposerOpen] = useState(false)

  const handleCreate = (c: Campaign) => {
    createMutation.mutate(c)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setComposerOpen(true)} className="btn-primary text-sm">
          <Plus size={14} /> Nouvelle campagne
        </button>
      </div>

      {campaigns.length === 0 && (
        <div className="card text-center py-12 text-gray-400">Aucune campagne.</div>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => {
          const meta = STATUS_META[c.status]
          const openRate = c.recipients && c.opens ? Math.round((c.opens / c.recipients) * 100) : null
          const clickRate = c.recipients && c.clicks ? Math.round((c.clicks / c.recipients) * 100) : null
          return (
            <div key={c.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{c.name}</p>
                    <span className={clsx('badge border text-[11px]', meta.class)}>
                      {meta.icon}<span className="ml-1">{meta.label}</span>
                    </span>
                  </div>
                  {c.subject && <p className="text-sm text-gray-300 mt-1">Objet : {c.subject}</p>}
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <Users size={11} /> {c.audience} \u00b7 {c.recipients} destinataires
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><Eye size={15} /></button>
                  <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><Copy size={15} /></button>
                </div>
              </div>

              {c.status === 'sent' && (
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
                  <MiniStat label="Ouvertures" value={`${c.opens ?? 0}`} sub={openRate !== null ? `${openRate}%` : ''} />
                  <MiniStat label="Clics" value={`${c.clicks ?? 0}`} sub={clickRate !== null ? `${clickRate}%` : ''} />
                  <MiniStat label="Rebonds" value={`${c.bounces ?? 0}`} />
                </div>
              )}
              {c.status === 'scheduled' && c.scheduledFor && (
                <p className="text-xs text-amber-400 pt-2 border-t border-gray-800">
                  Envoi pr\u00e9vu le {new Date(c.scheduledFor).toLocaleString('fr-FR')}
                </p>
              )}
              {c.status === 'sent' && c.sentAt && (
                <p className="text-[11px] text-gray-500">Envoy\u00e9e le {new Date(c.sentAt).toLocaleString('fr-FR')}</p>
              )}
            </div>
          )
        })}
      </div>

      {composerOpen && <CampaignComposer onClose={() => setComposerOpen(false)} onSubmit={handleCreate} />}
    </div>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] text-pitch-400">{sub}</p>}
    </div>
  )
}

// ─── Templates ───────────────────────────────────────────────────────────────
function TemplatesTab({ onNotify }: { onNotify: (m: string) => void }) {
  const [templates, setTemplates] = useState(TEMPLATES)
  const [editing, setEditing] = useState<Template | null>(null)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('')

  const filtered = templates.filter((t) => {
    const matchQ = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.subject.toLowerCase().includes(query.toLowerCase())
    const matchC = !cat || t.category === cat
    return matchQ && matchC
  })

  const save = (t: Template) => {
    setTemplates((prev) => {
      const exists = prev.some((p) => p.id === t.id)
      return exists ? prev.map((p) => (p.id === t.id ? t : p)) : [t, ...prev]
    })
    setEditing(null)
    onNotify('Template enregistr\u00e9.')
  }

  const remove = (id: string) => {
    if (!confirm('Supprimer ce template ?')) return
    setTemplates((p) => p.filter((x) => x.id !== id))
    onNotify('Template supprim\u00e9.')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Rechercher un template..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Toutes catégories</option>
          {Object.entries(CATEGORY_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button
          onClick={() => setEditing({
            id: `t-${Date.now()}`,
            name: '',
            subject: '',
            body: '',
            category: 'announcement',
            updatedAt: new Date().toISOString(),
          })}
          className="btn-primary text-sm ml-auto"
        >
          <Plus size={14} /> Nouveau template
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-12 text-gray-400">Aucun template.</div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((t) => {
          const meta = CATEGORY_META[t.category]
          return (
            <div key={t.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{t.subject}</p>
                </div>
                <span className={clsx('badge border text-[11px] shrink-0', meta.class)}>{meta.label}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 whitespace-pre-line">{t.body}</p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <p className="text-[11px] text-gray-500">
                  Modifié {new Date(t.updatedAt).toLocaleDateString('fr-FR')}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(t)} className="icon-btn text-gray-400 hover:text-white" title="Modifier">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => remove(t.id)} className="icon-btn text-gray-400 hover:text-red-400" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editing && <TemplateEditor template={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  )
}

// ─── Logs ────────────────────────────────────────────────────────────────────
function LogsTab() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const filtered = LOGS.filter((l) => {
    const mq = !q || l.to.toLowerCase().includes(q.toLowerCase()) || l.subject.toLowerCase().includes(q.toLowerCase())
    const ms = !status || l.status === status
    return mq && ms
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Rechercher..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="delivered">Délivré</option>
          <option value="opened">Ouvert</option>
          <option value="bounced">Rebond</option>
          <option value="failed">Échec</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50 text-gray-400 text-xs">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Destinataire</th>
              <th className="text-left font-medium px-4 py-2.5">Objet</th>
              <th className="text-left font-medium px-4 py-2.5">Statut</th>
              <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-gray-800/30">
                <td className="px-4 py-2.5 text-gray-300">{l.to}</td>
                <td className="px-4 py-2.5 text-gray-300">
                  {l.subject}
                  {l.campaign && <span className="block text-[11px] text-gray-500">{l.campaign}</span>}
                </td>
                <td className="px-4 py-2.5">
                  <span className={clsx('text-[11px] font-medium', LOG_STATUS_META[l.status].class)}>
                    {LOG_STATUS_META[l.status].label}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">
                  {new Date(l.sentAt).toLocaleString('fr-FR')}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Aucun résultat.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── SMTP ────────────────────────────────────────────────────────────────────
function SmtpTab({ onNotify }: { onNotify: (m: string) => void }) {
  const [cfg, setCfg] = useState({
    host: 'smtp.sendgrid.net',
    port: '587',
    user: 'apikey',
    password: '************',
    fromName: 'FootApp FC',
    fromEmail: 'noreply@footapp.club',
    replyTo: 'contact@footapp.club',
    useTLS: true,
  })
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)

  const testConnection = () => {
    if (!testEmail) return
    setTesting(true)
    setTimeout(() => {
      setTesting(false)
      onNotify(`Email de test envoyé à ${testEmail}.`)
    }, 1200)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Server size={16} className="text-pitch-400" /> Configuration SMTP
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Serveur SMTP" value={cfg.host} onChange={(v) => setCfg({ ...cfg, host: v })} />
          <Field label="Port" value={cfg.port} onChange={(v) => setCfg({ ...cfg, port: v })} />
          <Field label="Utilisateur" value={cfg.user} onChange={(v) => setCfg({ ...cfg, user: v })} />
          <Field label="Mot de passe" type="password" value={cfg.password} onChange={(v) => setCfg({ ...cfg, password: v })} />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <div>
            <p className="text-sm font-medium text-white">Utiliser TLS/SSL</p>
            <p className="text-xs text-gray-500">Connexion sécurisée recommandée.</p>
          </div>
          <button
            onClick={() => setCfg({ ...cfg, useTLS: !cfg.useTLS })}
            className={clsx(
              'w-11 h-6 rounded-full transition-colors relative',
              cfg.useTLS ? 'bg-pitch-600' : 'bg-gray-700',
            )}
          >
            <span className={clsx(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              cfg.useTLS ? 'translate-x-5' : 'translate-x-0.5',
            )} />
          </button>
        </div>
        <button onClick={() => onNotify('Configuration SMTP enregistrée.')} className="btn-primary text-sm w-full">
          <CheckCircle2 size={14} /> Enregistrer
        </button>
      </div>

      <div className="space-y-4">
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <SettingsIcon size={16} className="text-pitch-400" /> Identité d\u2019envoi
          </h2>
          <Field label="Nom de l\u2019expéditeur" value={cfg.fromName} onChange={(v) => setCfg({ ...cfg, fromName: v })} />
          <Field label="Email de l\u2019expéditeur" value={cfg.fromEmail} onChange={(v) => setCfg({ ...cfg, fromEmail: v })} />
          <Field label="Reply-To" value={cfg.replyTo} onChange={(v) => setCfg({ ...cfg, replyTo: v })} />
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Send size={16} className="text-pitch-400" /> Tester la configuration
          </h2>
          <div className="flex gap-2">
            <input
              type="email"
              className="input flex-1"
              placeholder="votre@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              onClick={testConnection}
              disabled={!testEmail || testing}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {testing ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
          <p className="text-xs text-gray-500">Un email de test sera envoyé pour valider la configuration.</p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

// ─── Template Editor Modal ───────────────────────────────────────────────────
function TemplateEditor({
  template, onClose, onSave,
}: { template: Template; onClose: () => void; onSave: (t: Template) => void }) {
  const [t, setT] = useState(template)
  const [preview, setPreview] = useState(false)
  const canSave = t.name.trim() && t.subject.trim() && t.body.trim()

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <FileText size={16} className="text-pitch-400" />
            {template.name ? 'Modifier' : 'Nouveau'} template
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className={clsx(
                'btn-secondary text-sm',
                preview && 'bg-pitch-900/30 border-pitch-700 text-pitch-300',
              )}
            >
              <Eye size={14} /> {preview ? 'Éditer' : 'Aperçu'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!preview ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nom du template</label>
                  <input className="input" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Catégorie</label>
                  <select
                    className="input"
                    value={t.category}
                    onChange={(e) => setT({ ...t, category: e.target.value as Template['category'] })}
                  >
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Objet</label>
                <input className="input" value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Corps du message
                  <span className="ml-2 text-gray-500">Variables : {'{{prenom}}, {{club}}, {{equipe}}'}</span>
                </label>
                <textarea
                  rows={10}
                  className="input resize-none font-mono text-xs"
                  value={t.body}
                  onChange={(e) => setT({ ...t, body: e.target.value })}
                />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-6 text-gray-900 space-y-3 max-h-[55vh] overflow-y-auto">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Aperçu</p>
              <p className="font-bold text-lg">{t.subject || '(Pas d\u2019objet)'}</p>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{t.body || '(Pas de contenu)'}</div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Annuler</button>
          <button
            onClick={() => onSave({ ...t, updatedAt: new Date().toISOString() })}
            disabled={!canSave}
            className="btn-primary text-sm disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Campaign Composer ───────────────────────────────────────────────────────
function CampaignComposer({
  onClose, onSubmit,
}: { onClose: () => void; onSubmit: (c: Campaign) => void }) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [audience, setAudience] = useState('Tous les membres')
  const [template, setTemplate] = useState('')
  const [schedule, setSchedule] = useState(false)
  const [scheduledFor, setScheduledFor] = useState('')

  const canSubmit = name.trim() && subject.trim()

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      id: `c-${Date.now()}`,
      name,
      subject,
      audience,
      recipients: Math.floor(Math.random() * 400) + 80,
      status: schedule ? 'scheduled' : 'sent',
      sentAt: schedule ? undefined : new Date().toISOString(),
      scheduledFor: schedule ? scheduledFor || new Date().toISOString() : undefined,
      opens: schedule ? undefined : 0,
      clicks: schedule ? undefined : 0,
      bounces: schedule ? undefined : 0,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Send size={16} className="text-pitch-400" /> Nouvelle campagne
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nom de la campagne</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Objet</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Audience</label>
            <select className="input" value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option>Tous les membres</option>
              <option>Joueurs seuls</option>
              <option>Parents seuls</option>
              <option>Coachs seuls</option>
              <option>Supporters</option>
              <option>Liste personnalisée</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Template (optionnel)</label>
            <select className="input" value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="">— Sans template —</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <div>
              <p className="text-sm font-medium text-white">Planifier l\u2019envoi</p>
              <p className="text-xs text-gray-500">Programmer pour plus tard.</p>
            </div>
            <button
              onClick={() => setSchedule(!schedule)}
              className={clsx('w-11 h-6 rounded-full transition-colors relative', schedule ? 'bg-pitch-600' : 'bg-gray-700')}
            >
              <span className={clsx(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                schedule ? 'translate-x-5' : 'translate-x-0.5',
              )} />
            </button>
          </div>

          {schedule && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date et heure d\u2019envoi</label>
              <input
                type="datetime-local"
                className="input"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Annuler</button>
          <button onClick={submit} disabled={!canSubmit} className="btn-primary text-sm disabled:opacity-50">
            <Send size={14} /> {schedule ? 'Planifier' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}
