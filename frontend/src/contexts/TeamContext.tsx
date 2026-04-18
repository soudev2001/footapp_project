import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { teamsApi } from '../api'
import type { Team } from '../types'

interface TeamContextValue {
  teams: Team[]
  activeTeamId: string
  setActiveTeamId: (id: string) => void
}

const TeamContext = createContext<TeamContextValue>({
  teams: [],
  activeTeamId: '',
  setActiveTeamId: () => {},
})

export function useTeam() {
  return useContext(TeamContext)
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    return localStorage.getItem('activeTeamId') ?? ''
  })

  const isAuthenticated = !!localStorage.getItem('access_token')

  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
    enabled: isAuthenticated,
    retry: false,
  })
  const teams = (Array.isArray(teamsData) ? teamsData : (teamsData as any)?.data ?? []) as Team[]

  // Auto-select first team if none active
  useEffect(() => {
    if (!activeTeamId && teams.length > 0) {
      setActiveTeamId(teams[0].id)
    }
  }, [teams, activeTeamId])

  useEffect(() => {
    if (activeTeamId) localStorage.setItem('activeTeamId', activeTeamId)
  }, [activeTeamId])

  return (
    <TeamContext.Provider value={{ teams, activeTeamId, setActiveTeamId }}>
      {children}
    </TeamContext.Provider>
  )
}
