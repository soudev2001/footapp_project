import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superadminApi } from '../../api'
import { useState } from 'react'
import { FolderKanban, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import clsx from 'clsx'

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-pitch-900 text-pitch-300',
  completed: 'bg-blue-900 text-blue-300',
  paused: 'bg-yellow-900 text-yellow-300',
  cancelled: 'bg-red-900 text-red-300',
}

interface ProjectForm {
  name: string
  description: string
}

export default function Projects() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['superadmin-projects'],
    queryFn: () => superadminApi.projects().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => superadminApi.createProject(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin-projects'] })
      setCreating(false)
      reset()
    },
  })

  const { register, handleSubmit, reset } = useForm<ProjectForm>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <FolderKanban size={22} className="text-pitch-500" /> Projets
        </h1>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={16} /> Nouveau projet
        </button>
      </div>

      {creating && (
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">Nouveau projet</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nom</label>
            <input {...register('name', { required: true })} className="input" placeholder="Nom du projet" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Description du projet..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>Créer</button>
            <button type="button" onClick={() => { reset(); setCreating(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement des projets...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {projects?.map((proj: { id: string; name: string; description?: string; status: string; tickets?: unknown[] }) => (
          <div key={proj.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <p className="font-semibold text-white">{proj.name}</p>
              <span className={clsx('badge text-xs capitalize', STATUS_STYLE[proj.status] ?? 'bg-gray-800 text-gray-400')}>
                {proj.status}
              </span>
            </div>
            {proj.description && <p className="text-sm text-gray-400">{proj.description}</p>}
            <p className="text-xs text-gray-500">{proj.tickets?.length ?? 0} tickets</p>
          </div>
        ))}
        {!isLoading && !projects?.length && (
          <div className="col-span-2 card text-gray-400 text-sm text-center py-12">Aucun projet pour le moment.</div>
        )}
      </div>
    </div>
  )
}
