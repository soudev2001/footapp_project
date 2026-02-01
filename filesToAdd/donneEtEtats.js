/**
 * --- MOCK DATA (Base de données simulée) ---
 */

// Plans d'abonnement (SaaS)
const dbPlans = [
    { id: 'free', name: 'Amateur', price: 0, users: 20, features: ['Calendrier', 'Convocations'] },
    { id: 'pro', name: 'Pro', price: 29, users: 100, features: ['Tout Gratuit', 'Statistiques', 'Marque Blanche'] },
    { id: 'elite', name: 'Elite', price: 99, users: 999, features: ['Tout Pro', 'API', 'Support dédié'] }
];

// Demandes d'inscription (Pour SuperAdmin)
let dbRequests = [
    { id: 101, clubName: "Olympique Lyonnais Amateur", email: "contact@ol-amateur.com", status: "PENDING", date: "2023-10-25" },
    { id: 102, clubName: "FC Paris Sud", email: "presidence@fcps.fr", status: "VALIDATED", date: "2023-10-24" }
];

// Configuration CMS par défaut (Pour le site vitrine)
let cmsSettings = {
    heroTitle: "Gérez votre club comme un pro",
    heroSubtitle: "La solution tout-en-un pour les clubs amateurs et semi-pros.",
    heroButtonText: "Commencer gratuitement",
    primaryColor: "#2563eb", // Blue-600
    footerText: "© 2023 FootApp Inc. Tous droits réservés."
};

// Utilisateurs Système
const dbUsers = [
    { id: "sa1", email: "admin@footapp.com", role: "SUPER_ADMIN", name: "Super Admin" },
    { id: "d1", email: "president@fccanvas.com", role: "DIRIGEANT", name: "Président Dupont", clubId: "c1" }
];

/**
 * --- STATE MANAGEMENT (État de l'application) ---
 */
const state = {
    currentView: 'LANDING', // LANDING, LOGIN, REGISTER, SA_DASHBOARD, CLUB_DASHBOARD, APP_PREVIEW
    currentUser: null,
    cms: { ...cmsSettings }, // Copie locale pour modification dans le dashboard
    tempRegistration: {}
};