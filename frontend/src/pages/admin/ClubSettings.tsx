import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, clubsApi } from '../../api'
import { useAuthStore } from '../../store/auth'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { Settings, Save, Loader2 } from 'lucide-react'

interface ClubForm {
  name: string
  city: string
  founded_year: number
  description: string
  primary_color: string
  secondary_color: string
  stadium: string
}

export default function ClubSettings() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: club } = useQuery({
    queryKey: ['club', user?.club_id],
    queryFn: () => clubsApi.getById(user!.club_id!).then((r) => r.data),
    enabled: !!user?.club_id,
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ClubForm>()

  useEffect(() => {
    if (club) {
      reset({
        name: club.name,
        city: club.city,
        founded_year: club.founded_year,
        description: club.description ?? '',
        primary_color: club.colors?.primary ?? '#16a34a',
        secondary_color: club.colors?.secondary ?? '#ffffff',
        stadium: (club as { stadium?: string }).stadium ?? '',
      })
    }
  }, [club, reset])

  const updateMutation = useMutation({
    mutationFn: (data: ClubForm) =>
      adminApi.updateClub({
        ...data,
        colors: { primary: data.primary_color, secondary: data.secondary_color },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club'] }),
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Settings size={22} className="text-pitch-500" /> Club Settings
      </h1>

      {/* Club preview */}
      {club && (
        <div className="card flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center text-2xl font-bold text-white">
            {club.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-white">{club.name}</p>
            <p className="text-gray-400 text-sm">{club.city}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Club Name</label>
            <input {...register('name', { required: true })} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">City</label>
            <input {...register('city')} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Founded Year</label>
            <input {...register('founded_year', { valueAsNumber: true })} type="number" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Stadium</label>
            <input {...register('stadium')} className="input" placeholder="Stadium name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Primary Color</label>
            <div className="flex items-center gap-2">
              <input {...register('primary_color')} type="color" className="h-10 w-16 rounded bg-transparent cursor-pointer border-0 p-0" />
              <input {...register('primary_color')} className="input flex-1" placeholder="#16a34a" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input {...register('secondary_color')} type="color" className="h-10 w-16 rounded bg-transparent cursor-pointer border-0 p-0" />
              <input {...register('secondary_color')} className="input flex-1" placeholder="#ffffff" />
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description')} rows={4} className="input resize-none" placeholder="About your club..." />
          </div>
        </div>

        {updateMutation.isSuccess && (
          <div className="text-sm text-pitch-300 bg-pitch-900/30 rounded-lg px-4 py-2">
            Club settings saved successfully!
          </div>
        )}

        <button type="submit" disabled={isSubmitting || updateMutation.isPending} className="btn-primary">
          {isSubmitting || updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </form>
    </div>
  )
}
