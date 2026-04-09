import { Link } from 'react-router-dom'
import { DollarSign, Users, Handshake, Star } from 'lucide-react'

export default function ISYDashboard() {
  const actions = [
    { to: '/isy/payments', label: 'Payments', desc: 'Manage member payments and dues', icon: <DollarSign size={28} className="text-yellow-400" /> },
    { to: '/isy/sponsors', label: 'Sponsors', desc: 'Manage club sponsors and partners', icon: <Handshake size={28} className="text-blue-400" /> },
  ]

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-pitch-900 to-pitch-800 border-pitch-700 space-y-2">
        <div className="flex items-center gap-3">
          <Star size={28} className="text-pitch-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">ISY Community Hub</h1>
            <p className="text-pitch-300 text-sm">Club management & community platform</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="card hover:border-gray-700 transition-colors flex items-start gap-4">
            {a.icon}
            <div>
              <p className="font-semibold text-white text-lg">{a.label}</p>
              <p className="text-sm text-gray-400 mt-1">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Community Members', value: '—', icon: <Users size={20} className="text-blue-400" /> },
          { label: 'Payments This Month', value: '—', icon: <DollarSign size={20} className="text-yellow-400" /> },
          { label: 'Active Sponsors', value: '—', icon: <Handshake size={20} className="text-pitch-400" /> },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            {s.icon}
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
