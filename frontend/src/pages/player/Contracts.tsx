import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playersApi } from '../../api'
import { FileText, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-pitch-900 text-pitch-300',
  pending: 'bg-yellow-900 text-yellow-300',
  expired: 'bg-gray-800 text-gray-400',
  terminated: 'bg-red-900 text-red-300',
}

export default function Contracts() {
  const qc = useQueryClient()

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['player-contracts'],
    queryFn: () => playersApi.myContracts().then((r) => r.data),
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) =>
      playersApi.myContracts().then(() => ({ id, action })), // placeholder — uses respond endpoint
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player-contracts'] }),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <FileText size={22} className="text-pitch-500" /> Contrats
      </h1>

      {isLoading && <p className="text-gray-400">Chargement des contrats...</p>}

      <div className="space-y-4">
        {contracts?.map((contract: { id: string; status: string; role?: string; start_date?: string; end_date?: string; salary?: number; conditions?: string }) => (
          <div key={contract.id} className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white capitalize">{contract.role ?? 'Joueur'} Contrat</p>
                <div className="flex gap-3 text-sm text-gray-400 mt-1">
                  {contract.start_date && <span>Du {format(new Date(contract.start_date), 'dd/MM/yyyy')}</span>}
                  {contract.end_date && <span>Au {format(new Date(contract.end_date), 'dd/MM/yyyy')}</span>}
                </div>
              </div>
              <span className={clsx('badge text-xs capitalize', STATUS_STYLE[contract.status] ?? 'bg-gray-800 text-gray-400')}>
                {contract.status}
              </span>
            </div>

            {contract.salary !== undefined && (
              <div className="bg-gray-800 rounded-lg px-4 py-2 text-sm">
                <span className="text-gray-400">Salaire : </span>
                <span className="text-white font-medium">{contract.salary.toLocaleString()}€/mois</span>
              </div>
            )}

            {contract.conditions && (
              <p className="text-sm text-gray-300">{contract.conditions}</p>
            )}

            {contract.status === 'pending' && (
              <div className="flex gap-2 pt-1 border-t border-gray-800">
                <button
                  onClick={() => respondMutation.mutate({ id: contract.id, action: 'accept' })}
                  className="btn-primary flex-1 justify-center"
                >
                  <CheckCircle size={16} /> Accepter
                </button>
                <button
                  onClick={() => respondMutation.mutate({ id: contract.id, action: 'reject' })}
                  className="btn-danger flex-1 justify-center"
                >
                  <XCircle size={16} /> Rejeter
                </button>
              </div>
            )}
          </div>
        ))}

        {!isLoading && !contracts?.length && (
          <div className="card text-center py-12 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            Aucun contrat trouvé.
          </div>
        )}
      </div>
    </div>
  )
}
