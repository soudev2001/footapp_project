@startuml
skinparam backgroundColor white
skinparam roundCorner 8
skinparam shadow 2
skinparam defaultFontName "Segoe UI", "Arial", sans-serif
hide empty description

' --- STYLE GLOBAL (THEME CLAIR) ---
skinparam state {
  BackgroundColor #f8fafc
  BorderColor #94a3b8
  FontColor #1e293b
  AttributeFontColor #475569
  ArrowColor #475569
  ArrowFontColor #475569
  FontSize 13
}

' --- PALETTE DE COULEURS PROFESSIONNELLE ---

' Public (Bleu Ciel Doux)
skinparam state {
  BackgroundColor<<Public>> #f0f9ff
  BorderColor<<Public>> #0ea5e9
  FontColor<<Public>> #0c4a6e
}

' Auth (Indigo Doux)
skinparam state {
  BackgroundColor<<Auth>> #eef2ff
  BorderColor<<Auth>> #6366f1
  FontColor<<Auth>> #312e81
}

' Admin (Bleu Roi)
skinparam state {
  BackgroundColor<<Admin>> #dbeafe
  BorderColor<<Admin>> #2563eb
  FontColor<<Admin>> #1e3a8a
}

' Club (Vert Emeraude)
skinparam state {
  BackgroundColor<<Club>> #ecfdf5
  BorderColor<<Club>> #10b981
  FontColor<<Club>> #064e3b
}

' Mobile (Gris/Rose subtil pour l'app principale)
skinparam state {
  BackgroundColor<<Mobile>> #fff1f2
  BorderColor<<Mobile>> #f43f5e
  FontColor<<Mobile>> #881337
}

' Choice Diamond
skinparam state {
  BackgroundColor<<Choice>> #ffffff
  BorderColor<<Choice>> #64748b
}

title <b>DIAGRAMME DE NAVIGATION - FOOTAPP SYSTEM</b>\n(Architecture de l'Information)

' --- GROUPE : WEB PUBLIC ---
state "🌐 Site Vitrine" as WebGroup <<Public>> {
  state "🏠 Accueil\n(index.html)" as Index
  state "📢 Vue Fan/Club\n(public-club.html)" as PublicClub
  state "🏆 Classement\n(ranking.html)" as Ranking
}

' --- GROUPE : AUTHENTIFICATION ---
state "🔐 Authentification" as AuthGroup <<Auth>> {
  state "🔑 Connexion\n(login.html)" as Login
  state "📝 Inscription\n(register.html)" as Register
  state "❓ Mot de passe oublié\n(forgot-password.html)" as Forgot
}

' --- GROUPE : SAAS / ADMIN ---
state "🚀 Super Admin (SaaS)" as AdminGroup <<Admin>> {
  state "🛠 Panel Admin\n(admin.html)" as Admin
}

' --- GROUPE : CLUB ---
state "🏢 Club Back-Office" as ClubGroup <<Club>> {
  state "📊 Tableau de Bord\n(dashboard.html)" as Dashboard
}

' --- GROUPE : APP MOBILE ---
state "📱 Application Mobile" as AppGroup <<Mobile>> {
   
  state "🏠 App Home\n(app.html)" as AppHome
   
  state "Social" as SocialSection {
    state "📰 Fil d'Actu" as Feed
    state "✏️ Créer Post" as CreatePost
  }
   
  state "Messagerie" as ChatSection {
    state "💬 Boîte de réception" as ChatInbox
  }
   
  state "Gestion Sportive" as SportSection {
    state "📅 Calendrier" as Calendar
    state "⚽ Match Center" as MatchCenter
    state "👥 Effectif" as Roster
    state "📋 Tactique" as Tactics
    state "✅ Présence" as Attendance
    state "➕ Créer Event" as CreateEvent
  }
   
  state "Profil & Admin" as ProfileSection {
    state "👤 Profil Joueur" as Profile
    state "📄 Documents" as Docs
    state "⚙️ Paramètres" as Settings
    state "🔔 Notifications" as Notifs
    state "🎫 Réservations" as Resa
  }
   
  state "Boutique" as ShopSection {
    state "🛒 Produit" as Product
    state "💳 Paiement" as Checkout
  }
}

' --- FLUX LOGIQUE ---

' 1. Public Navigation
Index --> Login
Index --> Register
Index -down-> PublicClub
PublicClub --> Ranking
PublicClub --> Product

' 2. Logique d'Authentification
state "Vérification Rôle" as role_check <<Choice>>
Login --> role_check : Valider ID
role_check -[#2563eb]-> Admin : Si SuperAdmin
role_check -[#10b981]-> Dashboard : Si Dirigeant
role_check -[#f43f5e,bold]-> AppHome : Si Coach/Joueur

Login -[dotted]-> Forgot : Récupération
Register --> Admin : "Demande d'adhésion"

' 3. Navigation Mobile (Hubs Principaux)
AppHome -[bold]-> Feed : Menu
AppHome --> ChatInbox : Menu
AppHome --> Roster : Menu
AppHome --> Profile : Menu
AppHome -[dotted]-> Notifs : Icône Header
AppHome -[bold]-> Calendar : "Voir tout"

' 4. Interactions Mobile
Feed --> CreatePost : Action
Feed --> Resa : Lien Événement

Calendar --> MatchCenter : Clic Match
Calendar --> Attendance : Clic Entraînement
Calendar --> CreateEvent : Action Coach

Roster --> Profile : Clic Utilisateur
Tactics --> Roster : Sélection Joueurs

Profile --> Docs : Menu
Profile --> Settings : Menu
Settings -[dotted]-> Index : "🚪 Déconnexion"

Product --> Checkout
Checkout --> AppHome : Succès

' 5. Back Office
Dashboard -[dotted]-> Index : Prévisualiser Site

@enduml