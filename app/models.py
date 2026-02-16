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
    'account_status': str,    # 'pending', 'active'
    'invitation_token': str,  # For joining/confirming account
    'invite_sent_at': datetime,
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

TEAM_SCHEMA = {
    '_id': ObjectId,
    'club_id': ObjectId,
    'name': str,              # e.g., 'Senior A', 'U15', 'Reserve'
    'category': str,          # e.g., 'Senior', 'Youth', 'Academy'
    'coach_ids': [ObjectId],  # List of coach user_ids
    'colors': {
        'primary': str,
        'secondary': str
    },
    'logo': str,
    'created_at': datetime,
    'description': str
}

MESSAGE_SCHEMA = {
    '_id': ObjectId,
    'sender_id': ObjectId,
    'receiver_id': ObjectId, # Optional for DM
    'team_id': ObjectId,     # Optional for group chat
    'content': str,
    'type': str,             # 'direct', 'team'
    'read_by': [ObjectId],   # List of users who read the message
    'created_at': datetime
}

PLAYER_SCHEMA = {
    '_id': ObjectId,
    'user_id': ObjectId,
    'club_id': ObjectId,
    'team_id': ObjectId,      # Linked to Team
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
    'team_id': ObjectId,      # Optional: filter by team
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

PROJECT_SCHEMA = {
    '_id': ObjectId,
    'name': str,
    'description': str,
    'status': str,  # 'planning', 'in_progress', 'completed', 'on_hold'
    'created_at': datetime,
    'updated_at': datetime,
    'owner_id': ObjectId
}

TICKET_SCHEMA = {
    '_id': ObjectId,
    'project_id': ObjectId,
    'title': str,
    'description': str,
    'type': str,  # 'bug', 'feature', 'task', 'improvement'
    'status': str,  # 'todo', 'in_progress', 'review', 'done'
    'priority': str,  # 'low', 'medium', 'high', 'critical'
    'reporter_id': ObjectId,
    'assignee_id': ObjectId,
    'created_at': datetime,
    'updated_at': datetime
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

def create_user(email, password_hash, role='player', club_id=None, profile=None, roles=None):
    """Create a new user document"""
    if roles is None:
        roles = [role]
    return {
        'email': email,
        'password_hash': password_hash,
        'role': role,
        'roles': roles,
        'club_id': ObjectId(club_id) if club_id else None,
        'created_at': datetime.utcnow(),
        'account_status': kwargs.get('account_status', 'active'),
        'invitation_token': kwargs.get('invitation_token'),
        'invite_sent_at': kwargs.get('invite_sent_at'),
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

def create_team(club_id, name, category, coach_ids=None, description='', colors=None, logo=''):
    """Create a new team document"""
    return {
        'club_id': ObjectId(club_id),
        'name': name,
        'category': category,
        'coach_ids': [ObjectId(cid) for cid in coach_ids] if coach_ids else [],
        'colors': colors or {
            'primary': '#10b981',
            'secondary': '#0f172a'
        },
        'logo': logo,
        'description': description,
        'created_at': datetime.utcnow()
    }

def create_player(user_id, club_id, jersey_number, position, team_id=None, stats=None, **kwargs):
    """Create a new player document"""
    return {
        'user_id': ObjectId(user_id) if user_id else None,
        'club_id': ObjectId(club_id),
        'team_id': ObjectId(team_id) if team_id else None,
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

def create_event(club_id, title, event_type, date, team_id=None, location='', description='', created_by=None):
    """Create a new event document"""
    return {
        'club_id': ObjectId(club_id),
        'team_id': ObjectId(team_id) if team_id else None,
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

def create_project(name, description, owner_id, status='planning'):
    """Create a new project document"""
    now = datetime.utcnow()
    return {
        'name': name,
        'description': description,
        'status': status,
        'owner_id': ObjectId(owner_id) if owner_id else None,
        'created_at': now,
        'updated_at': now
    }

def create_ticket(project_id, title, description, reporter_id, ticket_type='task', priority='medium', status='todo', assignee_id=None):
    """Create a new ticket document"""
    now = datetime.utcnow()
    return {
        'project_id': ObjectId(project_id),
        'title': title,
        'description': description,
        'type': ticket_type,
        'status': status,
        'priority': priority,
        'reporter_id': ObjectId(reporter_id) if reporter_id else None,
        'assignee_id': ObjectId(assignee_id) if assignee_id else None,
        'created_at': now,
        'updated_at': now
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

def create_message(sender_id, content, receiver_id=None, team_id=None, msg_type='direct'):
    """Create a new message document"""
    return {
        'sender_id': ObjectId(sender_id),
        'receiver_id': ObjectId(receiver_id) if receiver_id else None,
        'team_id': ObjectId(team_id) if team_id else None,
        'content': content,
        'type': msg_type,
        'read_by': [ObjectId(sender_id)],
        'created_at': datetime.utcnow()
    }
