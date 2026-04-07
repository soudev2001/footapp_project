import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { useState, useRef } from 'react'
import { Upload, Send, UserPlus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function Onboarding() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvData, setCsvData] = useState<{ preview: unknown[]; total: number } | null>(null)
  const [tab, setTab] = useState<'import' | 'invitations'>('import')

  const { data: invitations, isLoading: invLoading } = useQuery({
    queryKey: ['admin-invitations'],
    queryFn: () => adminApi.invitations().then((r) => r.data),
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return adminApi.importCSV(fd)
    },
    onSuccess: (res) => setCsvData(res.data),
  })

  const confirmMutation = useMutation({
    mutationFn: () => adminApi.confirmImport({}),
    onSuccess: () => {
      setCsvData(null)
      qc.invalidateQueries({ queryKey: ['admin-invitations'] })
    },
  })

  const resendMutation = useMutation({
    mutationFn: (ids: string[]) => adminApi.resendInvitations({ member_ids: ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-invitations'] }),
  })

  const tabs = [
    { key: 'import' as const, label: 'Import CSV', icon: <Upload size={16} /> },
    { key: 'invitations' as const, label: 'Invitations', icon: <Send size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <UserPlus size={22} className="text-pitch-500" /> Intégration
      </h1>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === t.key ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'import' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Importer des membres (CSV)</h2>
          <p className="text-sm text-gray-400">
            Le fichier doit contenir : email, first_name, last_name, role, position (optionnel)
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importMutation.mutate(f)
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-primary"
            disabled={importMutation.isPending}
          >
            <Upload size={16} /> {importMutation.isPending ? 'Analyse...' : 'Choisir un fichier CSV'}
          </button>

          {csvData && (
            <div className="space-y-3 border-t border-gray-800 pt-4">
              <p className="text-sm text-gray-300">
                <strong>{csvData.total}</strong> membres détectés
              </p>
              <div className="max-h-60 overflow-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Nom</th>
                      <th className="px-3 py-2 text-left">Rôle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(csvData.preview as { email: string; first_name: string; last_name: string; role: string }[]).map((row, i) => (
                      <tr key={i} className="border-t border-gray-800">
                        <td className="px-3 py-2 text-gray-300">{row.email}</td>
                        <td className="px-3 py-2 text-white">{row.first_name} {row.last_name}</td>
                        <td className="px-3 py-2 text-gray-400">{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => confirmMutation.mutate()}
                className="btn-primary"
                disabled={confirmMutation.isPending}
              >
                <CheckCircle size={16} /> Confirmer l'import
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'invitations' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Tableau des invitations</h2>
          {invLoading && <p className="text-gray-400">Chargement...</p>}

          {invitations && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Envoyées', value: invitations.sent ?? 0, color: 'text-blue-400' },
                  { label: 'Acceptées', value: invitations.accepted ?? 0, color: 'text-green-400' },
                  { label: 'En attente', value: invitations.pending ?? 0, color: 'text-yellow-400' },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {invitations.items?.length > 0 && (
                <div className="max-h-72 overflow-auto rounded-lg border border-gray-800">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-400 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Statut</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.items.map((inv: { id: string; email: string; status: string }) => (
                        <tr key={inv.id} className="border-t border-gray-800">
                          <td className="px-3 py-2 text-gray-300">{inv.email}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                              inv.status === 'accepted' ? 'text-green-400' :
                              inv.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {inv.status === 'accepted' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                              {inv.status === 'accepted' ? 'Accepté' : inv.status === 'pending' ? 'En attente' : 'Expiré'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {inv.status === 'pending' && (
                              <button
                                onClick={() => resendMutation.mutate([inv.id])}
                                className="text-pitch-400 hover:text-pitch-300 text-xs flex items-center gap-1 ml-auto"
                              >
                                <RefreshCw size={12} /> Renvoyer
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
