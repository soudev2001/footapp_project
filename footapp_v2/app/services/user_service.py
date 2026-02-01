# FootApp V2 - User Service (Authentication & Users)

from werkzeug.security import check_password_hash, generate_password_hash
from bson import ObjectId

class UserService:
    """Service for user-related operations"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.users
    
    def get_by_id(self, user_id):
        """Get user by ID"""
        return self.collection.find_one({'_id': ObjectId(user_id)})
    
    def get_by_email(self, email):
        """Get user by email"""
        return self.collection.find_one({'email': email})
    
    def create(self, email, password, role='player', club_id=None, profile=None):
        """Create a new user"""
        from datetime import datetime
        user = {
            'email': email,
            'password_hash': generate_password_hash(password),
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
        result = self.collection.insert_one(user)
        user['_id'] = result.inserted_id
        return user
    
    def verify_password(self, email, password):
        """Verify user password, return user if valid"""
        user = self.get_by_email(email)
        if user and check_password_hash(user['password_hash'], password):
            return user
        return None
    
    def update_profile(self, user_id, profile_data):
        """Update user profile"""
        return self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'profile': profile_data}}
        )
    
    def get_users_by_club(self, club_id):
        """Get all users for a club"""
        return list(self.collection.find({'club_id': ObjectId(club_id)}))
    
    def get_users_by_role(self, role):
        """Get all users with a specific role"""
        return list(self.collection.find({'role': role}))
    
    def delete(self, user_id):
        """Delete a user"""
        return self.collection.delete_one({'_id': ObjectId(user_id)})


# Role-based access helpers
ROLE_PERMISSIONS = {
    'admin': ['all'],
    'coach': ['dashboard', 'roster', 'calendar', 'attendance', 'tactics', 'match_center', 
              'create_event', 'create_post', 'feed', 'chat', 'profile', 'settings'],
    'player': ['calendar', 'roster', 'attendance', 'feed', 'chat', 'profile', 'settings', 
               'documents', 'notifications'],
    'fan': ['public_club', 'ranking', 'feed', 'profile', 'settings']
}

def has_permission(user_role, page):
    """Check if a role has permission to access a page"""
    if user_role == 'admin':
        return True
    permissions = ROLE_PERMISSIONS.get(user_role, [])
    return page in permissions or 'all' in permissions

def get_nav_for_role(role):
    """Get navigation items based on user role"""
    all_nav = {
        'admin': [
            {'name': 'Dashboard', 'url': '/dashboard', 'icon': 'fa-gauge'},
            {'name': 'Admin', 'url': '/admin-panel', 'icon': 'fa-shield'},
            {'name': 'Effectif', 'url': '/roster', 'icon': 'fa-users'},
            {'name': 'Calendrier', 'url': '/calendar', 'icon': 'fa-calendar'},
            {'name': 'Tactiques', 'url': '/tactics', 'icon': 'fa-chess-board'},
        ],
        'coach': [
            {'name': 'Dashboard', 'url': '/dashboard', 'icon': 'fa-gauge'},
            {'name': 'Effectif', 'url': '/roster', 'icon': 'fa-users'},
            {'name': 'Calendrier', 'url': '/calendar', 'icon': 'fa-calendar'},
            {'name': 'Presences', 'url': '/attendance', 'icon': 'fa-clipboard-check'},
            {'name': 'Tactiques', 'url': '/tactics', 'icon': 'fa-chess-board'},
        ],
        'player': [
            {'name': 'Accueil', 'url': '/app-home', 'icon': 'fa-house'},
            {'name': 'Calendrier', 'url': '/calendar', 'icon': 'fa-calendar'},
            {'name': 'Equipe', 'url': '/roster', 'icon': 'fa-users'},
            {'name': 'Messages', 'url': '/chat-inbox', 'icon': 'fa-comments'},
            {'name': 'Profil', 'url': '/profile', 'icon': 'fa-user'},
        ],
        'fan': [
            {'name': 'Accueil', 'url': '/', 'icon': 'fa-house'},
            {'name': 'Actualites', 'url': '/feed', 'icon': 'fa-newspaper'},
            {'name': 'Club', 'url': '/public-club', 'icon': 'fa-futbol'},
            {'name': 'Classement', 'url': '/ranking', 'icon': 'fa-ranking-star'},
        ]
    }
    return all_nav.get(role, all_nav['fan'])
