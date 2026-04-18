import { Info, Phone, Mail, MapPin, Calendar, Users, Shield, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const FAQ = [
  {
    q: "Comment rejoindre l'ISY ?",
    a: "Rendez-vous au bureau administratif du club avec une pièce d'identité et votre carte d'adhérent FootApp. Un responsable ISY validera votre inscription.",
  },
  {
    q: "Quels sont les avantages membres ISY ?",
    a: "Les membres ISY bénéficient de tarifs préférentiels sur les événements, d'un accès prioritaire aux tribunes VIP, d'invitations aux rencontres exclusives et d'une newsletter dédiée.",
  },
  {
    q: "Comment signaler un comportement non-sportif ?",
    a: "Utilisez le formulaire de signalement disponible dans l'application ou contactez directement un steward lors des matchs à domicile.",
  },
  {
    q: "Comment devenir bénévole pour les événements ?",
    a: "Envoyez votre candidature via l'onglet « Événements » en indiquant vos disponibilités. L'équipe ISY vous contactera sous 48h.",
  },
]

export default function ISYAbout() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-pitch-900/60 to-gray-800 border-pitch-800/50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-pitch-600/20 rounded-xl">
            <Shield size={28} className="text-pitch-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">ISY — Initiative Supporters & Yapafil</h1>
            <p className="text-gray-400 text-sm mt-1">L'association officielle des supporters du club</p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <section className="card space-y-3">
        <div className="flex items-center gap-2 text-pitch-400 font-semibold">
          <Info size={16} /> <span>Notre mission</span>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          L'ISY est l'organisation officielle chargée de fédérer les supporters du club, d'animer les tribunes et de créer des événements qui renforcent le lien entre les fans, les joueurs et le staff.
          Fondée sur les valeurs du fair-play et du respect, l'ISY veille à maintenir une ambiance positive et familiale lors de chaque rencontre.
        </p>
        <ul className="space-y-2 text-sm text-gray-400">
          {['Animer et soutenir l\'équipe lors des matchs à domicile et à l\'extérieur', 'Organiser des événements conviviaux pour les membres', 'Représenter les intérêts des supporters auprès de la direction', 'Promouvoir les valeurs du fair-play et du sport collectif'].map((item) => (
            <li key={item} className="flex items-start gap-2"><span className="text-pitch-500 mt-0.5">•</span>{item}</li>
          ))}
        </ul>
      </section>

      {/* Contact */}
      <section className="card space-y-3">
        <div className="flex items-center gap-2 text-pitch-400 font-semibold">
          <Phone size={16} /> <span>Contact</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Mail, label: 'Email', value: 'isy@club-footapp.fr', href: 'mailto:isy@club-footapp.fr' },
            { icon: Phone, label: 'Téléphone', value: '+212 6 XX XX XX XX', href: 'tel:+2126XXXXXXXX' },
            { icon: MapPin, label: 'Adresse', value: 'Stade Municipal — Bureau 12, Porte C', href: null },
            { icon: Calendar, label: 'Permanences', value: 'Mer. & Sam. 14h – 17h', href: null },
          ].map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-3 p-3 bg-gray-900/60 rounded-xl">
              <Icon size={16} className="text-pitch-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                {href ? (
                  <a href={href} className="text-sm text-white hover:text-pitch-400 transition-colors">{value}</a>
                ) : (
                  <p className="text-sm text-white">{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Membres', value: '500+' },
          { icon: Calendar, label: 'Événements / an', value: '30+' },
          { icon: Shield, label: 'Années d\'existence', value: '12' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="stat-card text-center">
            <Icon size={20} className="text-pitch-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </section>

      {/* Règlement intérieur */}
      <section className="card space-y-3">
        <div className="flex items-center gap-2 text-pitch-400 font-semibold">
          <BookOpen size={16} /> <span>Règlement intérieur</span>
        </div>
        <ul className="space-y-2 text-sm text-gray-400">
          {[
            'Respect mutuel entre tous les membres et visiteurs',
            'Comportement fair-play et non-violent en toutes circonstances',
            'Respect des installations et du matériel du club',
            'Paiement de la cotisation annuelle avant le 31 octobre',
            'Participation active aux événements est appréciée mais non obligatoire',
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-xs font-bold text-pitch-600 mt-0.5">{i + 1}.</span>
              {rule}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <BookOpen size={14} /> Questions fréquentes
        </h2>
        {FAQ.map((item, i) => (
          <div key={i} className="card overflow-hidden">
            <button className="w-full flex items-center justify-between text-left gap-3" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <span className="font-medium text-white text-sm">{item.q}</span>
              {openFaq === i ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
            </button>
            {openFaq === i && <p className="text-sm text-gray-400 mt-3 pt-3 border-t border-gray-700/50">{item.a}</p>}
          </div>
        ))}
      </section>
    </div>
  )
}
