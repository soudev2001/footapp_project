import { useQuery, useQueryClient } from '@tanstack/react-query'
import { playerApi } from '../../api'
import { useState, useRef } from 'react'
import { FolderKanban, FileText, Upload, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react'

const DOC_TYPES = [
  { key: 'identity', label: 'Pièce d\'identité', desc: 'CNI, passeport', emoji: '🪪' },
  { key: 'medical', label: 'Certificat médical', desc: 'Aptitude sport', emoji: '🏥' },
  { key: 'insurance', label: 'Assurance', desc: 'Attestation', emoji: '🛡️' },
  { key: 'license', label: 'Licence', desc: 'Numéro FFF/autre', emoji: '📋' },
  { key: 'photo', label: 'Photo d\'identité', desc: 'Fond blanc recommandé', emoji: '📸' },
]

const ACCEPT: Record<string, string> = {
  photo: 'image/jpeg,image/png,image/webp',
  default: 'image/jpeg,image/png,application/pdf,image/webp',
}

export default function Documents() {
  const qc = useQueryClient()
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const { data: documents, isLoading } = useQuery({
    queryKey: ['player-documents'],
    queryFn: () => playerApi.documents().then((r: any) => r.data),
  })

  const handleUpload = async (docType: string, file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      setUploadErrors((prev) => ({ ...prev, [docType]: 'Fichier trop lourd (8 Mo max)' }))
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    setUploading(docType)
    setUploadErrors((prev) => ({ ...prev, [docType]: '' }))
    try {
      await playerApi.uploadDocument(docType, fd)
      qc.invalidateQueries({ queryKey: ['player-documents'] })
    } catch (e: any) {
      setUploadErrors((prev) => ({ ...prev, [docType]: e?.response?.data?.error ?? 'Erreur upload' }))
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-6 moe-page moe-stagger">
      <h1 className="moe-title text-xl sm:text-2xl text-white flex items-center gap-2">
        <FolderKanban size={22} className="text-pitch-500" /> Documents
      </h1>
      <p className="text-gray-400 text-sm">Téléchargez vos pièces justificatives. Les fichiers acceptés sont JPEG, PNG, WebP et PDF (8 Mo max).</p>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Chargement…
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DOC_TYPES.map(({ key, label, desc, emoji }) => {
          const doc = documents?.[key]
          const isUploading = uploading === key
          const err = uploadErrors[key]

          return (
            <div key={key} className={`card card-hover space-y-4 ${doc ? 'border-pitch-800/50' : ''}`}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
                {doc ? (
                  <CheckCircle size={16} className="text-pitch-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-gray-600 shrink-0 mt-0.5" />
                )}
              </div>

              {/* Status + link */}
              {doc ? (
                <div className="bg-pitch-900/30 rounded-xl px-3 py-2 space-y-1">
                  <p className="text-[10px] text-pitch-300 font-semibold uppercase">Téléchargé</p>
                  {doc.uploaded_at && (
                    <p className="text-xs text-gray-500">le {doc.uploaded_at}</p>
                  )}
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-pitch-400 hover:text-pitch-300 transition-colors mt-1">
                      <ExternalLink size={11} /> Voir le document
                    </a>
                  )}
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-gray-500 uppercase">Non fourni</p>
                </div>
              )}

              {/* Error */}
              {err && <p className="text-xs text-red-400 bg-red-900/20 rounded-lg px-2 py-1">{err}</p>}

              {/* Upload button */}
              <button
                onClick={() => fileInputRefs.current[key]?.click()}
                disabled={isUploading}
                className="btn-secondary text-sm w-full justify-center"
              >
                {isUploading
                  ? <><Loader2 size={14} className="animate-spin" /> Upload…</>
                  : <><Upload size={14} />{doc ? 'Remplacer' : 'Ajouter'}</>
                }
              </button>
              <input
                type="file"
                accept={ACCEPT[key] ?? ACCEPT.default}
                className="sr-only"
                ref={(el) => { fileInputRefs.current[key] = el }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(key, file)
                  e.target.value = ''
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
