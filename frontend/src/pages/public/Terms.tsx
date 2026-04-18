import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import { useState } from 'react'

const SECTIONS = [
  {
    title: '1. Objet',
    content: `Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation de l'application FootApp, ainsi que les droits et obligations des parties. En utilisant l'application, l'utilisateur accepte sans réserve les présentes CGU.`,
  },
  {
    title: '2. Accès à l\'application',
    content: `L'accès à FootApp est réservé aux membres inscrits d'un club partenaire. L'inscription est soumise à validation par un administrateur de club. L'utilisateur s'engage à fournir des informations exactes lors de son inscription et à mettre à jour ses données en cas de modification.`,
  },
  {
    title: '3. Données personnelles',
    content: `FootApp collecte et traite des données personnelles dans le respect du Règlement Général sur la Protection des Données (RGPD). Les données collectées (nom, prénom, email, date de naissance) sont utilisées exclusivement dans le cadre du fonctionnement de l'application. Elles ne sont pas cédées à des tiers sans consentement préalable.`,
  },
  {
    title: '4. Propriété intellectuelle',
    content: `L'ensemble des contenus présents sur FootApp (textes, images, logos, code source) est protégé par les lois relatives à la propriété intellectuelle. Toute reproduction ou utilisation non autorisée est strictement interdite.`,
  },
  {
    title: '5. Comportement des utilisateurs',
    content: `L'utilisateur s'engage à utiliser FootApp dans le respect des lois en vigueur et des présentes CGU. Tout comportement contraire à l'éthique sportive, harcelant ou diffamatoire est interdit et pourra entraîner la suspension ou suppression du compte.`,
  },
  {
    title: '6. Responsabilité',
    content: `FootApp ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser l'application. L'application est fournie « en l'état » sans garantie de disponibilité continue.`,
  },
  {
    title: '7. Modification des CGU',
    content: `FootApp se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification majeure. La poursuite de l'utilisation de l'application après notification vaut acceptation des nouvelles CGU.`,
  },
  {
    title: '8. Droit applicable',
    content: `Les présentes CGU sont régies par le droit en vigueur dans le pays d'implantation du club. Tout litige sera soumis à la juridiction compétente du lieu du siège social du club.`,
  },
]

export default function Terms() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Conditions Générales d'Utilisation</h1>
            <p className="text-xs text-gray-500 mt-0.5">Dernière mise à jour : Janvier 2025</p>
          </div>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400 leading-relaxed">
            Bienvenue sur FootApp. En utilisant notre application, vous acceptez les conditions décrites ci-dessous. Veuillez les lire attentivement.
          </p>
        </div>

        <div className="space-y-2">
          {SECTIONS.map((section, i) => (
            <div key={i} className="card overflow-hidden">
              <button className="w-full flex items-center justify-between text-left gap-3" onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-semibold text-white text-sm">{section.title}</span>
                {open === i ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
              </button>
              {open === i && (
                <p className="text-sm text-gray-400 leading-relaxed mt-3 pt-3 border-t border-gray-700/50">{section.content}</p>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-600 text-center">
          Pour toute question concernant nos CGU, contactez-nous à <a href="mailto:legal@footapp.fr" className="text-pitch-500 hover:underline">legal@footapp.fr</a>
        </p>
      </div>
    </div>
  )
}
