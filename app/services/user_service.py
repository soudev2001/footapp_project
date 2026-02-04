# FootLogic V2 - User Service (Authentication & Users)

from werkzeug.security import check_password_hash, generate_password_hash
from bson import ObjectId

class UserService:
    """Service for user-related operations"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.users
    
    def get_all(self):
        """Get all users"""
        return list(self.collection.find())

    def get_members_by_club(self, club_id):
        """Get all users linked to a specific club"""
        from bson import ObjectId
        if isinstance(club_id, str):
            club_id = ObjectId(club_id)
        return list(self.collection.find({'club_id': club_id}))

    def get_by_id(self, user_id):
        """Get user by ID"""
        return self.collection.find_one({'_id': ObjectId(user_id)})
    
    def get_by_email(self, email):
        """Get user by email"""
        return self.collection.find_one({'email': email})
    
    def create(self, email, password, role='fan', roles=None, club_id=None, profile=None):
        """Create a new user"""
        from datetime import datetime
        
        # Determine primary role and roles list
        if roles is None:
            roles = [role]
        else:
            # If roles provided, primary role is the first one (or 'fan' if empty)
            role = roles[0] if roles else 'fan'
            
        user = {
            'email': email,
            'password_hash': generate_password_hash(password),
            'role': role,        # Primary role for backward compatibility
            'roles': roles,      # List of all roles
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
            {'name': 'Accueil', 'url': '/', 'icon': 'fa-house'},
            {'name': 'Isy HUB', 'url': '/isy/hub', 'icon': 'fa-rocket'},
            {'name': 'Partenaires', 'url': '/isy/partners', 'icon': 'fa-crown'},
            {'name': 'Console Gestion', 'url': '/admin/panel', 'icon': 'fa-shield-halved'},
            {'name': 'Site Public', 'url': '/public-club', 'icon': 'fa-globe'},
        ],
        'coach': [
            {'name': 'Dashboard', 'url': '/coach/dashboard', 'icon': 'fa-gauge'},
            {'name': 'Isy HUB', 'url': '/isy/hub', 'icon': 'fa-rocket'},
            {'name': 'Effectif Pro', 'url': '/isy/members', 'icon': 'fa-users-gear'},
            {'name': 'Effectif', 'url': '/coach/roster', 'icon': 'fa-users'},
            {'name': 'Tactiques', 'url': '/coach/tactics', 'icon': 'fa-chess-board'},
            {'name': 'Match Center', 'url': '/coach/match-center', 'icon': 'fa-gamepad'},
            {'name': 'Scouting', 'url': '/coach/scouting', 'icon': 'fa-binoculars'},
            {'name': 'Social', 'url': '/feed', 'icon': 'fa-rss'},
        ],
        'player': [
            {'name': 'Accueil', 'url': '/player/home', 'icon': 'fa-house'},
            {'name': 'Evo HUB', 'url': '/player/evo-hub', 'icon': 'fa-chart-radar'},
            {'name': 'Mon Équipe', 'url': '/player/team', 'icon': 'fa-people-group'},
            {'name': 'Planning', 'url': '/player/calendar', 'icon': 'fa-calendar-days'},
            {'name': 'Contrats', 'url': '/player/contracts', 'icon': 'fa-file-signature'},
            {'name': 'Documents', 'url': '/player/documents', 'icon': 'fa-file-invoice'},
            {'name': 'Offres Privées', 'url': '/isy/partners', 'icon': 'fa-crown'},
            {'name': 'Social', 'url': '/feed', 'icon': 'fa-rss'},
        ],
        'fan': [
            {'name': 'Accueil', 'url': '/', 'icon': 'fa-house'},
            {'name': 'Actualités', 'url': '/feed', 'icon': 'fa-newspaper'},
            {'name': 'Clubs', 'url': '/public-club', 'icon': 'fa-futbol'},
            {'name': 'Boutique', 'url': '/shop-product', 'icon': 'fa-bag-shopping'},
            {'name': 'Offres Privées', 'url': '/isy/partners', 'icon': 'fa-crown'},
        ]
    }
    return all_nav.get(role, all_nav['fan'])

