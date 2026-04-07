// ─── Demo Club ───────────────────────────────────────────────────────────────
export const DEMO_CLUB = {
  id: 'club-001',
  name: 'FC Les Aiglons',
  city: 'Lyon',
  founded_year: 1987,
  logo: null,
  colors: { primary: '#16a34a', secondary: '#ffffff' },
  stadium: 'Stade des Lumières',
  description: 'Club de football fondé en 1987 à Lyon. Passion, travail et fair-play.',
}

// ─── Demo Teams ──────────────────────────────────────────────────────────────
export const DEMO_TEAMS = [
  { id: 'team-001', club_id: 'club-001', name: 'Senior A', category: 'Senior', coach_ids: ['user-coach-001'], colors: { primary: '#16a34a', secondary: '#fff' } },
  { id: 'team-002', club_id: 'club-001', name: 'U18 A', category: 'U18', coach_ids: ['user-coach-002'], colors: { primary: '#2563eb', secondary: '#fff' } },
  { id: 'team-003', club_id: 'club-001', name: 'U15 B', category: 'U15', coach_ids: [], colors: { primary: '#9333ea', secondary: '#fff' } },
]

// ─── Demo Players ─────────────────────────────────────────────────────────────
export const DEMO_PLAYERS = [
  { id: 'p01', user_id: 'user-player-001', club_id: 'club-001', team_id: 'team-001', jersey_number: 1, position: 'Goalkeeper', technical: 72, physical_score: 78, tactical: 70, mental: 80,
    profile: { first_name: 'Lucas', last_name: 'Martin', age: 26, nationality: 'French', height: 188, weight: 83, foot: 'right', avatar: null },
    stats: { goals: 0, assists: 1, matches_played: 22, yellow_cards: 1, red_cards: 0 } },
  { id: 'p02', user_id: 'u2', club_id: 'club-001', team_id: 'team-001', jersey_number: 2, position: 'Defender', technical: 68, physical_score: 80, tactical: 74, mental: 76,
    profile: { first_name: 'Thomas', last_name: 'Dubois', age: 24, nationality: 'French', height: 182, weight: 78, foot: 'right', avatar: null },
    stats: { goals: 1, assists: 3, matches_played: 21, yellow_cards: 4, red_cards: 0 } },
  { id: 'p03', user_id: 'u3', club_id: 'club-001', team_id: 'team-001', jersey_number: 5, position: 'Defender', technical: 70, physical_score: 82, tactical: 78, mental: 75,
    profile: { first_name: 'Pierre', last_name: 'Moreau', age: 28, nationality: 'French', height: 185, weight: 82, foot: 'right', avatar: null },
    stats: { goals: 2, assists: 1, matches_played: 20, yellow_cards: 3, red_cards: 1 } },
  { id: 'p04', user_id: 'u4', club_id: 'club-001', team_id: 'team-001', jersey_number: 6, position: 'Defender', technical: 67, physical_score: 79, tactical: 76, mental: 73,
    profile: { first_name: 'Antoine', last_name: 'Bernard', age: 23, nationality: 'French', height: 183, weight: 79, foot: 'left', avatar: null },
    stats: { goals: 0, assists: 2, matches_played: 18, yellow_cards: 2, red_cards: 0 } },
  { id: 'p05', user_id: 'u5', club_id: 'club-001', team_id: 'team-001', jersey_number: 3, position: 'Defender', technical: 71, physical_score: 76, tactical: 72, mental: 74,
    profile: { first_name: 'Maxime', last_name: 'Lefebvre', age: 25, nationality: 'French', height: 179, weight: 74, foot: 'left', avatar: null },
    stats: { goals: 1, assists: 5, matches_played: 22, yellow_cards: 3, red_cards: 0 } },
  { id: 'p06', user_id: 'u6', club_id: 'club-001', team_id: 'team-001', jersey_number: 8, position: 'Midfielder', technical: 82, physical_score: 74, tactical: 80, mental: 79,
    profile: { first_name: 'Kevin', last_name: 'Simon', age: 27, nationality: 'French', height: 176, weight: 72, foot: 'right', avatar: null },
    stats: { goals: 5, assists: 8, matches_played: 22, yellow_cards: 2, red_cards: 0 } },
  { id: 'p07', user_id: 'u7', club_id: 'club-001', team_id: 'team-001', jersey_number: 4, position: 'Midfielder', technical: 79, physical_score: 78, tactical: 83, mental: 81,
    profile: { first_name: 'Baptiste', last_name: 'Laurent', age: 29, nationality: 'French', height: 180, weight: 75, foot: 'right', avatar: null },
    stats: { goals: 3, assists: 6, matches_played: 21, yellow_cards: 5, red_cards: 0 } },
  { id: 'p08', user_id: 'u8', club_id: 'club-001', team_id: 'team-001', jersey_number: 14, position: 'Midfielder', technical: 77, physical_score: 75, tactical: 76, mental: 78,
    profile: { first_name: 'Julien', last_name: 'Roux', age: 22, nationality: 'French', height: 177, weight: 71, foot: 'both', avatar: null },
    stats: { goals: 4, assists: 7, matches_played: 20, yellow_cards: 1, red_cards: 0 } },
  { id: 'p09', user_id: 'u9', club_id: 'club-001', team_id: 'team-001', jersey_number: 7, position: 'Winger', technical: 86, physical_score: 82, tactical: 74, mental: 77,
    profile: { first_name: 'Alexandre', last_name: 'Petit', age: 24, nationality: 'French', height: 173, weight: 68, foot: 'right', avatar: null },
    stats: { goals: 8, assists: 11, matches_played: 22, yellow_cards: 1, red_cards: 0 } },
  { id: 'p10', user_id: 'user-player-001', club_id: 'club-001', team_id: 'team-001', jersey_number: 9, position: 'Forward', technical: 88, physical_score: 84, tactical: 78, mental: 85,
    profile: { first_name: 'Nicolas', last_name: 'Garcia', age: 25, nationality: 'French', height: 181, weight: 77, foot: 'right', avatar: null },
    stats: { goals: 18, assists: 6, matches_played: 22, yellow_cards: 2, red_cards: 0 } },
  { id: 'p11', user_id: 'u11', club_id: 'club-001', team_id: 'team-001', jersey_number: 11, position: 'Winger', technical: 84, physical_score: 80, tactical: 72, mental: 76,
    profile: { first_name: 'Romain', last_name: 'Thomas', age: 21, nationality: 'French', height: 175, weight: 70, foot: 'left', avatar: null },
    stats: { goals: 9, assists: 7, matches_played: 19, yellow_cards: 0, red_cards: 0 } },
  { id: 'p12', user_id: 'u12', club_id: 'club-001', team_id: 'team-001', jersey_number: 16, position: 'Goalkeeper', technical: 68, physical_score: 74, tactical: 67, mental: 72,
    profile: { first_name: 'Adrien', last_name: 'Faure', age: 20, nationality: 'French', height: 186, weight: 80, foot: 'right', avatar: null },
    stats: { goals: 0, assists: 0, matches_played: 2, yellow_cards: 0, red_cards: 0 } },
  { id: 'p13', user_id: 'u13', club_id: 'club-001', team_id: 'team-001', jersey_number: 17, position: 'Defender', technical: 65, physical_score: 77, tactical: 70, mental: 69,
    profile: { first_name: 'Florian', last_name: 'Denis', age: 19, nationality: 'French', height: 181, weight: 76, foot: 'right', avatar: null },
    stats: { goals: 0, assists: 0, matches_played: 5, yellow_cards: 1, red_cards: 0 } },
  { id: 'p14', user_id: 'u14', club_id: 'club-001', team_id: 'team-001', jersey_number: 20, position: 'Midfielder', technical: 73, physical_score: 71, tactical: 74, mental: 72,
    profile: { first_name: 'Mathieu', last_name: 'Girard', age: 22, nationality: 'French', height: 178, weight: 73, foot: 'right', avatar: null },
    stats: { goals: 2, assists: 3, matches_played: 11, yellow_cards: 0, red_cards: 0 } },
  { id: 'p15', user_id: 'u15', club_id: 'club-001', team_id: 'team-001', jersey_number: 22, position: 'Forward', technical: 80, physical_score: 79, tactical: 72, mental: 74,
    profile: { first_name: 'Clément', last_name: 'Blanc', age: 23, nationality: 'French', height: 179, weight: 75, foot: 'right', avatar: null },
    stats: { goals: 7, assists: 3, matches_played: 15, yellow_cards: 1, red_cards: 0 } },
  { id: 'p16', user_id: 'u16', club_id: 'club-001', team_id: 'team-001', jersey_number: 10, position: 'Midfielder', technical: 90, physical_score: 77, tactical: 85, mental: 88,
    profile: { first_name: 'Hugo', last_name: 'Renard', age: 26, nationality: 'French', height: 178, weight: 73, foot: 'right', avatar: null },
    stats: { goals: 12, assists: 14, matches_played: 22, yellow_cards: 2, red_cards: 0 } },
]

// ─── Demo Users ──────────────────────────────────────────────────────────────
export const DEMO_USERS: Record<string, object> = {
  superadmin: {
    id: 'user-super-001', email: 'super@demo.fc', role: 'superadmin', club_id: null, account_status: 'active',
    profile: { first_name: 'Marc', last_name: 'Dupont', avatar: null, phone: '+33 6 00 00 00 01' },
  },
  admin: {
    id: 'user-admin-001', email: 'admin@demo.fc', role: 'admin', club_id: 'club-001', account_status: 'active',
    profile: { first_name: 'Sophie', last_name: 'Laurent', avatar: null, phone: '+33 6 00 00 00 02' },
  },
  coach: {
    id: 'user-coach-001', email: 'coach@demo.fc', role: 'coach', club_id: 'club-001', account_status: 'active',
    profile: { first_name: 'Éric', last_name: 'Moreau', avatar: null, phone: '+33 6 00 00 00 03', position: 'Head Coach' },
  },
  player: {
    id: 'user-player-001', email: 'player@demo.fc', role: 'player', club_id: 'club-001', account_status: 'active',
    profile: { first_name: 'Nicolas', last_name: 'Garcia', avatar: null, phone: '+33 6 00 00 00 04', position: 'Forward' },
  },
  parent: {
    id: 'user-parent-001', email: 'parent@demo.fc', role: 'parent', club_id: 'club-001', account_status: 'active',
    profile: { first_name: 'Claire', last_name: 'Garcia', avatar: null, phone: '+33 6 00 00 00 05' },
  },
}

// ─── Demo Events ──────────────────────────────────────────────────────────────
export const DEMO_EVENTS = [
  { id: 'ev01', club_id: 'club-001', team_id: 'team-001', title: 'Entraînement Senior A', type: 'training', date: '2026-04-02T18:30:00Z', location: 'Stade des Lumières - Terrain 2', description: 'Séance axée sur les phases de transition. Tenue complète obligatoire.' },
  { id: 'ev02', club_id: 'club-001', team_id: 'team-001', title: 'Match vs AS Beaumont', type: 'match', date: '2026-04-05T15:00:00Z', location: 'Stade des Lumières', description: 'Match de championnat — journée 24. Arrivée au stade 1h avant le coup d\'envoi.' },
  { id: 'ev03', club_id: 'club-001', team_id: 'team-001', title: 'Entraînement + vidéo', type: 'training', date: '2026-04-07T18:30:00Z', location: 'Stade des Lumières - Terrain 1', description: 'Analyse vidéo du match AS Beaumont suivi d\'un entraînement.' },
  { id: 'ev04', club_id: 'club-001', team_id: null, title: 'Réunion CA mensuelle', type: 'meeting', date: '2026-04-08T20:00:00Z', location: 'Salle de réunion - Bâtiment B', description: 'Ordre du jour: budget, tournoi d\'été, recrutement.' },
  { id: 'ev05', club_id: 'club-001', team_id: 'team-001', title: 'Entraînement Senior A', type: 'training', date: '2026-04-09T18:30:00Z', location: 'Terrain synthétique', description: 'Travail technique et mise en place du système 4-2-3-1.' },
  { id: 'ev06', club_id: 'club-001', team_id: 'team-001', title: 'Match à Grenoble FC', type: 'match', date: '2026-04-12T14:00:00Z', location: 'Stade Victor Bouchet, Grenoble', description: 'Déplacement à Grenoble — journée 25. Bus club à 11h00.' },
  { id: 'ev07', club_id: 'club-001', team_id: 'team-002', title: 'Match U18 vs Lyon FC', type: 'match', date: '2026-04-06T10:00:00Z', location: 'Stade des Lumières - Terrain 3', description: 'Match de championnat U18.' },
]

// ─── Demo Matches ─────────────────────────────────────────────────────────────
export const DEMO_MATCHES_UPCOMING = [
  { id: 'm-u01', club_id: 'club-001', opponent: 'AS Beaumont', date: '2026-04-05T15:00:00Z', location: 'Stade des Lumières', is_home: true, status: 'scheduled', competition: 'Championnat R1 Auvergne-Rhône-Alpes' },
  { id: 'm-u02', club_id: 'club-001', opponent: 'Grenoble FC', date: '2026-04-12T14:00:00Z', location: 'Stade Victor Bouchet', is_home: false, status: 'scheduled', competition: 'Championnat R1 Auvergne-Rhône-Alpes' },
  { id: 'm-u03', club_id: 'club-001', opponent: 'SC Vallée', date: '2026-04-19T15:00:00Z', location: 'Stade des Lumières', is_home: true, status: 'scheduled', competition: 'Championnat R1 Auvergne-Rhône-Alpes' },
  { id: 'm-u04', club_id: 'club-001', opponent: 'FC Mâcon', date: '2026-04-26T14:30:00Z', location: 'Stade de la Maison-Blanche', is_home: false, status: 'scheduled', competition: 'Coupe Régionale' },
]

export const DEMO_MATCHES_RESULTS = [
  { id: 'm-r01', club_id: 'club-001', opponent: 'US Villeurbanne', date: '2026-03-29T15:00:00Z', location: 'Stade des Lumières', is_home: true, status: 'finished', score: { home: 3, away: 1 }, competition: 'Championnat R1' },
  { id: 'm-r02', club_id: 'club-001', opponent: 'Clermont B', date: '2026-03-22T14:00:00Z', location: 'Stade Gabriel Montpied', is_home: false, status: 'finished', score: { home: 2, away: 2 }, competition: 'Championnat R1' },
  { id: 'm-r03', club_id: 'club-001', opponent: 'Annecy FC', date: '2026-03-15T15:00:00Z', location: 'Stade des Lumières', is_home: true, status: 'finished', score: { home: 2, away: 0 }, competition: 'Championnat R1' },
  { id: 'm-r04', club_id: 'club-001', opponent: 'FC Roanne', date: '2026-03-08T14:00:00Z', location: 'Stade Pierre Martel', is_home: false, status: 'finished', score: { home: 0, away: 1 }, competition: 'Championnat R1' },
  { id: 'm-r05', club_id: 'club-001', opponent: 'AS Oyonnax', date: '2026-03-01T15:00:00Z', location: 'Stade des Lumières', is_home: true, status: 'finished', score: { home: 4, away: 0 }, competition: 'Championnat R1' },
]

// ─── Demo Posts ──────────────────────────────────────────────────────────────
export const DEMO_POSTS = [
  { id: 'post01', club_id: 'club-001', author: { id: 'user-admin-001', name: 'Sophie Laurent' }, title: '🏆 Victoire 3-1 contre US Villeurbanne !', content: 'Quelle belle victoire à domicile ce samedi ! Nos Aiglons ont livré une prestation de haute volée face à US Villeurbanne. Doublé de Nicolas Garcia et un but splendide d\'Hugo Renard sur coup franc. Bravo à toute l\'équipe !', image: null, likes: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12'], comments: [{ author: 'Kevin Simon', text: 'Superbe match ! Toute l\'équipe était au rendez-vous 💪', date: '2 hours ago' }, { author: 'Baptiste Laurent', text: 'Merci à tous les supporters présents !', date: '1 hour ago' }], category: 'match', created_at: '2026-03-29T18:00:00Z' },
  { id: 'post02', club_id: 'club-001', author: { id: 'user-admin-001', name: 'Sophie Laurent' }, title: 'Mercato hivernal — Bienvenue à Clément Blanc !', content: 'Le FC Les Aiglons est fier d\'annoncer la signature de Clément Blanc en provenance de l\'AS Mâcon. L\'attaquant de 23 ans s\'engage pour 18 mois avec le club. Bienvenue Clément !', image: null, likes: ['u1','u2','u3','u4','u5'], comments: [{ author: 'Nicolas Garcia', text: 'Bienvenue dans la famille ! 🦅', date: '3 days ago' }], category: 'club', created_at: '2026-03-20T10:00:00Z' },
  { id: 'post03', club_id: 'club-001', author: { id: 'user-coach-001', name: 'Éric Moreau' }, title: 'Programme de la semaine', content: 'Bonjour à tous. Voici le programme pour cette semaine :\n• Mardi 18h30 : Entraînement (travail physique + technique)\n• Jeudi 18h30 : Entraînement tactique (schéma 4-2-3-1)\n• Samedi 15h00 : Match vs AS Beaumont à domicile\n\nPrésence obligatoire. Voir convocations individuelles.', image: null, likes: ['u1','u2','u3'], comments: [], category: 'training', created_at: '2026-03-31T08:00:00Z' },
  { id: 'post04', club_id: 'club-001', author: { id: 'user-admin-001', name: 'Sophie Laurent' }, title: 'Tournoi d\'été — Save the date !', content: 'Le tournoi annuel de FC Les Aiglons aura lieu les 14-15 juin 2026. 8 équipes invitées, matches de 45 minutes, ambiance garantie ! Plus d\'infos à venir. Réservez ces dates dans votre agenda.', image: null, likes: ['u1','u2','u3','u4','u5','u6','u7'], comments: [{ author: 'Sophie Laurent', text: 'Les inscriptions ouvrent le 1er mai !', date: '5 days ago' }], category: 'event', created_at: '2026-03-25T14:00:00Z' },
  { id: 'post05', club_id: 'club-001', author: { id: 'user-coach-001', name: 'Éric Moreau' }, title: 'Analyse : Performance collective', content: 'Après analyse des 5 derniers matchs, voici les points à retenir :\n✅ Pressing haut efficace (78% de succès)\n✅ 12 buts marqués\n⚠️ 6 buts encaissés sur phase de transition\n⚠️ Manque de profondeur sur le côté droit\n\nSéance vidéo organisée jeudi avant l\'entraînement.', image: null, likes: ['u7','u8','u9'], comments: [], category: 'training', created_at: '2026-03-28T16:00:00Z' },
]

// ─── Demo Notifications ───────────────────────────────────────────────────────
export const DEMO_NOTIFICATIONS = [
  { id: 'n01', type: 'match', title: 'Rappel : Match samedi 15h', message: 'FC Les Aiglons vs AS Beaumont — Stade des Lumières. Convocation confirmée.', read: false, created_at: '2026-04-01T08:00:00Z', data: { match_id: 'm-u01' } },
  { id: 'n02', type: 'training', title: 'Entraînement ce soir 18h30', message: 'Séance de travail tactique + préparation match AS Beaumont. Présence obligatoire.', read: false, created_at: '2026-04-01T07:00:00Z', data: {} },
  { id: 'n03', type: 'comment', title: 'Nouveau commentaire', message: 'Kevin Simon a commenté votre publication "Programme de la semaine".', read: false, created_at: '2026-03-31T14:32:00Z', data: { post_id: 'post03' } },
  { id: 'n04', type: 'like', title: 'Votre post est populaire !', message: '12 personnes ont aimé votre publication "Victoire 3-1 contre US Villeurbanne".', read: true, created_at: '2026-03-29T19:00:00Z', data: { post_id: 'post01' } },
  { id: 'n05', type: 'contract', title: 'Nouveau contrat à examiner', message: 'Un nouveau contrat pour la saison 2026-2027 est disponible. Veuillez le consulter.', read: true, created_at: '2026-03-28T10:00:00Z', data: {} },
  { id: 'n06', type: 'message', title: 'Nouveau message', message: 'Éric Moreau vous a envoyé un message : "Bien joué samedi !"', read: true, created_at: '2026-03-29T18:30:00Z', data: {} },
]

// ─── Demo Conversations ───────────────────────────────────────────────────────
export const DEMO_CONVERSATIONS = [
  { id: 'conv01', type: 'team', name: 'Senior A — Équipe', avatar: null, last_message: 'Coach: RDV à 18h30 ce soir !', last_message_at: '2026-04-01T07:30:00Z', unread_count: 3, team_id: 'team-001' },
  { id: 'conv02', type: 'direct', name: 'Éric Moreau (Coach)', avatar: null, last_message: 'Bien joué samedi ! Continue comme ça', last_message_at: '2026-03-29T18:35:00Z', unread_count: 1, other_user_id: 'user-coach-001' },
  { id: 'conv03', type: 'direct', name: 'Sophie Laurent (Admin)', avatar: null, last_message: 'Les photos du match sont disponibles', last_message_at: '2026-03-30T10:00:00Z', unread_count: 0, other_user_id: 'user-admin-001' },
  { id: 'conv04', type: 'team', name: 'FC Les Aiglons — Général', avatar: null, last_message: 'Tournoi d\'été confirmé !', last_message_at: '2026-03-25T14:30:00Z', unread_count: 0, team_id: 'team-001' },
]

export const DEMO_MESSAGES_TEAM = [
  { id: 'msg01', sender_id: 'user-coach-001', sender_name: 'Éric Moreau', content: 'Bonjour à tous ! Rappel : entraînement ce soir 18h30. 100% de présence attendue avant le match de samedi.', created_at: '2026-04-01T07:30:00Z', read_by: ['user-coach-001', 'u2', 'u3'] },
  { id: 'msg02', sender_id: 'p06', sender_name: 'Kevin Simon', content: 'Présent coach ! On va tout donner ce soir 💪', created_at: '2026-04-01T07:45:00Z', read_by: ['user-coach-001', 'u2', 'u3', 'p06'] },
  { id: 'msg03', sender_id: 'p10', sender_name: 'Nicolas Garcia', content: 'Idem, j\'arrive à 18h15. On va écraser AS Beaumont samedi !', created_at: '2026-04-01T07:50:00Z', read_by: ['user-coach-001', 'p10'] },
  { id: 'msg04', sender_id: 'p16', sender_name: 'Hugo Renard', content: '🔥🔥 On est chauds ! Vous avez vu mon coup franc du match passé ?', created_at: '2026-04-01T08:00:00Z', read_by: ['p16'] },
  { id: 'msg05', sender_id: 'user-coach-001', sender_name: 'Éric Moreau', content: 'Hugo arrête de te vanter et concentre-toi sur la tactique 😄 À ce soir tout le monde !', created_at: '2026-04-01T08:05:00Z', read_by: ['user-coach-001'] },
]

export const DEMO_MESSAGES_DIRECT = [
  { id: 'dm01', sender_id: 'user-coach-001', sender_name: 'Éric Moreau', content: 'Bien joué samedi ! Continue comme ça Nicolas, tu étais en grande forme.', created_at: '2026-03-29T18:35:00Z', read_by: ['user-coach-001'] },
  { id: 'dm02', sender_id: 'user-player-001', sender_name: 'Nicolas Garcia', content: 'Merci coach ! Je me suis bien préparé cette semaine. On continue !', created_at: '2026-03-29T18:40:00Z', read_by: ['user-player-001', 'user-coach-001'] },
  { id: 'dm03', sender_id: 'user-coach-001', sender_name: 'Éric Moreau', content: 'On a besoin de toi samedi à 100%. AS Beaumont est une équipe solide.', created_at: '2026-03-30T09:00:00Z', read_by: ['user-coach-001'] },
]

// ─── Demo Contracts ───────────────────────────────────────────────────────────
export const DEMO_CONTRACTS = [
  { id: 'ct01', club_id: 'club-001', user_id: 'user-player-001', role: 'player', status: 'active', start_date: '2025-07-01T00:00:00Z', end_date: '2026-06-30T00:00:00Z', salary: 1200, conditions: 'Contrat amateur. Prime de match : 50€ par victoire, 20€ par nul. Remboursement frais kilométriques.' },
  { id: 'ct02', club_id: 'club-001', user_id: 'user-player-001', role: 'player', status: 'pending', start_date: '2026-07-01T00:00:00Z', end_date: '2027-06-30T00:00:00Z', salary: 1400, conditions: 'Renouvellement proposé. Augmentation de 200€/mois. Prime objectif : 500€ si top 3 buteurs du championnat.' },
]

// ─── Demo Tactics ─────────────────────────────────────────────────────────────
export const DEMO_TACTICS = [
  { id: 'tac01', club_id: 'club-001', team_id: 'team-001', formation: '4-3-3', name: 'Pressing Haut', passing_style: 'short', defensive_block: 'high', pressing: 'high', instructions: { passing_style: 'short', defensive_block: 'high', pressing: 'high', marking: 'zonal' } },
  { id: 'tac02', club_id: 'club-001', team_id: 'team-001', formation: '4-2-3-1', name: 'Bloc Médian', passing_style: 'mixed', defensive_block: 'medium', pressing: 'medium', instructions: { passing_style: 'mixed', defensive_block: 'medium', pressing: 'medium', marking: 'man' } },
  { id: 'tac03', club_id: 'club-001', team_id: 'team-001', formation: '3-5-2', name: 'Contre-attaque', passing_style: 'direct', defensive_block: 'low', pressing: 'low', instructions: { passing_style: 'direct', defensive_block: 'low', pressing: 'low', marking: 'zonal' } },
]

// ─── Demo Scouting ─────────────────────────────────────────────────────────────
export const DEMO_SCOUTING = [
  { id: 'sc01', player_name: 'Yanis Bouali', position: 'Midfielder', club: 'FC Bron', age: 21, notes: 'Très bonne vision du jeu, pied droit technique. Manque un peu de gabarit mais compensé par sa vivacité. À surveiller de près — potentiel senior A.', rating: 8 },
  { id: 'sc02', player_name: 'Lucas Ferreira', position: 'Defender', club: 'AS Vaulx-en-Velin', age: 22, notes: 'Défenseur central solide, bon dans le jeu aérien. Pieds corrects mais peut progresser sur la relance. Disponible à partir de janvier.', rating: 7 },
  { id: 'sc03', player_name: 'Théo Marchetti', position: 'Forward', club: 'SC Decines', age: 19, notes: 'Attaquant rapide et tranchant. A marqué 12 buts en U19 cette saison. Profil intéressant pour renforcer l\'attaque. Contrat se termine en juin.', rating: 7 },
  { id: 'sc04', player_name: 'Mehdi Ouali', position: 'Goalkeeper', club: 'Lyon FC B', age: 20, notes: 'Gardien avec de très bons réflexes. Bon jeu au pied — s\'intègrerait bien dans notre système de jeu. Hauteur 187cm. À contacter.', rating: 8 },
]

// ─── Demo Shop ────────────────────────────────────────────────────────────────
export const DEMO_PRODUCTS = [
  { id: 'prod01', name: 'Maillot Domicile 2025-26', price: 69.99, category: 'maillots', image: null, description: 'Maillot officiel FC Les Aiglons — Saison 2025-2026. Vert et blanc. Tailles S à 3XL.', stock: 45 },
  { id: 'prod02', name: 'Maillot Extérieur 2025-26', price: 69.99, category: 'maillots', image: null, description: 'Maillot extérieur officiel FC Les Aiglons. Blanc et vert. Tailles S à 3XL.', stock: 32 },
  { id: 'prod03', name: 'Survêtement Club', price: 89.99, category: 'training', image: null, description: 'Survêtement officiel du club. Veste + pantalon. Polyester recyclé.', stock: 20 },
  { id: 'prod04', name: 'Short d\'Entraînement', price: 29.99, category: 'training', image: null, description: 'Short léger pour l\'entraînement. Tissu respirant. Tailles S à XL.', stock: 60 },
  { id: 'prod05', name: 'Écharpe FC Les Aiglons', price: 19.99, category: 'accessories', image: null, description: 'Écharpe aux couleurs du club. Tricot jacquard double face.', stock: 80 },
  { id: 'prod06', name: 'Casquette Club', price: 24.99, category: 'accessories', image: null, description: 'Casquette snapback brodée. Taille unique réglable.', stock: 40 },
  { id: 'prod07', name: 'Ballon Officiel', price: 44.99, category: 'equipment', image: null, description: 'Ballon aux couleurs du club. Taille 5. Idéal pour l\'entraînement.', stock: 15 },
  { id: 'prod08', name: 'Sac de sport', price: 39.99, category: 'accessories', image: null, description: 'Sac de sport 40L avec compartiment chaussures. Logo FC Les Aiglons brodé.', stock: 25 },
  { id: 'prod09', name: 'Chaussettes Club (lot de 3)', price: 14.99, category: 'accessories', image: null, description: 'Lot de 3 paires de chaussettes officielles. Vert/blanc. Taille 38-46.', stock: 3 },
  { id: 'prod10', name: 'Pack Supporter', price: 99.99, category: 'packs', image: null, description: 'Maillot domicile + écharpe + casquette + autocollants. Idéal cadeau !', stock: 12 },
]

export const DEMO_SHOP_CATEGORIES = ['maillots', 'training', 'accessories', 'equipment', 'packs']

export const DEMO_ORDERS = [
  { id: 'ord01', created_at: '2026-03-15T10:30:00Z', status: 'delivered', items: [{ name: 'Maillot Domicile 2025-26', quantity: 1, price: 69.99 }, { name: 'Chaussettes Club (lot de 3)', quantity: 1, price: 14.99 }], total: 84.98 },
  { id: 'ord02', created_at: '2026-03-28T16:00:00Z', status: 'shipped', items: [{ name: 'Écharpe FC Les Aiglons', quantity: 2, price: 19.99 }], total: 39.98 },
]

// ─── Demo Admin Dashboard ─────────────────────────────────────────────────────
export const DEMO_ADMIN_DASHBOARD = {
  member_count: 47,
  team_count: 3,
  active_players: 38,
  subscription_plan: 'Pro',
  onboarding: { club_created: true, first_team: true, players_added: true, first_match: true, invites_sent: true },
  recent_activity: [
    { text: 'Nicolas Garcia a accepté le contrat 2026-2027', date: '2 hours ago' },
    { text: 'Clément Blanc ajouté à l\'effectif Senior A', date: '3 days ago' },
    { text: 'Résultat entré : Les Aiglons 3-1 US Villeurbanne', date: '3 days ago' },
    { text: 'Annonce "Tournoi d\'été" publiée', date: '6 days ago' },
    { text: '5 nouvelles invitations envoyées', date: '1 week ago' },
  ],
}

// ─── Demo Analytics ───────────────────────────────────────────────────────────
export const DEMO_ANALYTICS = {
  total_members: 47,
  active_players: 38,
  matches_played: 23,
  members_by_role: { player: 38, coach: 4, parent: 12, admin: 3 },
  team_stats: { 'Senior A': 22, 'U18 A': 18, 'U15 B': 15 },
  engagement: { posts_this_month: 12, comments: 48, likes: 156 },
}

// ─── Demo Coach Dashboard ─────────────────────────────────────────────────────
export const DEMO_COACH_DASHBOARD = {
  player_count: 16,
  upcoming_events: 3,
  next_match: { opponent: 'AS Beaumont', date: '2026-04-05T15:00:00Z', location: 'Stade des Lumières', is_home: true },
  win_rate: 65,
  recent_performance: ['W', 'D', 'W', 'L', 'W', 'W', 'D', 'W'],
}

// ─── Demo Player Stats ────────────────────────────────────────────────────────
export const DEMO_PLAYER_STATS = {
  goals: 18,
  assists: 6,
  matches_played: 22,
  yellow_cards: 2,
  red_cards: 0,
  average_rating: 7.4,
  win_rate: 65,
}

// ─── Demo Player Evolution ────────────────────────────────────────────────────
export const DEMO_PLAYER_EVOLUTION = {
  attributes: { pace: 84, shooting: 88, passing: 72, dribbling: 80, defending: 42, physical: 79 },
  evaluations: [
    { date: '2026-03-15', coach_name: 'Éric Moreau', strengths: 'Finition excellente, placement dans la surface, appels de balle', weaknesses: 'Pressing défensif à améliorer, travail hors ballon', rating: 8 },
    { date: '2026-02-01', coach_name: 'Éric Moreau', strengths: 'Bonne entente avec Hugo Renard, efforts reconnus', weaknesses: 'Déchet technique sur le pied gauche', rating: 7 },
  ],
}

// ─── Demo Members ─────────────────────────────────────────────────────────────
export const DEMO_MEMBERS = [
  { id: 'user-admin-001', email: 'admin@demo.fc', role: 'admin', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Sophie', last_name: 'Laurent' } },
  { id: 'user-coach-001', email: 'coach@demo.fc', role: 'coach', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Éric', last_name: 'Moreau' } },
  { id: 'user-coach-002', email: 'coach2@demo.fc', role: 'coach', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Jean-Paul', last_name: 'Martin' } },
  { id: 'user-player-001', email: 'player@demo.fc', role: 'player', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Nicolas', last_name: 'Garcia' } },
  { id: 'u2', email: 'thomas.dubois@demo.fc', role: 'player', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Thomas', last_name: 'Dubois' } },
  { id: 'u3', email: 'pierre.moreau@demo.fc', role: 'player', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Pierre', last_name: 'Moreau' } },
  { id: 'u6', email: 'kevin.simon@demo.fc', role: 'player', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Kevin', last_name: 'Simon' } },
  { id: 'u7', email: 'baptiste.laurent@demo.fc', role: 'player', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Baptiste', last_name: 'Laurent' } },
  { id: 'u9', email: 'alex.petit@demo.fc', role: 'player', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Alexandre', last_name: 'Petit' } },
  { id: 'u11', email: 'romain.thomas@demo.fc', role: 'player', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Romain', last_name: 'Thomas' } },
  { id: 'u16', email: 'hugo.renard@demo.fc', role: 'player', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Hugo', last_name: 'Renard' } },
  { id: 'user-parent-001', email: 'parent@demo.fc', role: 'parent', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Claire', last_name: 'Garcia' } },
  { id: 'p-parent2', email: 'parent2@demo.fc', role: 'parent', club_id: 'club-001', account_status: 'active', profile: { first_name: 'Jean', last_name: 'Martin' } },
]

// ─── Demo Announcements ───────────────────────────────────────────────────────
export const DEMO_ANNOUNCEMENTS = [
  { id: 'ann01', title: 'Réunion parents-joueurs', content: 'Une réunion parents-joueurs est organisée le vendredi 10 avril à 20h00 en salle de réunion. Thèmes : tournoi d\'été, cotisations, et programme de la fin de saison. Merci d\'être présents.', target_roles: ['player', 'parent'], created_at: '2026-03-30T09:00:00Z' },
  { id: 'ann02', title: '⚠️ Cotisations — Rappel', content: 'Rappel important : les cotisations du 2ème semestre sont dues avant le 15 avril. Merci de régler auprès du secrétariat ou via le lien de paiement envoyé par email.', target_roles: ['player', 'parent', 'coach'], created_at: '2026-03-25T10:00:00Z' },
  { id: 'ann03', title: 'Nouveau partenaire — Boulangerie Dupont', content: 'FC Les Aiglons est fier d\'accueillir la Boulangerie Dupont comme nouveau partenaire ! 10% de réduction pour tous les membres du club sur présentation de votre carte. Merci à eux pour leur soutien !', target_roles: ['player', 'coach', 'parent', 'admin'], created_at: '2026-03-18T14:00:00Z' },
]

// ─── Demo Subscription ───────────────────────────────────────────────────────
export const DEMO_SUBSCRIPTION = { plan: 'Pro', renewal_date: '2026-07-01', price: 79, features: ['100 joueurs', '10 équipes', 'Analytics avancés', 'Scouting', 'Match center', 'Boutique'] }

// ─── Demo ISY Payments ────────────────────────────────────────────────────────
export const DEMO_ISY_PAYMENTS = [
  { id: 'pay01', member_name: 'Nicolas Garcia', type: 'membership', amount: 280, period: 'Saison 2025-26', status: 'confirmed', created_at: '2025-09-01T00:00:00Z', notes: 'Paiement en 2 fois' },
  { id: 'pay02', member_name: 'Kevin Simon', type: 'membership', amount: 280, period: 'Saison 2025-26', status: 'confirmed', created_at: '2025-09-05T00:00:00Z' },
  { id: 'pay03', member_name: 'Hugo Renard', type: 'membership', amount: 140, period: 'Saison 2025-26 (1er versement)', status: 'pending', created_at: '2025-09-10T00:00:00Z' },
  { id: 'pay04', member_name: 'Clément Blanc', type: 'membership', amount: 140, period: 'Saison 2025-26', status: 'pending', created_at: '2026-02-01T00:00:00Z', notes: 'Arrivée en cours de saison' },
  { id: 'pay05', member_name: 'Thomas Dubois', type: 'equipment', amount: 65, period: 'Mars 2026', status: 'confirmed', created_at: '2026-03-01T00:00:00Z', notes: 'Maillot + short entraînement' },
]

// ─── Demo ISY Sponsors ────────────────────────────────────────────────────────
export const DEMO_ISY_SPONSORS = [
  { id: 'sp01', name: 'Auto Lyon Sud', type: 'gold', website: 'https://example.com', description: 'Concessionnaire automobile officiel du club depuis 2022.', amount: 5000 },
  { id: 'sp02', name: 'Boulangerie Dupont', type: 'silver', website: null, description: 'Partenaire local — pain et viennoiseries pour les matchs à domicile.', amount: 1500 },
  { id: 'sp03', name: 'Pharmacie du Stade', type: 'silver', website: null, description: 'Partenaire santé officiel. Soins et produits de récupération.', amount: 1200 },
  { id: 'sp04', name: 'Pizzeria La Victoire', type: 'bronze', website: null, description: 'Repas d\'équipe après les matchs à domicile.', amount: 600 },
]

// ─── Demo Superadmin ──────────────────────────────────────────────────────────
export const DEMO_SUPERADMIN_DASHBOARD = { club_count: 24, user_count: 1247, project_count: 8, revenue: 18420 }

export const DEMO_ALL_CLUBS = [
  { id: 'club-001', name: 'FC Les Aiglons', city: 'Lyon', founded_year: 1987, description: 'Club historique du quartier Gerland.', logo: null },
  { id: 'club-002', name: 'AS Beaumont', city: 'Beaumont-lès-Valence', founded_year: 1974, description: 'Club régional avec 3 équipes senior.', logo: null },
  { id: 'club-003', name: 'Grenoble FC Amateur', city: 'Grenoble', founded_year: 1999, description: 'Section amateur du Grenoble Foot 38.', logo: null },
  { id: 'club-004', name: 'SC Vallée Sportive', city: 'Valence', founded_year: 2003, description: 'Club créé par fusion de deux associations locales.', logo: null },
  { id: 'club-005', name: 'FC Mâcon Centre', city: 'Mâcon', founded_year: 1965, description: 'Doyen du championnat régional.', logo: null },
  { id: 'club-006', name: 'US Villeurbanne', city: 'Villeurbanne', founded_year: 1991, description: 'Fort de son centre de formation reconnu.', logo: null },
]

export const DEMO_PROJECTS = [
  { id: 'proj01', name: 'Refonte Module Tactiques', description: 'Ajout du tableau de bord interactif avec éditeur de formation drag & drop.', status: 'active', tickets: [{}, {}, {}] },
  { id: 'proj02', name: 'Intégration Stripe v3', description: 'Migration vers Stripe Payment Element pour la gestion des abonnements clubs.', status: 'active', tickets: [{}, {}] },
  { id: 'proj03', name: 'App Mobile iOS Push', description: 'Notifications push natives pour iOS — intégration APNs.', status: 'completed', tickets: [{}, {}, {}, {}] },
  { id: 'proj04', name: 'Export PDF Feuille de Match', description: 'Génération PDF de la feuille de match officielle au format FFF.', status: 'paused', tickets: [{}] },
]

// ─── Demo Training Plans ─────────────────────────────────────────────────────
export const DEMO_TRAINING_PLANS = [
  {
    id: 'tp01', name: 'Préparation Match AS Beaumont', type: 'weekly', start_date: '2026-03-31', end_date: '2026-04-05',
    focus_area: 'Phases de transition', description: 'Programme axé sur les transitions rapides et le pressing haut avant le match de samedi.',
    status: 'active', created_at: '2026-03-30T08:00:00Z',
    sessions: [
      { id: 'ts01', plan_id: 'tp01', date: '2026-04-01T18:30:00Z', duration: 90, location: 'Terrain 2', focus: 'Transitions défensives',
        drills: [{ drill_id: 'dr01', order: 1, duration: 20 }, { drill_id: 'dr03', order: 2, duration: 25 }],
        attendance: [], coach_notes: 'Bon travail collectif', training_load: 'high', status: 'completed' },
      { id: 'ts02', plan_id: 'tp01', date: '2026-04-03T18:30:00Z', duration: 75, location: 'Terrain 1', focus: 'Tactique 4-2-3-1',
        drills: [{ drill_id: 'dr02', order: 1, duration: 30 }, { drill_id: 'dr04', order: 2, duration: 20 }],
        attendance: [], coach_notes: '', training_load: 'medium', status: 'planned' },
    ],
  },
  {
    id: 'tp02', name: 'Bloc physique avril', type: 'monthly', start_date: '2026-04-01', end_date: '2026-04-30',
    focus_area: 'Endurance & explosivité', description: 'Renforcement physique pour la fin de saison. 3 séances/semaine.',
    status: 'active', created_at: '2026-03-28T10:00:00Z', sessions: [],
  },
  {
    id: 'tp03', name: 'Stage pré-saison', type: 'seasonal', start_date: '2026-07-15', end_date: '2026-08-05',
    focus_area: 'Reprise complète', description: 'Stage de 3 semaines — tests physiques, tactique et cohésion.',
    status: 'archived', created_at: '2025-06-10T09:00:00Z', sessions: [],
  },
]

// ─── Demo Drills ─────────────────────────────────────────────────────────────
export const DEMO_DRILLS = [
  { id: 'dr01', name: 'Rondo 5v2', description: 'Conservation du ballon en espace réduit. Développe la première touche et la vision du jeu.', category: 'passing', sub_category: 'rondo', duration: 15, players_needed: 7, equipment: ['ballons', 'coupelles'], difficulty: 'beginner', coaching_points: ['Première touche orientée', 'Appels dans le dos', 'Communication'], is_public: true },
  { id: 'dr02', name: 'Jeu de position 6v3', description: 'Possession structurée en supériorité numérique. Travail de la circulation du ballon.', category: 'tactical', sub_category: 'positional_play', duration: 20, players_needed: 9, equipment: ['ballons', 'chasubles', 'coupelles'], difficulty: 'intermediate', coaching_points: ['Occupation de l\'espace', 'Changement de jeu', 'Timing des passes'], is_public: true },
  { id: 'dr03', name: 'Circuit physique avec ballon', description: 'Enchaînement de sprints, dribbles et frappes. Travail de l\'endurance capacité.', category: 'physical', sub_category: 'endurance', duration: 25, players_needed: 12, equipment: ['ballons', 'haies', 'échelles', 'plots'], difficulty: 'advanced', coaching_points: ['Intensité constante', 'Qualité technique sous fatigue'], is_public: true },
  { id: 'dr04', name: 'Pressing haut 4v4+GK', description: 'Travail du pressing offensif en situation de jeu réel. Déclenchement et couverture.', category: 'tactical', sub_category: 'pressing', duration: 20, players_needed: 9, equipment: ['ballons', 'mini-buts', 'chasubles'], difficulty: 'intermediate', coaching_points: ['Déclencheur du pressing', 'Couverture en 2e rideau', 'Récupération haute'], is_public: false },
  { id: 'dr05', name: 'Finition en pivot', description: 'Travail des enchaînements contrôle-frappe en pivot et demi-tour.', category: 'shooting', sub_category: 'finishing', duration: 15, players_needed: 6, equipment: ['ballons', 'but'], difficulty: 'intermediate', coaching_points: ['Orientation du corps', 'Prise d\'info avant le contrôle', 'Frappe placée'], is_public: true },
  { id: 'dr06', name: 'Échauffement dynamique', description: 'Routine d\'échauffement complète avec mobilité articulaire et activation musculaire.', category: 'warmup', sub_category: 'activation', duration: 12, players_needed: 16, equipment: [], difficulty: 'beginner', coaching_points: ['Amplitude progressive', 'Travail proprioceptif'], is_public: true },
]

export const DEMO_DRILL_CATEGORIES = ['passing', 'tactical', 'physical', 'shooting', 'warmup', 'set_piece', 'goalkeeping']

// ─── Demo Injuries ───────────────────────────────────────────────────────────
export const DEMO_INJURIES = [
  {
    id: 'inj01', player_id: 'p04', player_name: 'Antoine Bernard', injury_type: 'Entorse', body_part: 'Cheville gauche',
    severity: 'moderate', description: 'Entorse de la cheville lors du match vs Clermont B. Pas de fracture (radio ok).', injury_date: '2026-03-22T15:30:00Z',
    expected_return: '2026-04-15', actual_return: null, status: 'recovering', medical_clearance: false,
    recovery_notes: [
      { date: '2026-03-23', update: 'Glaçage + repos complet 48h. Anti-inflammatoires prescrits.' },
      { date: '2026-03-28', update: 'Reprise marche normale. Début kiné lundi.' },
      { date: '2026-04-01', update: 'Kiné 3x/semaine. Travail proprioception en salle.' },
    ],
  },
  {
    id: 'inj02', player_id: 'p13', player_name: 'Florian Denis', injury_type: 'Contracture', body_part: 'Ischio-jambiers droit',
    severity: 'minor', description: 'Contracture survenue à l\'entraînement. Pas de déchirure à l\'écho.', injury_date: '2026-03-29T19:00:00Z',
    expected_return: '2026-04-07', actual_return: null, status: 'recovering', medical_clearance: false,
    recovery_notes: [
      { date: '2026-03-30', update: 'Repos + étirements doux. À réévaluer mercredi.' },
    ],
  },
  {
    id: 'inj03', player_id: 'p02', player_name: 'Thomas Dubois', injury_type: 'Contusion', body_part: 'Genou droit',
    severity: 'minor', description: 'Coup reçu au genou lors du match. Douleur modérée, pas de gonflement.', injury_date: '2026-03-15T16:00:00Z',
    expected_return: '2026-03-22', actual_return: '2026-03-21', status: 'resolved', medical_clearance: true, cleared_by: 'Dr. Martin',
    recovery_notes: [
      { date: '2026-03-16', update: 'Glaçage et repos. Contrôle OK.' },
      { date: '2026-03-21', update: 'Reprise sans douleur. Feu vert médical.' },
    ],
  },
]

export const DEMO_INJURY_STATS = {
  total: 5, active: 0, recovering: 2, resolved: 3,
  active_injuries: [],
  by_type: { 'Entorse': 2, 'Contracture': 1, 'Contusion': 1, 'Élongation': 1 },
  by_body_part: { 'Cheville': 2, 'Ischio-jambiers': 1, 'Genou': 1, 'Mollet': 1 },
  avg_recovery_days: 14,
}

// ─── Demo Player Analytics ───────────────────────────────────────────────────
export const DEMO_PLAYER_RANKINGS = [
  { player_id: 'p10', name: 'Nicolas Garcia', position: 'Forward', jersey_number: 9, goals: 18, assists: 6, matches_played: 22, avg_rating: 7.4, status: 'fit' },
  { player_id: 'p16', name: 'Hugo Renard', position: 'Midfielder', jersey_number: 10, goals: 12, assists: 14, matches_played: 22, avg_rating: 7.8, status: 'fit' },
  { player_id: 'p11', name: 'Romain Thomas', position: 'Winger', jersey_number: 11, goals: 9, assists: 7, matches_played: 19, avg_rating: 7.1, status: 'fit' },
  { player_id: 'p09', name: 'Alexandre Petit', position: 'Winger', jersey_number: 7, goals: 8, assists: 11, matches_played: 22, avg_rating: 7.2, status: 'fit' },
  { player_id: 'p15', name: 'Clément Blanc', position: 'Forward', jersey_number: 22, goals: 7, assists: 3, matches_played: 15, avg_rating: 6.8, status: 'fit' },
  { player_id: 'p06', name: 'Kevin Simon', position: 'Midfielder', jersey_number: 8, goals: 5, assists: 8, matches_played: 22, avg_rating: 7.0, status: 'fit' },
  { player_id: 'p08', name: 'Julien Roux', position: 'Midfielder', jersey_number: 14, goals: 4, assists: 7, matches_played: 20, avg_rating: 6.9, status: 'fit' },
  { player_id: 'p07', name: 'Baptiste Laurent', position: 'Midfielder', jersey_number: 4, goals: 3, assists: 6, matches_played: 21, avg_rating: 7.0, status: 'fit' },
]

export const DEMO_PLAYER_DASHBOARD_ANALYTICS = {
  player_id: 'p10', name: 'Nicolas Garcia', position: 'Forward', jersey_number: 9,
  stats: { goals: 18, assists: 6, matches_played: 22, yellow_cards: 2, red_cards: 0, minutes: 1890 },
  technical_ratings: { shooting: 88, passing: 72, dribbling: 80, heading: 75, first_touch: 82 },
  evaluations: [
    { comment: 'Finition excellente, placement dans la surface, appels de balle', rating: 8, date: '2026-03-15' },
    { comment: 'Bonne entente avec Hugo Renard, efforts reconnus', rating: 7, date: '2026-02-01' },
  ],
  physical_history: [
    { date: '2026-03-01', weight: 77, height: 181, sprint_speed: 84, endurance: 78 },
    { date: '2026-01-15', weight: 78, height: 181, sprint_speed: 82, endurance: 76 },
  ],
  goals_timeline: [
    { date: '2026-03-29', opponent: 'US Villeurbanne' }, { date: '2026-03-29', opponent: 'US Villeurbanne' },
    { date: '2026-03-15', opponent: 'Annecy FC' }, { date: '2026-03-08', opponent: 'FC Roanne' },
  ],
  assists_timeline: [
    { date: '2026-03-15', opponent: 'Annecy FC' }, { date: '2026-03-01', opponent: 'AS Oyonnax' },
  ],
  training_attendance: { total_sessions: 36, attended: 33, rate: 91.7 },
  injury_summary: { total: 0, active: null },
  matches_played: 22,
}
