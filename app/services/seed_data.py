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
    print(f"[Seed] Created {len(users)} users")
    
    # Link coach to team
    mongo.db.teams.update_one({'_id': team1_id}, {'$set': {'coach_ids': [user_ids[1]]}})
    
    # ========================================
    # 3. CREATE PLAYERS (FC Elite)
    # ========================================
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
            user_id=user_ids[2] if i == 0 else None,  # Link first player to user
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
    # SUMMARY
    # ========================================
    print("\n" + "="*50)
    print("[Seed] DATABASE SEEDED SUCCESSFULLY!")
    print("="*50)
    print(f"  Clubs:   2")
    print(f"  Users:   {len(users)}")
    print(f"  Players: {len(player_data)}")
    print(f"  Events:  {len(events)}")
    print(f"  Matches: {len(matches)}")
    print(f"  Posts:   {len(posts)}")
    print(f"  Shop:    {len(products)}")
    print(f"  Gallery: {len(gallery)}")
    print("="*50)
    print("\nDemo credentials:")
    print("  Admin:  admin@FootLogic.fr / admin123")
    print("  Coach:  coach@fcelite.fr / coach123")
    print("  Player: player1@fcelite.fr / player123")
    print("="*50 + "\n")
    
    return True


if __name__ == '__main__':
    # Standalone execution
    import sys
    sys.path.insert(0, 'c:/Users/Soufiane/repos/FootLogic/FootLogic_project/FootLogic_v2')
    
    from app import create_app
    app = create_app()
    
    with app.app_context():
        seed_all()

