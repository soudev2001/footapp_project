# FootLogic V2 - Data Models (MongoDB Document Schemas)

from datetime import datetime
from bson import ObjectId

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc['_id'] = str(doc['_id'])
    return doc

def serialize_docs(docs):
    """Convert list of MongoDB documents"""
    return [serialize_doc(doc) for doc in docs]


# ============================================================
# SCHEMA DEFINITIONS (for reference and validation)
# ============================================================

USER_SCHEMA = {
    '_id': ObjectId,
    'email': str,
    'password_hash': str,
    'role': str,  # 'admin', 'coach', 'player', 'fan'
    'club_id': ObjectId,
    'created_at': datetime,
    'profile': {
        'first_name': str,
        'last_name': str,
        'avatar': str,
        'phone': str
    }
}

CLUB_SCHEMA = {
    '_id': ObjectId,
    'name': str,
    'logo': str,
    'city': str,
    'founded_year': int,
    'colors': {
        'primary': str,
        'secondary': str
    },
    'stadium': str,
    'description': str,
    'created_at': datetime
}

PLAYER_SCHEMA = {
    '_id': ObjectId,
    'user_id': ObjectId,
    'club_id': ObjectId,
    'jersey_number': int,
    'position': str,  # 'GK', 'DEF', 'MID', 'ATT'
    'stats': {
        'goals': int,
        'assists': int,
        'matches_played': int,
        'yellow_cards': int,
        'red_cards': int
    },
    'photo': str,
    'birth_date': datetime,
    'height': int,  # cm
    'weight': int,  # kg
    'status': str  # 'active', 'injured', 'suspended'
}

EVENT_SCHEMA = {
    '_id': ObjectId,
    'club_id': ObjectId,
    'title': str,
    'type': str,  # 'training', 'match', 'meeting', 'other'
    'date': datetime,
    'location': str,
    'description': str,
    'attendees': [ObjectId],  # list of player_ids
    'created_by': ObjectId
}

MATCH_SCHEMA = {
    '_id': ObjectId,
    'club_id': ObjectId,
    'opponent': str,
    'date': datetime,
    'location': str,
    'is_home': bool,
    'score': {
        'home': int,
        'away': int
    },
    'status': str,  # 'scheduled', 'live', 'completed', 'cancelled'
    'lineup': [ObjectId],
    'events': [{
        'type': str,  # 'goal', 'assist', 'yellow', 'red', 'sub'
        'player_id': ObjectId,
        'minute': int
    }]
}

POST_SCHEMA = {
    '_id': ObjectId,
    'club_id': ObjectId,
    'author_id': ObjectId,
    'title': str,
    'content': str,
    'image': str,
    'likes': int,
    'comments': [{
        'user_id': ObjectId,
        'text': str,
        'created_at': datetime
    }],
    'created_at': datetime,
    'category': str  # 'news', 'announcement', 'match_report'
}

CONTRACT_SCHEMA = {
    '_id': ObjectId,
    'club_id': ObjectId,
    'user_id': ObjectId,
    'role': str,        # 'player', 'coach'
    'status': str,      # 'pending', 'active', 'rejected', 'expired'
    'start_date': datetime,
    'end_date': datetime,
    'salary': int,      # Optional
    'conditions': str,  # Text description
    'created_at': datetime,
    'updated_at': datetime
}

# ============================================================
# MODEL HELPER FUNCTIONS
# ============================================================

def create_user(email, password_hash, role='player', club_id=None, profile=None):
    """Create a new user document"""
    return {
        'email': email,
        'password_hash': password_hash,
        'role': role,
        'club_id': ObjectId(club_id) if club_id else None,
        'created_at': datetime.utcnow(),
        'profile': profile or {
            'first_name': '',
            'last_name': '',
            'avatar': '',
            'phone': ''
        }
    }

def create_club(name, city, colors, logo='', stadium='', founded_year=2000, description=''):
    """Create a new club document"""
    return {
        'name': name,
        'logo': logo,
        'city': city,
        'founded_year': founded_year,
        'colors': colors,
        'stadium': stadium,
        'description': description,
        'created_at': datetime.utcnow()
    }

def create_player(user_id, club_id, jersey_number, position, stats=None, **kwargs):
    """Create a new player document"""
    return {
        'user_id': ObjectId(user_id) if user_id else None,
        'club_id': ObjectId(club_id),
        'jersey_number': jersey_number,
        'position': position,
        'stats': stats or {
            'goals': 0,
            'assists': 0,
            'matches_played': 0,
            'yellow_cards': 0,
            'red_cards': 0
        },
        'photo': kwargs.get('photo', ''),
        'birth_date': kwargs.get('birth_date'),
        'height': kwargs.get('height', 175),
        'weight': kwargs.get('weight', 70),
        'status': kwargs.get('status', 'active'),
        'name': kwargs.get('name', '')  # Helper field for display
    }

def create_event(club_id, title, event_type, date, location='', description='', created_by=None):
    """Create a new event document"""
    return {
        'club_id': ObjectId(club_id),
        'title': title,
        'type': event_type,
        'date': date,
        'location': location,
        'description': description,
        'attendees': [],
        'created_by': ObjectId(created_by) if created_by else None
    }

def create_match(club_id, opponent, date, is_home=True, location='', status='scheduled'):
    """Create a new match document"""
    return {
        'club_id': ObjectId(club_id),
        'opponent': opponent,
        'date': date,
        'location': location,
        'is_home': is_home,
        'score': {'home': 0, 'away': 0},
        'status': status,
        'lineup': [],
        'events': []
    }

def create_post(club_id, author_id, title, content, category='news', image=''):
    """Create a new post document"""
    return {
        'club_id': ObjectId(club_id),
        'author_id': ObjectId(author_id) if author_id else None,
        'title': title,
        'content': content,
        'image': image,
        'likes': 0,
        'comments': [],
        'created_at': datetime.utcnow(),
        'category': category
    }

