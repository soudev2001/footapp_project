import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageCircle, Search, Users, Calendar, Trophy, ShoppingBag, Mic2 } from 'lucide-react'
import { useState } from 'react'

const CATEGORIES = [
  {
    icon: Users,
    title: 'Compte & Profil',
    faqs: [
      { q: 'Comment modifier mes informations personnelles ?', a: 'Accédez au menu → Profil → Modifier le profil. Vous pouvez mettre à jour vos informations de contact et votre photo.' },
      { q: 'Comment changer mon mot de passe ?', a: 'Allez dans Paramètres → Sécurité → Changer le mot de passe. Saisissez votre ancien mot de passe puis le nouveau.' },
      { q: 'J\'ai oublié mon mot de passe, que faire ?', a: 'Sur la page de connexion, cliquez sur « Mot de passe oublié ». Un email de réinitialisation vous sera envoyé.' },
    ],
  },
  {
    icon: Calendar,
    title: 'Événements & Calendrier',
    faqs: [
      { q: 'Comment voir les prochains entraînements ?', a: 'La section Calendrier de votre tableau de bord affiche tous les événements à venir (matchs, entraînements, stages).' },
      { q: 'Comment confirmer ma présence à un événement ?', a: 'Dans la fiche événement, appuyez sur « Présent » ou « Absent ». Un rappel vous sera envoyé 24h avant.' },
    ],
  },
  {
    icon: Trophy,
    title: 'Classements & Performances',
    faqs: [
      { q: 'Comment lire les statistiques joueurs ?', a: 'Dans Classements, filtrez par équipe ou par période. Cliquez sur un joueur pour voir ses statistiques détaillées (buts, passes, matchs joués).' },
      { q: 'Les données sont-elles mises à jour automatiquement ?', a: 'Oui, les statistiques sont mises à jour après chaque match saisi par le staff technique.' },
    ],
  },
  {
    icon: ShoppingBag,
    title: 'Boutique',
    faqs: [
      { q: 'Comment passer une commande ?', a: 'Parcourez la boutique, ajoutez des articles au panier, puis validez votre commande. Le paiement s\'effectue en ligne de façon sécurisée.' },
      { q: 'Comment suivre ma commande ?', a: 'Dans Boutique → Mes commandes, retrouvez l\'historique et le suivi de toutes vos commandes.' },
      { q: 'Puis-je annuler une réservation ?', a: 'Oui, dans Boutique → Réservations, vous pouvez annuler jusqu\'à 24h avant l\'événement concerné.' },
    ],
  },
  {
    icon: Mic2,
    title: 'ISY (Supporters)',
    faqs: [
      { q: 'Qui peut accéder à l\'espace ISY ?', a: 'L\'espace ISY est réservé aux membres ayant le rôle "ISY" attribué par un administrateur du club.' },
      { q: 'Comment rejoindre les supporters ISY ?', a: 'Contactez un responsable ISY ou rendez-vous au bureau du club. Un admin validera votre accès.' },
    ],
  },
]

export default function Help() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    faqs: cat.faqs.filter(
      (f) => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.faqs.length > 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-white">Centre d'aide</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans l'aide..."
            className="input pl-9"
          />
        </div>

        {/* FAQ */}
        {filtered.map((cat) => (
          <div key={cat.title} className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <cat.icon size={14} /> {cat.title}
            </h2>
            {cat.faqs.map((faq, i) => {
              const key = `${cat.title}-${i}`
              return (
                <div key={key} className="card overflow-hidden">
                  <button className="w-full flex items-center justify-between text-left gap-3" onClick={() => setOpen(open === key ? null : key)}>
                    <span className="font-medium text-white text-sm">{faq.q}</span>
                    {open === key ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                  </button>
                  {open === key && <p className="text-sm text-gray-400 mt-3 pt-3 border-t border-gray-700/50">{faq.a}</p>}
                </div>
              )
            })}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <Search size={32} className="mx-auto mb-3 opacity-40" />
            <p>Aucun résultat pour « {search} »</p>
          </div>
        )}

        {/* Contact */}
        <div className="card text-center space-y-3">
          <p className="text-sm text-gray-400">Vous n'avez pas trouvé votre réponse ?</p>
          <a href="mailto:support@footapp.fr" className="btn-primary gap-2 inline-flex">
            <Mail size={14} /> Contacter le support
          </a>
        </div>
      </div>
    </div>
  )
}
