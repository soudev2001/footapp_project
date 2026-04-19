import { Link } from 'react-router-dom'
import { Trophy, Users, Calendar, Star, ArrowRight, Shield, Zap, Globe, ShieldCheck, User, Crown } from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Suivi d\'équipe', desc: 'Gérez vos joueurs, staffs et convocations en quelques clics.' },
  { icon: Calendar, title: 'Calendrier complet', desc: 'Entraînements, matchs, événements : tout en un seul endroit.' },
  { icon: Trophy, title: 'Classements', desc: 'Suivez les performances individuelles et collectives en temps réel.' },
  { icon: Zap, title: 'Analyses avancées', desc: "Statistiques, rapports et tendances pour optimiser vos résultats." },
  { icon: Shield, title: 'Sécurisé', desc: 'Données chiffrées et confidentielles protégées côté serveur.' },
  { icon: Globe, title: 'Multi-clubs', desc: 'Une plateforme utilisée par des centaines de clubs à travers le pays.' },
]

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@footlogic.fr', password: 'admin123', icon: <ShieldCheck size={18} />, color: 'border-purple-700 bg-purple-900/20 text-purple-400' },
  { role: 'Coach', email: 'coach@fcelite.fr', password: 'coach123', icon: <Users size={18} />, color: 'border-blue-700 bg-blue-900/20 text-blue-400' },
  { role: 'Joueur', email: 'player1@fcelite.fr', password: 'player123', icon: <User size={18} />, color: 'border-pitch-700 bg-pitch-900/20 text-pitch-400' },
  { role: 'Super Admin', email: 'superadmin1@footlogic.com', password: 'super123', icon: <Crown size={18} />, color: 'border-yellow-700 bg-yellow-900/20 text-yellow-400' },
]

const STEPS = [
  { num: '1', title: 'Créez votre club', desc: 'Inscrivez-vous et configurez votre club en quelques minutes.' },
  { num: '2', title: 'Invitez votre staff', desc: 'Ajoutez coaches, joueurs et parents via un simple email.' },
  { num: '3', title: 'Dominez la saison', desc: 'Gérez tout depuis un seul tableau de bord intelligent.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-pitch-600 rounded-lg">
              <Trophy size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">FootApp</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Connexion</Link>
            <Link to="/register" className="btn-primary text-sm">Commencer</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pitch-900/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pitch-800/50 bg-pitch-900/20 text-pitch-400 text-xs font-medium">
            <Star size={12} /> La plateforme N°1 pour les clubs de football
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight">
            Gérez votre club<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pitch-400 to-emerald-400">comme un pro</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            FootApp réunit coaches, joueurs, parents et supporters en une seule application pour simplifier la gestion sportive de bout en bout.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary gap-2 text-base">
              Créer mon club <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary text-base">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-900/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">Tout ce dont votre club a besoin</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:border-pitch-800/50 transition-colors">
                <div className="p-2.5 bg-pitch-900/30 rounded-lg w-fit mb-3">
                  <Icon size={18} className="text-pitch-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">Comment ça marche ?</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-pitch-600 flex items-center justify-center text-white font-bold text-lg">{num}</div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="py-16 px-4 bg-gray-900/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-2">Démo Live</h2>
          <p className="text-gray-400 text-center mb-8 text-sm">Testez la plateforme avec un compte démo :</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_ACCOUNTS.map(({ role, email, password, icon, color }) => (
              <div key={role} className={`rounded-lg border p-4 space-y-2 ${color}`}>
                <div className="flex items-center gap-2 font-semibold">
                  {icon} {role}
                </div>
                <div className="text-xs space-y-1 text-gray-300">
                  <p><span className="text-gray-500">Email :</span> {email}</p>
                  <p><span className="text-gray-500">Mot de passe :</span> {password}</p>
                </div>
                <Link to="/login" className="block text-center text-xs font-medium py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors">
                  Se connecter →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Prêt à commencer ?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">Rejoignez des centaines de clubs qui font confiance à FootApp pour gérer leur activité sportive.</p>
        <Link to="/register" className="btn-primary gap-2 text-base inline-flex">
          Créer mon club gratuitement <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} FootApp. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-gray-300 transition-colors">CGU</Link>
            <Link to="/help" className="hover:text-gray-300 transition-colors">Aide</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
