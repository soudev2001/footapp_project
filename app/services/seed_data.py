# FootLogic V2 - Seed Data Service

from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

def seed_all():
    """Seed database with demo data"""
    from app.services.db import mongo, clear_all_collections
    from app.models import create_user, create_club, create_player, create_event, create_match, create_post

    print("[Seed] Starting database seed...")

    # Clear existing data
    clear_all_collections()

    # ========================================
    # 1. CREATE CLUBS
    # ========================================
    club1 = {
        'name': 'FootLogic Elite',
        'logo': 'https://ui-avatars.com/api/?name=Foot+Logic&background=84cc16&color=fff&size=128',
        'city': 'Paris',
        'founded_year': 1985,
        'colors': {'primary': '#84cc16', 'secondary': '#facc15'},
        'stadium': 'Elite Arena',
        'description': 'L\'excellence du management sportif au service du jeu.',
        'subscription': {
            'plan_id': 'pack_pro',
            'status': 'active',
            'start_date': datetime.utcnow()
        },
        'created_at': datetime.utcnow()
    }

    club2 = {
        'name': 'Logic Rangers',
        'logo': 'https://ui-avatars.com/api/?name=Logic+Rangers&background=facc15&color=000&size=128',
        'city': 'Lyon',
        'founded_year': 1992,
        'colors': {'primary': '#facc15', 'secondary': '#4d7c0f'},
        'stadium': 'Cyber Pitch',
        'description': 'Le futur du football, aujourd\'hui.',
        'created_at': datetime.utcnow()
    }

    club1_id = mongo.db.clubs.insert_one(club1).inserted_id
    club2_id = mongo.db.clubs.insert_one(club2).inserted_id
    print(f"[Seed] Created 2 clubs")

    # ========================================
    # 1b. CREATE TEAMS
    # ========================================
    team1 = {
        'club_id': club1_id,
        'name': 'Sénior A',
        'category': 'Senior',
        'coach_ids': [],
        'description': 'L\'équipe première du club.',
        'created_at': datetime.utcnow()
    }
    team1_id = mongo.db.teams.insert_one(team1).inserted_id
    print(f"[Seed] Created 1 team")

    # ========================================
    # 2. CREATE USERS
    # ========================================
    users = [
        create_user('admin@footlogic.fr', generate_password_hash('admin123'), 'admin', club1_id,
                   {'first_name': 'Admin', 'last_name': 'System', 'avatar': '', 'phone': '0600000000'}),
        create_user('superadmin1@footlogic.com', generate_password_hash('super123'), 'admin', None,
                   {'first_name': 'Super', 'last_name': 'User 1', 'avatar': '', 'phone': '0600000001'}),
        create_user('superadmin2@footlogic.com', generate_password_hash('super123'), 'admin', None,
                   {'first_name': 'Super', 'last_name': 'User 2', 'avatar': '', 'phone': '0600000002'}),
        create_user('superadmin3@footlogic.com', generate_password_hash('super123'), 'admin', None,
                   {'first_name': 'Super', 'last_name': 'User 3', 'avatar': '', 'phone': '0600000003'}),
        create_user('coach@fcelite.fr', generate_password_hash('coach123'), 'coach', club1_id,
                   {'first_name': 'Michel', 'last_name': 'Dupont', 'avatar': 'https://randomuser.me/api/portraits/men/1.jpg', 'phone': '0612345678'}),
        create_user('player1@fcelite.fr', generate_password_hash('player123'), 'player', club1_id,
                   {'first_name': 'Lucas', 'last_name': 'Martin', 'avatar': 'https://randomuser.me/api/portraits/men/2.jpg', 'phone': '0623456789'}),
        create_user('fan@fcelite.fr', generate_password_hash('fan123'), 'fan', club1_id,
                   {'first_name': 'Sophie', 'last_name': 'Bernard', 'avatar': 'https://randomuser.me/api/portraits/women/1.jpg', 'phone': '0634567890'}),
    ]

    user_ids = []
    for user in users:
        result = mongo.db.users.insert_one(user)
        user_ids.append(result.inserted_id)
    print(f"[Seed] Created {len(users)} users (including 3 new superadmins)")

    # ========================================
    # 2b. CREATE PROJECTS & TICKETS
    # ========================================
    from app.models import create_project, create_ticket
    project1 = create_project('FootLogic V2 Core', 'Main application development and infrastructure', user_ids[0], 'in_progress')
    project2 = create_project('Marketing & Launch', 'Launch campaign and club onboarding', user_ids[1], 'planning')

    p1_id = mongo.db.projects.insert_one(project1).inserted_id
    p2_id = mongo.db.projects.insert_one(project2).inserted_id

    tickets = [
        create_ticket(p1_id, 'Finaliser le module superadmin', 'Ajouter les vues et services de gestion de projet', user_ids[0], 'feature', 'high', 'in_progress'),
        create_ticket(p1_id, 'Correction bug auth session', 'Le token ne se rafraichit pas correctement sur mobile', user_ids[0], 'bug', 'critical', 'todo'),
        create_ticket(p1_id, 'Optimisation MongoDB indexes', 'Ameliorer les performances des recherches complexes', user_ids[0], 'improvement', 'medium', 'done'),
        create_ticket(p2_id, 'Design landing page', 'Creer une page d accueil attrayante pour les clubs', user_ids[1], 'task', 'high', 'todo'),
    ]
    mongo.db.tickets.insert_many(tickets)
    print(f"[Seed] Created 2 projects and {len(tickets)} tickets")

    # Link coach to team
    mongo.db.teams.update_one({'_id': team1_id}, {'$set': {'coach_ids': [user_ids[4]]}})

    # ... lines 87-261 remain mostly same, adjusting user index if needed ...
    # (Checking user_ids[2] in line 106, it was player1, now user_ids[5] is player1)
    player_data = [
        {'name': 'Lucas Martin', 'jersey': 1, 'pos': 'GK', 'goals': 0, 'assists': 0, 'matches': 18, 'status': 'active'},
        {'name': 'Thomas Bernard', 'jersey': 2, 'pos': 'DEF', 'goals': 1, 'assists': 3, 'matches': 20, 'status': 'active'},
        {'name': 'Antoine Roux', 'jersey': 3, 'pos': 'DEF', 'goals': 0, 'assists': 2, 'matches': 19, 'status': 'active'},
        {'name': 'Nicolas Petit', 'jersey': 4, 'pos': 'DEF', 'goals': 2, 'assists': 1, 'matches': 17, 'status': 'injured'},
        {'name': 'Hugo Moreau', 'jersey': 5, 'pos': 'DEF', 'goals': 1, 'assists': 4, 'matches': 21, 'status': 'active'},
        {'name': 'Julien Garnier', 'jersey': 6, 'pos': 'MID', 'goals': 3, 'assists': 8, 'matches': 22, 'status': 'active'},
        {'name': 'Maxime Leroy', 'jersey': 7, 'pos': 'MID', 'goals': 5, 'assists': 6, 'matches': 20, 'status': 'active'},
        {'name': 'Alexandre Simon', 'jersey': 8, 'pos': 'MID', 'goals': 4, 'assists': 7, 'matches': 21, 'status': 'active'},
        {'name': 'Romain Lambert', 'jersey': 10, 'pos': 'MID', 'goals': 8, 'assists': 12, 'matches': 22, 'status': 'active'},
        {'name': 'Pierre Dubois', 'jersey': 9, 'pos': 'ATT', 'goals': 15, 'assists': 5, 'matches': 22, 'status': 'active'},
        {'name': 'Olivier Laurent', 'jersey': 11, 'pos': 'ATT', 'goals': 12, 'assists': 8, 'matches': 21, 'status': 'active'},
    ]

    for i, p in enumerate(player_data):
        player = create_player(
            user_id=user_ids[5] if i == 0 else None,  # Link first player to player1 user
            club_id=club1_id,
            team_id=team1_id,
            jersey_number=p['jersey'],
            position=p['pos'],
            stats={
                'goals': p['goals'],
                'assists': p['assists'],
                'matches_played': p['matches'],
                'yellow_cards': i % 3,
                'red_cards': 0
            },
            name=p['name'],
            status=p['status'],
            photo=f'https://randomuser.me/api/portraits/men/{i+10}.jpg',
            height=170 + (i * 2),
            weight=65 + (i * 2)
        )
        mongo.db.players.insert_one(player)

    print(f"[Seed] Created {len(player_data)} players for FC Elite")

    # ========================================
    # 4. CREATE EVENTS
    # ========================================
    now = datetime.utcnow()
    events = [
        create_event(club1_id, 'Entrainement Technique', 'training', now + timedelta(days=1, hours=18), team_id=team1_id, location='Terrain A', description='Focus sur les passes courtes'),
        create_event(club1_id, 'Entrainement Physique', 'training', now + timedelta(days=3, hours=10), team_id=team1_id, location='Salle de Musculation', description='Renforcement musculaire'),
        create_event(club1_id, 'Reunion Tactique', 'meeting', now + timedelta(days=5, hours=19), team_id=team1_id, location='Salle de Conference', description='Preparation match de coupe'),
        create_event(club1_id, 'Match Amical', 'match', now + timedelta(days=7, hours=15), team_id=team1_id, location='Stade Municipal', description='Contre AS Montagne'),
        create_event(club1_id, 'Entrainement Gardiens', 'training', now + timedelta(days=2, hours=17), team_id=team1_id, location='Terrain B', description='Seance specifique gardiens'),
    ]

    for event in events:
        mongo.db.events.insert_one(event)
    print(f"[Seed] Created {len(events)} events")

    # ========================================
    # 5. CREATE MATCHES
    # ========================================
    matches = [
        {**create_match(club1_id, 'AS Montagne', now - timedelta(days=7), True, 'Stade Municipal', 'completed'),
         'score': {'home': 3, 'away': 1}},
        {**create_match(club1_id, 'Olympique Lyon B', now - timedelta(days=14), False, 'Stade de Lyon', 'completed'),
         'score': {'home': 2, 'away': 2}},
        create_match(club1_id, 'Racing FC', now + timedelta(days=7), True, 'Stade Municipal', 'scheduled'),
        create_match(club1_id, 'Stade Rennais B', now + timedelta(days=14), False, 'Roazhon Park B', 'scheduled'),
        create_match(club1_id, 'FC Nantes Reserve', now + timedelta(days=21), True, 'Stade Municipal', 'scheduled'),
    ]

    for match in matches:
        mongo.db.matches.insert_one(match)
    print(f"[Seed] Created {len(matches)} matches")

    # ========================================
    # 6. CREATE POSTS (News Feed)
    # ========================================
    posts = [
        create_post(club1_id, user_ids[1], 'Victoire eclatante en Coupe!',
                   'Notre equipe a realise une performance exceptionnelle hier soir avec une victoire 3-1 contre AS Montagne. Pierre Dubois auteur d un double.',
                   'match_report', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'),
        create_post(club1_id, user_ids[1], 'Bienvenue a notre nouveau sponsor',
                   'Nous sommes fiers d annoncer notre partenariat avec SportEquip pour la saison 2024. De nouveaux maillots arrivent!',
                   'announcement', 'https://images.unsplash.com/photo-1517466787929-bc90951d64b8?w=800'),
        create_post(club1_id, user_ids[0], 'Calendrier des entrainements',
                   'Le nouveau calendrier des entrainements pour janvier est disponible. Consultez la section Calendrier pour plus de details.',
                   'news', ''),
        create_post(club1_id, user_ids[1], 'Stage de perfectionnement',
                   'Un stage intensif sera organise pendant les vacances de fevrier. Inscription obligatoire avant le 15 janvier.',
                   'announcement', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800'),
    ]

    for post in posts:
        mongo.db.posts.insert_one(post)
    print(f"[Seed] Created {len(posts)} posts")

    # ========================================
    # 7. CREATE SHOP PRODUCTS
    # ========================================
    products = [
        {
            'name': 'Maillot Officiel Domicile',
            'price': 75.00,
            'image': 'https://images.unsplash.com/photo-1541033513277-299ae2cd9df1?w=800',
            'description': 'Le nouveau maillot pour la saison 2024. Technologie respirante.',
            'category': 'Vetements',
            'stock': 100,
            'sizes': ['S', 'M', 'L', 'XL']
        },
        {
            'name': 'Echarpe Fan Club',
            'price': 15.00,
            'image': 'https://images.unsplash.com/photo-1520903932296-5ed91222440e?w=800',
            'description': 'Restez au chaud lors des matchs d hiver.',
            'category': 'Accessoires',
            'stock': 50,
            'sizes': ['One Size']
        },
        {
            'name': 'Ballon Officiel Match',
            'price': 120.00,
            'image': 'https://images.unsplash.com/photo-1614632537423-1e6c2e7a0aab?w=800',
            'description': 'Ballon certifie FIFA Pro.',
            'category': 'Equipement',
            'stock': 20,
            'sizes': ['5']
        }
    ]
    mongo.db.products.insert_many(products)
    print(f"[Seed] Created {len(products)} products")

    # ========================================
    # 8. CREATE GALLERY ITEMS
    # ========================================
    gallery = [
        {
            'club_id': club1_id,
            'url': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
            'caption': 'Victoire en Coupe',
            'type': 'photo',
            'created_at': now - timedelta(days=2)
        },
        {
            'club_id': club1_id,
            'url': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
            'caption': 'Entrainement matinal',
            'type': 'photo',
            'created_at': now - timedelta(days=5)
        },
        {
            'club_id': club1_id,
            'url': 'https://images.unsplash.com/photo-1517466787929-bc90951d64b8?w=800',
            'caption': 'Photo d equipe',
            'type': 'photo',
            'created_at': now - timedelta(days=10)
        }
    ]
    mongo.db.gallery.insert_many(gallery)
    print(f"[Seed] Created {len(gallery)} gallery items")

    # ========================================
    # 9. CREATE TACTICS
    # ========================================
    # Get player IDs for lineup
    players_cursor = mongo.db.players.find({'club_id': club1_id, 'team_id': team1_id})
    player_list = list(players_cursor)
    player_ids = [str(p['_id']) for p in player_list]

    tactics = [
        {
            'club_id': club1_id,
            'team_id': team1_id,
            'name': '4-3-3 Offensif',
            'formation': '4-3-3',
            'description': 'Formation offensive avec ailiers rapides',
            'positions': {
                'GK': {'x': 50, 'y': 90},
                'LB': {'x': 15, 'y': 70},
                'CB1': {'x': 35, 'y': 75},
                'CB2': {'x': 65, 'y': 75},
                'RB': {'x': 85, 'y': 70},
                'CM1': {'x': 30, 'y': 50},
                'CM2': {'x': 50, 'y': 55},
                'CM3': {'x': 70, 'y': 50},
                'LW': {'x': 15, 'y': 25},
                'ST': {'x': 50, 'y': 15},
                'RW': {'x': 85, 'y': 25}
            },
            'is_default': True,
            'created_at': now - timedelta(days=30)
        },
        {
            'club_id': club1_id,
            'team_id': team1_id,
            'name': '4-4-2 Classique',
            'formation': '4-4-2',
            'description': 'Formation équilibrée classique',
            'positions': {
                'GK': {'x': 50, 'y': 90},
                'LB': {'x': 15, 'y': 70},
                'CB1': {'x': 35, 'y': 75},
                'CB2': {'x': 65, 'y': 75},
                'RB': {'x': 85, 'y': 70},
                'LM': {'x': 15, 'y': 45},
                'CM1': {'x': 35, 'y': 50},
                'CM2': {'x': 65, 'y': 50},
                'RM': {'x': 85, 'y': 45},
                'ST1': {'x': 35, 'y': 20},
                'ST2': {'x': 65, 'y': 20}
            },
            'is_default': False,
            'created_at': now - timedelta(days=20)
        },
        {
            'club_id': club1_id,
            'team_id': team1_id,
            'name': '3-5-2 Pressing',
            'formation': '3-5-2',
            'description': 'Formation haute pression avec pistons',
            'positions': {
                'GK': {'x': 50, 'y': 90},
                'CB1': {'x': 25, 'y': 75},
                'CB2': {'x': 50, 'y': 78},
                'CB3': {'x': 75, 'y': 75},
                'LWB': {'x': 10, 'y': 50},
                'CM1': {'x': 35, 'y': 55},
                'CM2': {'x': 50, 'y': 45},
                'CM3': {'x': 65, 'y': 55},
                'RWB': {'x': 90, 'y': 50},
                'ST1': {'x': 35, 'y': 18},
                'ST2': {'x': 65, 'y': 18}
            },
            'is_default': False,
            'created_at': now - timedelta(days=10)
        }
    ]

    tactic_ids = []
    for tactic in tactics:
        result = mongo.db.saved_tactics.insert_one(tactic)
        tactic_ids.append(result.inserted_id)
    print(f"[Seed] Created {len(tactics)} tactics")

    # ========================================
    # 10. CREATE LINEUPS (Compositions)
    # ========================================
    # Create starters mapping using actual player IDs
    starters_433 = {}
    if len(player_ids) >= 11:
        slots = ['GK', 'LB', 'CB1', 'CB2', 'RB', 'CM1', 'CM2', 'CM3', 'LW', 'ST', 'RW']
        for i, slot in enumerate(slots):
            starters_433[slot] = player_ids[i]

    starters_442 = {}
    if len(player_ids) >= 11:
        slots = ['GK', 'LB', 'CB1', 'CB2', 'RB', 'LM', 'CM1', 'CM2', 'RM', 'ST1', 'ST2']
        for i, slot in enumerate(slots):
            starters_442[slot] = player_ids[i]

    lineups = [
        {
            'club_id': club1_id,
            'team_id': team1_id,
            'name': 'Compo vs Racing FC',
            'formation': '4-3-3',
            'tactic_id': tactic_ids[0],
            'starters': starters_433,
            'substitutes': player_ids[11:14] if len(player_ids) > 11 else [],
            'captains': {
                'captain': player_ids[8] if len(player_ids) > 8 else None,
                'vice_captain': player_ids[5] if len(player_ids) > 5 else None
            },
            'set_pieces': {
                'corners_left': player_ids[6] if len(player_ids) > 6 else None,
                'corners_right': player_ids[7] if len(player_ids) > 7 else None,
                'free_kicks': player_ids[8] if len(player_ids) > 8 else None,
                'penalties': player_ids[9] if len(player_ids) > 9 else None
            },
            'player_instructions': {},
            'is_template': False,
            'created_at': now - timedelta(days=3),
            'updated_at': now - timedelta(days=3)
        },
        {
            'club_id': club1_id,
            'team_id': team1_id,
            'name': 'Template 4-4-2',
            'formation': '4-4-2',
            'tactic_id': tactic_ids[1],
            'starters': starters_442,
            'substitutes': player_ids[11:14] if len(player_ids) > 11 else [],
            'captains': {
                'captain': player_ids[8] if len(player_ids) > 8 else None,
                'vice_captain': player_ids[5] if len(player_ids) > 5 else None
            },
            'set_pieces': {},
            'player_instructions': {},
            'is_template': True,
            'created_at': now - timedelta(days=15),
            'updated_at': now - timedelta(days=15)
        }
    ]

    for lineup in lineups:
        mongo.db.lineups.insert_one(lineup)
    print(f"[Seed] Created {len(lineups)} lineups")

    # ========================================
    # 11. CREATE TRAINING PLANS & DRILLS
    # ========================================
    drills = [
        {
            'club_id': club1_id,
            'name': 'Rondo 4v2',
            'description': 'Conservation de balle en petit espace',
            'category': 'Technique',
            'sub_category': 'Passes',
            'duration': 15,
            'players_needed': 6,
            'equipment': ['Coupelles', 'Ballons'],
            'difficulty': 'intermediate',
            'coaching_points': ['Garder la tête haute', 'Passes à une touche', 'Mouvement constant'],
            'is_public': True,
            'created_at': now - timedelta(days=60)
        },
        {
            'club_id': club1_id,
            'name': 'Jeu de position 6v6',
            'description': 'Travail de la possession orientée',
            'category': 'Tactique',
            'sub_category': 'Possession',
            'duration': 20,
            'players_needed': 12,
            'equipment': ['Coupelles', 'Chasubles', 'Ballons'],
            'difficulty': 'advanced',
            'coaching_points': ['Triangulations', 'Appels en profondeur', 'Changements de jeu'],
            'is_public': True,
            'created_at': now - timedelta(days=45)
        },
        {
            'club_id': club1_id,
            'name': 'Finitions en 1v1',
            'description': 'Situations de duel face au gardien',
            'category': 'Technique',
            'sub_category': 'Tir',
            'duration': 15,
            'players_needed': 8,
            'equipment': ['Buts', 'Ballons', 'Coupelles'],
            'difficulty': 'intermediate',
            'coaching_points': ['Garder son calme', 'Observer le gardien', 'Frapper tôt'],
            'is_public': True,
            'created_at': now - timedelta(days=30)
        }
    ]
    drill_ids = []
    for drill in drills:
        result = mongo.db.drills.insert_one(drill)
        drill_ids.append(result.inserted_id)
    print(f"[Seed] Created {len(drills)} drills")

    training_plans = [
        {
            'club_id': club1_id,
            'team_id': team1_id,
            'name': 'Préparation Match Coupe',
            'type': 'weekly',
            'start_date': now,
            'end_date': now + timedelta(days=7),
            'focus_area': 'Tactique offensive',
            'description': 'Semaine axée sur le jeu offensif avant la coupe',
            'status': 'active',
            'created_at': now - timedelta(days=2)
        },
        {
            'club_id': club1_id,
            'team_id': team1_id,
            'name': 'Programme Janvier',
            'type': 'monthly',
            'start_date': now - timedelta(days=15),
            'end_date': now + timedelta(days=15),
            'focus_area': 'Condition physique',
            'description': 'Reprise après trêve - remise en forme',
            'status': 'active',
            'created_at': now - timedelta(days=20)
        }
    ]
    for plan in training_plans:
        mongo.db.training_plans.insert_one(plan)
    print(f"[Seed] Created {len(training_plans)} training plans")

    # ========================================
    # SUMMARY
    # ========================================
    print("\n" + "="*50)
    print("[Seed] DATABASE SEEDED SUCCESSFULLY!")
    print("="*50)
    print(f"  Clubs:    2")
    print(f"  Teams:    1")
    print(f"  Users:    {len(users)}")
    print(f"  Players:  {len(player_data)}")
    print(f"  Events:   {len(events)}")
    print(f"  Matches:  {len(matches)}")
    print(f"  Posts:    {len(posts)}")
    print(f"  Shop:     {len(products)}")
    print(f"  Gallery:  {len(gallery)}")
    print(f"  Tactics:  {len(tactics)}")
    print(f"  Lineups:  {len(lineups)}")
    print(f"  Drills:   {len(drills)}")
    print(f"  Plans:    {len(training_plans)}")
    print("="*50)
    print("\nDemo credentials:")
    print("  Admin:  admin@footlogic.fr / admin123")
    print("  Coach:  coach@fcelite.fr / coach123")
    print("  Player: player1@fcelite.fr / player123")
    print("="*50 + "\n")

    return True


FRENCH_FIRST_NAMES = [
    'Lucas', 'Thomas', 'Antoine', 'Hugo', 'Julien', 'Maxime',
    'Alexandre', 'Romain', 'Pierre', 'Paul', 'Louis', 'Gabriel',
    'Raphael', 'Arthur', 'Nathan', 'Theo', 'Clement', 'Baptiste'
]

FRENCH_LAST_NAMES = [
    'Martin', 'Bernard', 'Dubois', 'Robert', 'Richard', 'Petit',
    'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre',
    'Michel', 'Garcia', 'Bertrand', 'Roux', 'Vincent', 'Fournier'
]


def seed_18_players(club_id, team_id=None, delete_existing=True):
    """Seed 18 players with French names for a club"""
    import random
    from bson import ObjectId
    from app.services.db import mongo
    from app.models import create_player

    # Convert to ObjectId if string
    if isinstance(club_id, str):
        club_id = ObjectId(club_id)
    if team_id and isinstance(team_id, str):
        team_id = ObjectId(team_id)

    # Delete existing players if requested
    if delete_existing:
        query = {'club_id': club_id}
        if team_id:
            query['team_id'] = team_id
        mongo.db.players.delete_many(query)

    # Position distribution: 2 GK, 6 DEF, 6 MID, 4 ATT
    positions = (
        ['GK', 'GK'] +
        ['CB', 'CB', 'LB', 'RB', 'CB', 'RB'] +
        ['CDM', 'CM', 'CM', 'CAM', 'LM', 'RM'] +
        ['ST', 'ST', 'LW', 'RW']
    )

    created = []
    for i, pos in enumerate(positions):
        first = random.choice(FRENCH_FIRST_NAMES)
        last = random.choice(FRENCH_LAST_NAMES)
        photo = f'https://randomuser.me/api/portraits/men/{random.randint(1, 99)}.jpg'

        player = create_player(
            user_id=None,
            club_id=club_id,
            team_id=team_id,
            jersey_number=i + 1,
            position=pos,
            name=f"{first} {last}",
            photo=photo,
            status='active'
        )
        result = mongo.db.players.insert_one(player)
        player['_id'] = result.inserted_id
        created.append(player)

    return created


def seed_coach_data(club_id=None, team_id=None):
    """
    Seed coach data (tactics, lineups, drills, training plans) for existing clubs.
    DOES NOT delete any existing data - only adds new items.

    If club_id is None, seed for all clubs.
    """
    from bson import ObjectId
    from app.services.db import mongo
    from datetime import datetime, timedelta

    now = datetime.utcnow()

    # Get clubs to seed
    if club_id:
        if isinstance(club_id, str):
            club_id = ObjectId(club_id)
        clubs = [mongo.db.clubs.find_one({'_id': club_id})]
    else:
        clubs = list(mongo.db.clubs.find({}))

    if not clubs or clubs[0] is None:
        print("[Seed] No clubs found")
        return False

    total_tactics = 0
    total_lineups = 0
    total_drills = 0
    total_plans = 0

    for club in clubs:
        club_id = club['_id']
        club_name = club.get('name', 'Unknown')
        print(f"\n[Seed] Processing club: {club_name}")

        # Get teams for this club
        if team_id:
            if isinstance(team_id, str):
                team_id = ObjectId(team_id)
            teams = [mongo.db.teams.find_one({'_id': team_id, 'club_id': club_id})]
        else:
            teams = list(mongo.db.teams.find({'club_id': club_id}))

        if not teams or teams[0] is None:
            print(f"  [!] No teams found for {club_name}, skipping...")
            continue

        for team in teams:
            team_id_obj = team['_id']
            team_name = team.get('name', 'Unknown')
            print(f"  [Team] {team_name}")

            # Get players for lineup
            players = list(mongo.db.players.find({'club_id': club_id, 'team_id': team_id_obj}))
            player_ids = [str(p['_id']) for p in players]

            if len(player_ids) < 11:
                print(f"    [!] Only {len(player_ids)} players, need 11 for lineups")

            # Check if tactics already exist
            existing_tactics = mongo.db.saved_tactics.count_documents({'club_id': club_id, 'team_id': team_id_obj})
            if existing_tactics == 0:
                # Create tactics
                tactics = [
                    {
                        'club_id': club_id,
                        'team_id': team_id_obj,
                        'name': '4-3-3 Offensif',
                        'formation': '4-3-3',
                        'description': 'Formation offensive avec ailiers rapides',
                        'positions': {
                            'GK': {'x': 50, 'y': 90}, 'LB': {'x': 15, 'y': 70},
                            'CB1': {'x': 35, 'y': 75}, 'CB2': {'x': 65, 'y': 75},
                            'RB': {'x': 85, 'y': 70}, 'CM1': {'x': 30, 'y': 50},
                            'CM2': {'x': 50, 'y': 55}, 'CM3': {'x': 70, 'y': 50},
                            'LW': {'x': 15, 'y': 25}, 'ST': {'x': 50, 'y': 15},
                            'RW': {'x': 85, 'y': 25}
                        },
                        'is_default': True,
                        'created_at': now
                    },
                    {
                        'club_id': club_id,
                        'team_id': team_id_obj,
                        'name': '4-4-2 Classique',
                        'formation': '4-4-2',
                        'description': 'Formation équilibrée classique',
                        'positions': {
                            'GK': {'x': 50, 'y': 90}, 'LB': {'x': 15, 'y': 70},
                            'CB1': {'x': 35, 'y': 75}, 'CB2': {'x': 65, 'y': 75},
                            'RB': {'x': 85, 'y': 70}, 'LM': {'x': 15, 'y': 45},
                            'CM1': {'x': 35, 'y': 50}, 'CM2': {'x': 65, 'y': 50},
                            'RM': {'x': 85, 'y': 45}, 'ST1': {'x': 35, 'y': 20},
                            'ST2': {'x': 65, 'y': 20}
                        },
                        'is_default': False,
                        'created_at': now
                    },
                    {
                        'club_id': club_id,
                        'team_id': team_id_obj,
                        'name': '3-5-2 Pressing',
                        'formation': '3-5-2',
                        'description': 'Formation haute pression avec pistons',
                        'positions': {
                            'GK': {'x': 50, 'y': 90}, 'CB1': {'x': 25, 'y': 75},
                            'CB2': {'x': 50, 'y': 78}, 'CB3': {'x': 75, 'y': 75},
                            'LWB': {'x': 10, 'y': 50}, 'CM1': {'x': 35, 'y': 55},
                            'CM2': {'x': 50, 'y': 45}, 'CM3': {'x': 65, 'y': 55},
                            'RWB': {'x': 90, 'y': 50}, 'ST1': {'x': 35, 'y': 18},
                            'ST2': {'x': 65, 'y': 18}
                        },
                        'is_default': False,
                        'created_at': now
                    }
                ]
                tactic_ids = []
                for t in tactics:
                    result = mongo.db.saved_tactics.insert_one(t)
                    tactic_ids.append(result.inserted_id)
                total_tactics += len(tactics)
                print(f"    [+] Created {len(tactics)} tactics")
            else:
                print(f"    [=] {existing_tactics} tactics already exist")
                tactic_ids = [t['_id'] for t in mongo.db.saved_tactics.find({'club_id': club_id, 'team_id': team_id_obj})]

            # Check if lineups already exist
            existing_lineups = mongo.db.lineups.count_documents({'club_id': club_id, 'team_id': team_id_obj})
            if existing_lineups == 0 and len(player_ids) >= 11:
                # Create lineups
                slots_433 = ['GK', 'LB', 'CB1', 'CB2', 'RB', 'CM1', 'CM2', 'CM3', 'LW', 'ST', 'RW']
                starters = {slot: player_ids[i] for i, slot in enumerate(slots_433)}

                lineups = [
                    {
                        'club_id': club_id,
                        'team_id': team_id_obj,
                        'name': 'Composition par défaut',
                        'formation': '4-3-3',
                        'tactic_id': tactic_ids[0] if tactic_ids else None,
                        'starters': starters,
                        'substitutes': player_ids[11:14] if len(player_ids) > 11 else [],
                        'captains': {
                            'captain': player_ids[8] if len(player_ids) > 8 else None,
                            'vice_captain': player_ids[5] if len(player_ids) > 5 else None
                        },
                        'set_pieces': {
                            'corners_left': player_ids[6] if len(player_ids) > 6 else None,
                            'corners_right': player_ids[7] if len(player_ids) > 7 else None,
                            'free_kicks': player_ids[8] if len(player_ids) > 8 else None,
                            'penalties': player_ids[9] if len(player_ids) > 9 else None
                        },
                        'player_instructions': {},
                        'is_template': True,
                        'created_at': now,
                        'updated_at': now
                    }
                ]
                for lineup in lineups:
                    mongo.db.lineups.insert_one(lineup)
                total_lineups += len(lineups)
                print(f"    [+] Created {len(lineups)} lineups")
            elif existing_lineups > 0:
                print(f"    [=] {existing_lineups} lineups already exist")

        # Check if drills already exist for this club
        existing_drills = mongo.db.drills.count_documents({'club_id': club_id})
        if existing_drills == 0:
            drills = [
                {
                    'club_id': club_id,
                    'name': 'Rondo 4v2',
                    'description': 'Conservation de balle en petit espace',
                    'category': 'Technique',
                    'sub_category': 'Passes',
                    'duration': 15,
                    'players_needed': 6,
                    'equipment': ['Coupelles', 'Ballons'],
                    'difficulty': 'intermediate',
                    'coaching_points': ['Garder la tête haute', 'Passes à une touche', 'Mouvement constant'],
                    'is_public': True,
                    'created_at': now
                },
                {
                    'club_id': club_id,
                    'name': 'Jeu de position 6v6',
                    'description': 'Travail de la possession orientée',
                    'category': 'Tactique',
                    'sub_category': 'Possession',
                    'duration': 20,
                    'players_needed': 12,
                    'equipment': ['Coupelles', 'Chasubles', 'Ballons'],
                    'difficulty': 'advanced',
                    'coaching_points': ['Triangulations', 'Appels en profondeur', 'Changements de jeu'],
                    'is_public': True,
                    'created_at': now
                },
                {
                    'club_id': club_id,
                    'name': 'Finitions en 1v1',
                    'description': 'Situations de duel face au gardien',
                    'category': 'Technique',
                    'sub_category': 'Tir',
                    'duration': 15,
                    'players_needed': 8,
                    'equipment': ['Buts', 'Ballons', 'Coupelles'],
                    'difficulty': 'intermediate',
                    'coaching_points': ['Garder son calme', 'Observer le gardien', 'Frapper tôt'],
                    'is_public': True,
                    'created_at': now
                }
            ]
            mongo.db.drills.insert_many(drills)
            total_drills += len(drills)
            print(f"  [+] Created {len(drills)} drills")
        else:
            print(f"  [=] {existing_drills} drills already exist")

    print("\n" + "="*50)
    print("[Seed] COACH DATA SEEDED (existing data preserved)")
    print("="*50)
    print(f"  Tactics added:  {total_tactics}")
    print(f"  Lineups added:  {total_lineups}")
    print(f"  Drills added:   {total_drills}")
    print("="*50 + "\n")

    return True


if __name__ == '__main__':
    # Standalone execution
    import sys
    import os

    # Add current directory to path if needed (when running from root)
    sys.path.append(os.getcwd())

    from app import create_app
    app = create_app()

    with app.app_context():
        seed_all()
