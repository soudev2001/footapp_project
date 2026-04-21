import React, { useState, useEffect, createContext, useContext } from 'react'
import {
  Trophy, Users, Calendar, Star, ArrowRight, Shield, Zap, Globe,
  ShieldCheck, User, Crown, MapPin, Phone, Mail, Loader2,
  ChevronDown, ChevronUp, ArrowLeft, Search, ShoppingBag, Mic2, Building2
} from 'lucide-react'

// --- MOCK ROUTER & API FOR PREVIEW ---
const RouterContext = createContext({ route: '/', navigate: (path: string) => { } });

const Link = ({ to, children, className }: any) => {
  const { navigate } = useContext(RouterContext);
  return (
    <a href={to} onClick={(e) => { e.preventDefault(); navigate(to); }} className={className}>
      {children}
    </a>
  );
};

const useNavigate = () => {
  const { navigate } = useContext(RouterContext);
  return navigate;
};

const useParams = () => ({ id: '1' }); // Mock ID

const useQuery = ({ queryKey }: any) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      if (queryKey[0] === 'public-club') {
        setData({
          club: {
            name: 'FC Elite',
            city: 'Paris',
            description: "Club formateur d'excellence. Rejoignez l'élite du football amateur avec des infrastructures premium et un encadrement professionnel. Notre mission : développer le potentiel de chaque joueur.",
            player_count: 342,
            seasons: 12,
            trophies: 8,
            email: 'contact@fcelite.fr',
            phone: '+33 1 23 45 67 89',
            address: '12 Avenue du Stade, 75000 Paris',
            teams: [
              { id: '1', name: 'Seniors A', category: 'Régional 1' },
              { id: '2', name: 'Seniors B', category: 'Départemental 1' },
              { id: '3', name: 'U18', category: 'Régional 2' },
              { id: '4', name: 'U15', category: 'Départemental 2' }
            ]
          }
        });
        setIsLoading(false);
      }
    }, 800);
  }, [queryKey[1]]);

  return { data, isLoading, error };
};

// --- COMPONENTS ---

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#05070a]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-green-600/20">
            <Trophy size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">FootApp</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">Connexion</Link>
          <Link to="/register" className="bg-white text-black hover:bg-gray-200 font-semibold py-2.5 px-5 rounded-xl transition-all active:scale-95 text-sm">
            Créer mon club
          </Link>
        </div>
      </div>
    </nav>
  )
}

function LandingPage() {
  const FEATURES = [
    { icon: Users, title: "Suivi d'équipe", desc: 'Gérez vos joueurs, staffs et convocations en quelques clics.' },
    { icon: Calendar, title: 'Calendrier complet', desc: 'Entraînements, matchs, événements : tout en un seul endroit.' },
    { icon: Trophy, title: 'Classements', desc: 'Suivez les performances individuelles et collectives en temps réel.' },
    { icon: Zap, title: 'Analyses avancées', desc: "Statistiques, rapports et tendances pour optimiser vos résultats." },
    { icon: Shield, title: 'Sécurisé', desc: 'Données chiffrées et confidentielles protégées côté serveur.' },
    { icon: Globe, title: 'Multi-clubs', desc: 'Une plateforme utilisée par des centaines de clubs à travers le pays.' },
  ]

  const DEMO_ACCOUNTS = [
    { role: 'Admin', email: 'admin@footlogic.fr', password: 'admin123', icon: <ShieldCheck size={18} />, color: 'from-purple-500/20 to-purple-900/40 border-purple-500/30 text-purple-400' },
    { role: 'Coach', email: 'coach@fcelite.fr', password: 'coach123', icon: <Users size={18} />, color: 'from-blue-500/20 to-blue-900/40 border-blue-500/30 text-blue-400' },
    { role: 'Joueur', email: 'player1@fcelite.fr', password: 'player123', icon: <User size={18} />, color: 'from-green-500/20 to-green-900/40 border-green-500/30 text-green-400' },
    { role: 'Super Admin', email: 'superadmin1@footlogic.com', password: 'super123', icon: <Crown size={18} />, color: 'from-yellow-500/20 to-yellow-900/40 border-yellow-500/30 text-yellow-400' },
  ]

  const STEPS = [
    { num: '1', title: 'Créez votre club', desc: 'Inscrivez-vous et configurez votre club en quelques minutes.' },
    { num: '2', title: 'Invitez votre staff', desc: 'Ajoutez coaches, joueurs et parents via un simple email.' },
    { num: '3', title: 'Dominez la saison', desc: 'Gérez tout depuis un seul tableau de bord intelligent.' },
  ]

  return (
    <>
      <Navbar />
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-green-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Hero */}
        <section className="relative pt-32 pb-20 px-4 text-center">
          <div className="relative max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md text-green-400 text-xs font-bold uppercase tracking-widest shadow-xl">
              <Star size={14} className="animate-pulse" /> La plateforme N°1 pour les clubs de football
            </div>
            <h1 className="text-5xl sm:text-7xl font-black leading-[1.1] tracking-tight text-white">
              Gérez votre club<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">comme un pro.</span>
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              FootApp réunit coaches, joueurs, parents et supporters en une seule application pour simplifier la gestion sportive de bout en bout.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/40 active:scale-95 text-lg">
                Créer mon club <ArrowRight size={20} />
              </Link>
              <Link to="/public-club" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold rounded-xl transition-all backdrop-blur-sm active:scale-95 text-lg">
                Voir un club public
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Tout ce dont votre club a besoin</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Une suite complète d'outils pensés par des professionnels du sport.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white/[0.02] border border-white/[0.05] hover:border-green-500/30 backdrop-blur-xl p-8 rounded-3xl transition-colors group">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-green-500/10 transition-all">
                    <Icon size={24} className="text-gray-300 group-hover:text-green-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                  <p className="text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-16 tracking-tight">Lancement en 3 étapes</h2>
            <div className="grid sm:grid-cols-3 gap-12 relative">
              <div className="hidden sm:block absolute top-8 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              {STEPS.map(({ num, title, desc }) => (
                <div key={num} className="text-center space-y-6 relative">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-green-600 shadow-lg shadow-green-600/30 flex items-center justify-center text-white font-black text-2xl relative z-10">
                    {num}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo */}
        <section className="py-24 px-4 bg-white/[0.01] border-y border-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Environnement de Démo</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Testez la plateforme avec nos accès pré-configurés.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEMO_ACCOUNTS.map(({ role, email, password, icon, color }) => (
                <div key={role} className={`bg-gradient-to-br ${color} border backdrop-blur-sm p-6 rounded-3xl space-y-4 hover:-translate-y-1 transition-transform`}>
                  <div className="flex items-center gap-3 font-bold text-white text-lg">
                    {icon} {role}
                  </div>
                  <div className="text-sm space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                    <p className="flex flex-col"><span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Email</span> <span className="font-medium text-white">{email}</span></p>
                    <p className="flex flex-col"><span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Mot de passe</span> <span className="font-medium text-white">{password}</span></p>
                  </div>
                  <Link to="/login" className="flex items-center justify-center w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors text-sm">
                    Tester l'accès →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}

function PublicClub() {
  const { data, isLoading, error } = useQuery({ queryKey: ['public-club', '1'] })

  if (isLoading) return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-green-500" />
    </div>
  )

  if (error || !data?.club) return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center text-gray-400">
      <div className="text-center space-y-4">
        <Shield size={48} className="mx-auto text-gray-600" />
        <p className="text-lg">Club introuvable ou page non disponible.</p>
        <Link to="/" className="inline-block text-green-400 hover:underline">Retour à l'accueil</Link>
      </div>
    </div>
  )

  const club = data.club

  return (
    <div className="min-h-screen bg-[#05070a]">
      <Navbar />

      {/* Cinematic Banner */}
      <div className="h-64 sm:h-80 bg-gradient-to-br from-green-900/40 via-gray-900 to-black relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-24 relative z-10 pb-24 space-y-8">

        {/* Main Club Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-green-600 to-green-800 border-4 border-[#05070a] shadow-xl flex items-center justify-center shrink-0 -mt-16 sm:-mt-12">
            <Trophy size={48} className="text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{club.name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300">
                <MapPin size={14} /> {club.city}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-semibold text-green-400">
                Club Partenaire
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-2xl">{club.description}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Licenciés', value: club.player_count, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { icon: Calendar, label: 'Saisons', value: club.seasons, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            { icon: Trophy, label: 'Trophées', value: club.trophies, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 text-center hover:bg-white/[0.04] transition-colors">
              <div className={`w-12 h-12 mx-auto ${bg} rounded-2xl flex items-center justify-center mb-4`}>
                <Icon size={24} className={color} />
              </div>
              <p className="text-3xl font-black text-white mb-1">{value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {/* Teams */}
          <div className="sm:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-green-500" /> Équipes engagées
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {club.teams.map((team: any) => (
                <div key={team.id} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <Shield size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{team.name}</p>
                    <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">{team.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail size={20} className="text-green-500" /> Contact
            </h2>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 space-y-4">
              <a href={`mailto:${club.email}`} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors"><Mail size={16} /></div>
                <span className="text-sm">{club.email}</span>
              </a>
              <a href={`tel:${club.phone}`} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors"><Phone size={16} /></div>
                <span className="text-sm">{club.phone}</span>
              </a>
              <div className="flex items-center gap-3 text-gray-400">
                <div className="p-2 bg-white/5 rounded-lg"><MapPin size={16} /></div>
                <span className="text-sm">{club.address}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  )
}

function Terms() {
  const [open, setOpen] = useState<number | null>(0)

  const SECTIONS = [
    { title: '1. Objet', content: `Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation de l'application FootApp, ainsi que les droits et obligations des parties. En utilisant l'application, l'utilisateur accepte sans réserve les présentes CGU.` },
    { title: '2. Accès à l\'application', content: `L'accès à FootApp est réservé aux membres inscrits d'un club partenaire. L'inscription est soumise à validation par un administrateur de club. L'utilisateur s'engage à fournir des informations exactes lors de son inscription et à mettre à jour ses données en cas de modification.` },
    { title: '3. Données personnelles', content: `FootApp collecte et traite des données personnelles dans le respect du Règlement Général sur la Protection des Données (RGPD). Les données collectées (nom, prénom, email, date de naissance) sont utilisées exclusivement dans le cadre du fonctionnement de l'application. Elles ne sont pas cédées à des tiers sans consentement préalable.` },
    { title: '4. Propriété intellectuelle', content: `L'ensemble des contenus présents sur FootApp (textes, images, logos, code source) est protégé par les lois relatives à la propriété intellectuelle. Toute reproduction ou utilisation non autorisée est strictement interdite.` },
  ]

  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-2">
            <ShieldCheck size={32} className="text-green-400" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Conditions Générales</h1>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Dernière mise à jour : Janvier 2025</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 space-y-4 shadow-xl">
          {SECTIONS.map((section, i) => (
            <div key={i} className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden transition-all">
              <button
                className="w-full flex items-center justify-between text-left gap-4 p-5 hover:bg-white/[0.02] transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-bold text-white text-lg">{section.title}</span>
                <div className={`p-1.5 rounded-lg bg-white/5 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${open === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="p-5 pt-0 text-gray-400 leading-relaxed border-t border-white/5 mt-2">{section.content}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 text-center font-medium">
          Pour toute question concernant nos CGU, contactez-nous à <a href="mailto:legal@footapp.fr" className="text-green-500 hover:underline">legal@footapp.fr</a>
        </p>
      </div>
      <Footer />
    </div>
  )
}

function Help() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const CATEGORIES = [
    {
      icon: Users,
      title: 'Compte & Profil',
      faqs: [
        { q: 'Comment modifier mes informations personnelles ?', a: 'Accédez au menu → Profil → Modifier le profil. Vous pouvez mettre à jour vos informations de contact et votre photo.' },
        { q: 'Comment changer mon mot de passe ?', a: 'Allez dans Paramètres → Sécurité → Changer le mot de passe. Saisissez votre ancien mot de passe puis le nouveau.' },
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
  ]

  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    faqs: cat.faqs.filter((f) => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())),
  })).filter((cat) => cat.faqs.length > 0)

  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Comment pouvons-nous<br />vous aider ?</h1>
          <div className="relative max-w-xl mx-auto group">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une question, un mot clé..."
              className="w-full bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 focus:bg-white/[0.06] transition-all shadow-xl text-lg"
            />
          </div>
        </div>

        <div className="space-y-8 pt-8">
          {filtered.map((cat) => (
            <div key={cat.title} className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest ml-2">
                <cat.icon size={16} /> {cat.title}
              </h2>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-2 shadow-lg">
                {cat.faqs.map((faq, i) => {
                  const key = `${cat.title}-${i}`
                  return (
                    <div key={key} className="border-b border-white/5 last:border-0">
                      <button
                        className="w-full flex items-center justify-between text-left gap-4 p-5 hover:bg-white/[0.02] transition-colors rounded-2xl"
                        onClick={() => setOpen(open === key ? null : key)}
                      >
                        <span className="font-semibold text-white text-base">{faq.q}</span>
                        <ChevronDown size={18} className={`text-gray-500 shrink-0 transition-transform duration-300 ${open === key ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${open === key ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <p className="px-5 pb-5 text-gray-400 leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-12 text-center text-gray-500 space-y-4">
              <Search size={48} className="mx-auto opacity-20" />
              <p className="text-lg">Aucun résultat pour « {search} »</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-white/[0.05] rounded-3xl p-8 text-center space-y-4">
          <p className="text-gray-300 font-medium">Vous ne trouvez pas votre réponse ?</p>
          <a href="mailto:support@footapp.fr" className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95">
            <MessageCircle size={18} /> Contacter l'équipe
          </a>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-black/20 py-12 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 opacity-50">
          <Trophy size={16} />
          <span className="font-bold tracking-tight">FootApp</span>
        </div>
        <p className="text-gray-500 text-sm font-medium">© {new Date().getFullYear()} FootApp Inc. Tous droits réservés.</p>
        <div className="flex gap-6 text-sm font-semibold">
          <Link to="/terms" className="text-gray-500 hover:text-white transition-colors">CGU</Link>
          <Link to="/help" className="text-gray-500 hover:text-white transition-colors">Aide & Support</Link>
        </div>
      </div>
    </footer>
  )
}

// --- MAIN APP (MOCK ROUTER) ---

export default function App() {
  const [route, setRoute] = useState('/')

  // Helper component to navigate the preview environment easily
  const PreviewNav = () => (
    <div className="fixed bottom-6 right-6 z-[100] bg-white/[0.1] backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col gap-2 scale-90 sm:scale-100 origin-bottom-right">
      <div className="text-[10px] font-black uppercase tracking-widest text-green-400 px-3 pt-1 text-center">Menu Preview</div>
      <div className="flex gap-1">
        {[
          { path: '/', label: 'Landing' },
          { path: '/public-club', label: 'Club' },
          { path: '/terms', label: 'CGU' },
          { path: '/help', label: 'Aide' },
        ].map(link => (
          <button
            key={link.path}
            onClick={() => setRoute(link.path)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${route === link.path ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  )

  let content;
  switch (route) {
    case '/': content = <LandingPage />; break;
    case '/public-club': content = <PublicClub />; break;
    case '/terms': content = <Terms />; break;
    case '/help': content = <Help />; break;
    default: content = <LandingPage />;
  }

  return (
    <RouterContext.Provider value={{ route, navigate: setRoute }}>
      <div className="font-sans antialiased text-gray-100 bg-[#05070a] min-h-screen selection:bg-green-500/30">
        {content}
        <PreviewNav />
      </div>
    </RouterContext.Provider>
  )
}