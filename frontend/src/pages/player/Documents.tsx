import { useQuery } from '@tanstack/react-query'
import { playersApi } from '../../api'
import { FolderKanban, FileText, Upload } from 'lucide-react'

const DOC_TYPES = ['identity', 'medical', 'insurance', 'license', 'photo']

export default function Documents() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['player-documents'],
    queryFn: () => playersApi.myDocuments().then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <FolderKanban size={22} className="text-pitch-500" /> Documents
      </h1>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DOC_TYPES.map((docType) => {
          const doc = documents?.[docType]
          return (
            <div key={docType} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className={doc ? 'text-pitch-400' : 'text-gray-600'} />
                  <p className="font-medium text-white capitalize">{docType}</p>
                </div>
                <span className={`badge text-xs ${doc ? 'bg-pitch-900 text-pitch-300' : 'bg-gray-800 text-gray-500'}`}>
                  {doc ? 'Uploaded' : 'Missing'}
                </span>
              </div>

              {doc?.uploaded_at && (
                <p className="text-xs text-gray-500">Uploaded {doc.uploaded_at}</p>
              )}

              <label className="btn-secondary text-sm cursor-pointer justify-center">
                <Upload size={14} />
                {doc ? 'Replace' : 'Upload'}
                <input type="file" className="sr-only" />
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
