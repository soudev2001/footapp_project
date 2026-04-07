import { Zap, X, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { removeDemoMock, DEMO_MODE_KEY, DEMO_ROLE_KEY } from '../mocks/setup'

export default function DemoBanner() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const exitDemo = () => {
    localStorage.removeItem(DEMO_MODE_KEY)
    localStorage.removeItem(DEMO_ROLE_KEY)
    removeDemoMock()
    logout()
    navigate('/login')
  }

  const switchRole = () => {
    logout()
    localStorage.removeItem(DEMO_MODE_KEY)
    localStorage.removeItem(DEMO_ROLE_KEY)
    removeDemoMock()
    navigate('/login')
  }

  return (
    <div className="bg-yellow-500 text-yellow-950 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm font-medium shrink-0 flex-wrap">
      <div className="flex items-center gap-2 min-w-0">
        <Zap size={15} className="shrink-0" />
        <span className="truncate">Mode Démo — <span className="font-bold capitalize">{user?.role}</span> <span className="hidden sm:inline">· FC Les Aiglons · Données fictives</span></span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={switchRole}
          className="flex items-center gap-1 bg-yellow-600/30 hover:bg-yellow-600/50 px-2.5 py-0.5 rounded-md transition-colors text-xs font-semibold"
        >
          <RefreshCw size={12} /> Changer de rôle
        </button>
        <button
          type="button"
          onClick={exitDemo}
          className="flex items-center gap-1 bg-yellow-600/30 hover:bg-yellow-600/50 px-2.5 py-0.5 rounded-md transition-colors text-xs font-semibold"
        >
          <X size={12} /> Quitter
        </button>
      </div>
    </div>
  )
}
