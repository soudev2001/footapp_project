/**
 * --- VIEWS (Composants Visuels) ---
 */

// 1. NAVBAR (Partagée)
function Navbar() {
    return `
        <nav class="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50 flex justify-between items-center">
            <div class="flex items-center gap-2 cursor-pointer" onclick="navigate('LANDING')">
                <i class="fa-solid fa-futbol text-2xl" style="color: ${state.cms.primaryColor}"></i>
                <span class="font-bold text-xl tracking-tight">FootApp</span>
            </div>
            <div class="flex gap-4 items-center">
                <button onclick="navigate('LANDING')" class="text-gray-600 hover:text-black hidden sm:block">Accueil</button>
                <button onclick="navigate('REGISTER')" class="text-gray-600 hover:text-black hidden sm:block">Tarifs & Inscription</button>
                ${state.currentUser
            ? `<button onclick="logout()" class="text-red-600 font-bold">Déconnexion</button>`
            : `<button onclick="navigate('LOGIN')" class="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">Espace Client</button>`
        }
            </div>
        </nav>
    `;
}

// 2. LANDING PAGE (Site Vitrine)
function LandingView() {
    return `
        ${Navbar()}
        <div class="fade-in">
            <!-- Hero Section (Dynamique CMS) -->
            <header class="py-20 px-6 text-center bg-gradient-to-b from-blue-50 to-white">
                <h1 class="text-5xl font-extrabold mb-6 text-gray-900 leading-tight max-w-4xl mx-auto">${state.cms.heroTitle}</h1>
                <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">${state.cms.heroSubtitle}</p>
                <button onclick="navigate('REGISTER')" class="text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg transform hover:scale-105 transition" style="background-color: ${state.cms.primaryColor}">
                    ${state.cms.heroButtonText}
                </button>
            </header>

            <!-- Features -->
            <section class="py-16 px-6 max-w-6xl mx-auto">
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                        <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl"><i class="fa-solid fa-users"></i></div>
                        <h3 class="font-bold text-lg mb-2">Gestion Effectif</h3>
                        <p class="text-gray-500">Centralisez vos licenciés et gérez les catégories.</p>
                    </div>
                    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                        <div class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl"><i class="fa-solid fa-calendar-days"></i></div>
                        <h3 class="font-bold text-lg mb-2">Convocations</h3>
                        <p class="text-gray-500">Gagnez du temps avec les réponses automatiques.</p>
                    </div>
                    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                        <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl"><i class="fa-solid fa-mobile-screen"></i></div>
                        <h3 class="font-bold text-lg mb-2">App Mobile</h3>
                        <p class="text-gray-500">Une app dédiée pour vos joueurs et coachs.</p>
                    </div>
                </div>
            </section>

            <!-- CTA App -->
            <section class="bg-gray-900 text-white py-16 text-center">
                <h2 class="text-3xl font-bold mb-4">Déjà membre d'un club ?</h2>
                <p class="mb-8 text-gray-400">Accédez directement à l'application mobile.</p>
                <button onclick="navigate('APP_PREVIEW')" class="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100">
                    <i class="fa-brands fa-apple mr-2"></i>Accéder à l'App
                </button>
            </section>

            <footer class="py-8 text-center text-gray-400 text-sm border-t">
                ${cmsSettings.footerText}
            </footer>
        </div>
    `;
}

// 3. REGISTER PAGE (Inscription SaaS)
function RegisterView() {
    return `
        ${Navbar()}
        <div class="max-w-5xl mx-auto py-12 px-6 fade-in">
            <h2 class="text-3xl font-bold text-center mb-10">Choisissez votre plan</h2>
            
            <div class="grid md:grid-cols-3 gap-8 mb-16">
                ${dbPlans.map(plan => `
                    <div class="bg-white p-8 rounded-2xl shadow-lg border ${plan.id === 'pro' ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-200'}">
                        <h3 class="text-xl font-bold mb-2">${plan.name}</h3>
                        <div class="text-4xl font-bold mb-4">${plan.price}€<span class="text-sm font-normal text-gray-500">/mois</span></div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-green-500"></i> Jusqu'à ${plan.users} utilisateurs</li>
                            ${plan.features.map(f => `<li class="flex items-center gap-2 text-gray-600"><i class="fa-solid fa-check text-xs text-blue-500"></i> ${f}</li>`).join('')}
                        </ul>
                        <button onclick="document.getElementById('regForm').scrollIntoView({behavior: 'smooth'})" class="w-full py-3 rounded-lg font-bold ${plan.id === 'pro' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}">Sélectionner</button>
                    </div>
                `).join('')}
            </div>

            <div id="regForm" class="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
                <h3 class="text-2xl font-bold mb-6">Créer mon club</h3>
                <form onsubmit="submitRegistration(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom du club</label>
                        <input type="text" name="clubName" required class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email administrateur</label>
                        <input type="email" name="email" required class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                        <input type="password" required class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Envoyer la demande</button>
                </form>
            </div>
        </div>
    `;
}

// 4. LOGIN VIEW
function LoginView() {
    return `
        ${Navbar()}
        <div class="min-h-[60vh] flex items-center justify-center fade-in">
            <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                <h2 class="text-2xl font-bold mb-6 text-center">Connexion</h2>
                <div class="space-y-3">
                    <button onclick="login('admin@footapp.com')" class="w-full p-3 bg-gray-800 text-white rounded flex justify-between items-center">
                        <span>Super Admin</span> <i class="fa-solid fa-arrow-right"></i>
                    </button>
                    <button onclick="login('president@fccanvas.com')" class="w-full p-3 bg-blue-600 text-white rounded flex justify-between items-center">
                        <span>Dirigeant Club</span> <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
                <p class="text-center mt-6 text-sm text-gray-500">Simulez un rôle pour tester.</p>
            </div>
        </div>
    `;
}

// 5. SUPER ADMIN DASHBOARD
function SuperAdminDashboard() {
    return `
        <div class="flex min-h-screen">
            <!-- Sidebar -->
            <aside class="w-64 bg-gray-900 text-white p-6 hidden md:block">
                <h2 class="text-xl font-bold mb-8">Admin Panel</h2>
                <ul class="space-y-4">
                    <li class="font-bold text-blue-400"><i class="fa-solid fa-list-check w-6"></i> Demandes</li>
                    <li class="text-gray-400"><i class="fa-solid fa-chart-line w-6"></i> Métriques</li>
                    <li class="text-gray-400"><i class="fa-solid fa-credit-card w-6"></i> Plans</li>
                </ul>
                <button onclick="logout()" class="mt-auto absolute bottom-6 text-red-400"><i class="fa-solid fa-power-off mr-2"></i> Déconnexion</button>
            </aside>
            
            <!-- Content -->
            <main class="flex-1 p-8">
                <h1 class="text-2xl font-bold mb-6">Demandes d'inscription</h1>
                
                <div class="bg-white rounded-xl shadow overflow-hidden">
                    <table class="w-full text-left">
                        <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th class="p-4">Date</th>
                                <th class="p-4">Club</th>
                                <th class="p-4">Email</th>
                                <th class="p-4">Statut</th>
                                <th class="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${dbRequests.map(req => `
                                <tr>
                                    <td class="p-4 text-sm">${req.date}</td>
                                    <td class="p-4 font-bold">${req.clubName}</td>
                                    <td class="p-4 text-sm text-gray-500">${req.email}</td>
                                    <td class="p-4"><span class="px-2 py-1 rounded text-xs font-bold ${req.status === 'VALIDATED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${req.status}</span></td>
                                    <td class="p-4 text-right">
                                        ${req.status === 'PENDING'
            ? `<button onclick="validateRequest(${req.id})" class="text-blue-600 hover:underline font-bold">Valider</button>`
            : `<span class="text-gray-400"><i class="fa-solid fa-check"></i></span>`
        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    `;
}

// 6. CLUB ADMIN DASHBOARD (CMS & Settings)
function ClubDashboard() {
    return `
        <div class="flex min-h-screen bg-gray-100">
            <!-- Sidebar -->
            <aside class="w-64 bg-white border-r p-6 hidden md:block">
                <div class="flex items-center gap-2 mb-8 text-blue-600">
                    <i class="fa-solid fa-shield-cat text-2xl"></i>
                    <span class="font-bold text-lg">FC Canvas</span>
                </div>
                <ul class="space-y-2">
                    <li class="p-2 bg-blue-50 text-blue-700 rounded font-medium cursor-pointer"><i class="fa-solid fa-wand-magic-sparkles w-6"></i> Site & CMS</li>
                    <li class="p-2 text-gray-600 hover:bg-gray-50 rounded cursor-pointer"><i class="fa-solid fa-receipt w-6"></i> Abonnement</li>
                    <li class="p-2 text-gray-600 hover:bg-gray-50 rounded cursor-pointer"><i class="fa-solid fa-users w-6"></i> Utilisateurs</li>
                </ul>
                <button onclick="logout()" class="mt-8 text-red-500 text-sm font-bold">Déconnexion</button>
            </aside>

            <main class="flex-1 p-8 overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold">Personnalisation Landing Page</h1>
                    <button onclick="navigate('LANDING')" class="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"><i class="fa-solid fa-eye mr-1"></i> Voir le site</button>
                </div>

                <div class="grid lg:grid-cols-2 gap-8">
                    <!-- CMS Form -->
                    <div class="bg-white p-6 rounded-xl shadow-sm h-fit">
                        <h2 class="font-bold mb-4 text-gray-700 border-b pb-2">Contenu & Design</h2>
                        <form onsubmit="updateCMS(event)" class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-500 mb-1">Titre Hero</label>
                                <input type="text" name="heroTitle" value="${state.cms.heroTitle}" class="w-full p-2 border rounded">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 mb-1">Sous-titre</label>
                                <textarea name="heroSubtitle" class="w-full p-2 border rounded h-20">${state.cms.heroSubtitle}</textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 mb-1">Couleur Principale</label>
                                <div class="flex gap-2">
                                    <input type="color" name="primaryColor" value="${state.cms.primaryColor}" class="h-10 w-10 p-1 border rounded cursor-pointer">
                                    <input type="text" value="${state.cms.primaryColor}" class="flex-1 p-2 border rounded bg-gray-50" readonly>
                                </div>
                            </div>
                            <div class="pt-4">
                                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Sauvegarder les modifications</button>
                            </div>
                        </form>
                    </div>

                    <!-- Info Abonnement (SaaS) -->
                    <div class="bg-white p-6 rounded-xl shadow-sm h-fit">
                        <h2 class="font-bold mb-4 text-gray-700 border-b pb-2">Mon Abonnement</h2>
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <span class="text-sm text-gray-500">Plan actuel</span>
                                <div class="text-2xl font-bold text-blue-600">PRO <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2 align-middle">Actif</span></div>
                            </div>
                            <div class="text-right">
                                <span class="text-sm text-gray-500">Prix</span>
                                <div class="font-medium">29€/mois</div>
                            </div>
                        </div>
                        <div class="bg-gray-50 p-4 rounded mb-4">
                            <div class="flex justify-between text-sm mb-1">
                                <span>Utilisateurs</span>
                                <span class="font-bold">45 / 100</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: 45%"></div>
                            </div>
                        </div>
                        <button class="w-full border border-gray-300 py-2 rounded font-medium hover:bg-gray-50">Gérer la facturation</button>
                    </div>
                </div>
            </main>
        </div>
    `;
}

// 7. APP MOBILE PREVIEW (Simulation Coach/Joueur)
function AppPreview() {
    return `
        <div class="min-h-screen bg-gray-800 py-8 flex items-center justify-center flex-col">
            <div class="text-white mb-4 text-center">
                <h2 class="text-xl font-bold">Aperçu App Mobile</h2>
                <p class="text-gray-400 text-sm">Vue Coach / Joueur</p>
                <button onclick="navigate('LANDING')" class="mt-2 text-sm underline text-blue-300">Retour au site</button>
            </div>

            <div class="mobile-preview relative shadow-2xl">
                <!-- Header App -->
                <div class="bg-[${state.cms.primaryColor}] text-white p-4 pt-8 sticky top-0">
                    <div class="flex justify-between items-center">
                        <span class="font-bold"><i class="fa-solid fa-shield-cat mr-2"></i>FC Canvas</span>
                        <i class="fa-solid fa-bell"></i>
                    </div>
                </div>
                
                <!-- Content App -->
                <div class="p-4 overflow-y-auto h-[calc(100%-120px)] bg-gray-50">
                    <h3 class="font-bold text-gray-800 mb-4">Prochain Match</h3>
                    <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 mb-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-xs font-bold text-gray-500 uppercase">Championnat</span>
                            <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Convoqué</span>
                        </div>
                        <div class="text-lg font-bold mb-1">vs Olympique Codeur</div>
                        <div class="text-sm text-gray-500"><i class="fa-regular fa-clock mr-1"></i> Demain 15:00</div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <button class="bg-white p-4 rounded-xl shadow-sm text-center">
                            <i class="fa-solid fa-users text-2xl text-blue-500 mb-2"></i>
                            <div class="text-sm font-bold">Effectif</div>
                        </button>
                            <button class="bg-white p-4 rounded-xl shadow-sm text-center">
                            <i class="fa-solid fa-comments text-2xl text-green-500 mb-2"></i>
                            <div class="text-sm font-bold">Chat</div>
                        </button>
                    </div>
                </div>

                <!-- Bottom Nav App -->
                <div class="absolute bottom-0 w-full bg-white border-t p-3 flex justify-around text-gray-400">
                    <div class="text-[${state.cms.primaryColor}] flex flex-col items-center"><i class="fa-solid fa-calendar-days"></i><span class="text-[10px]">Planning</span></div>
                    <div class="flex flex-col items-center hover:text-gray-600"><i class="fa-solid fa-users"></i><span class="text-[10px]">Staff</span></div>
                    <div class="flex flex-col items-center hover:text-gray-600"><i class="fa-solid fa-user"></i><span class="text-[10px]">Profil</span></div>
                </div>
            </div>
        </div>
    `;
}