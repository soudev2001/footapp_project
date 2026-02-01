/**
 * --- CONTROLLERS (Logique Métier) ---
 */

// Navigation entre les vues
function navigate(view) {
    state.currentView = view;
    render(); // Appelle le moteur de rendu
}

// Authentification (Simulation)
function login(email) {
    const user = dbUsers.find(u => u.email === email);
    if (user) {
        state.currentUser = user;
        // Redirection selon le rôle
        if (user.role === 'SUPER_ADMIN') navigate('SA_DASHBOARD');
        else if (user.role === 'DIRIGEANT') navigate('CLUB_DASHBOARD');
    } else {
        alert("Utilisateur inconnu (Essayez: admin@footapp.com ou president@fccanvas.com)");
    }
}

// Déconnexion
function logout() {
    state.currentUser = null;
    navigate('LANDING');
}

// Soumission du formulaire d'inscription (SaaS)
function submitRegistration(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newRequest = {
        id: Date.now(),
        clubName: formData.get('clubName'),
        email: formData.get('email'),
        status: "PENDING",
        date: new Date().toISOString().split('T')[0]
    };
    dbRequests.push(newRequest);
    alert("Demande envoyée ! En attente de validation par l'admin.");
    navigate('LANDING');
}

// Validation d'un club par le SuperAdmin
function validateRequest(id) {
    const req = dbRequests.find(r => r.id === id);
    if (req) {
        req.status = 'VALIDATED';
        alert(`Club ${req.clubName} validé ! Un email a été envoyé à ${req.email}.`);
        render(); // Rafraîchit la liste
    }
}

// Mise à jour du CMS par le Dirigeant
function updateCMS(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Mise à jour de l'état local
    state.cms.heroTitle = formData.get('heroTitle');
    state.cms.heroSubtitle = formData.get('heroSubtitle');
    state.cms.primaryColor = formData.get('primaryColor');

    alert("Site mis à jour !");
    render(); // Rafraîchit l'aperçu si nécessaire
}