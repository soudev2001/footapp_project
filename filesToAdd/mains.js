/**
 * --- MAIN RENDERER (Moteur de Rendu) ---
 * * Ce script est chargé en dernier. Il a accès à:
 * - state (data.js)
 * - views (views.js)
 */

function render() {
    const root = document.getElementById('root');

    switch (state.currentView) {
        case 'LANDING':
            root.innerHTML = LandingView();
            break;
        case 'REGISTER':
            root.innerHTML = RegisterView();
            break;
        case 'LOGIN':
            root.innerHTML = LoginView();
            break;
        case 'SA_DASHBOARD':
            root.innerHTML = SuperAdminDashboard();
            break;
        case 'CLUB_DASHBOARD':
            root.innerHTML = ClubDashboard();
            break;
        case 'APP_PREVIEW':
            root.innerHTML = AppPreview();
            break;
        default:
            root.innerHTML = LandingView();
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log("FootApp Initialisé");
    render();
});