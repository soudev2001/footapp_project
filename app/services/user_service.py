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
            'password_hash': generate_password_hash(password) if password else None,
            'role': role,        # Primary role for backward compatibility
            'roles': roles,      # List of all roles
            'club_id': ObjectId(club_id) if club_id else None,
            'created_at': datetime.utcnow(),
            'account_status': profile.get('account_status', 'active') if profile else 'active',
            'invitation_token': None,
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

    def create_pending_user(self, email, role='player', club_id=None, profile=None):
        """Create a user in pending state (no password yet)"""
        import secrets
        from datetime import datetime

        token = secrets.token_urlsafe(32)
        if profile is None:
            profile = {}
        profile['account_status'] = 'pending'

        user = self.create(
            email=email,
            password=None, # No password yet
            role=role,
            club_id=club_id,
            profile=profile
        )

        # Add invitation details
        self.collection.update_one(
            {'_id': user['_id']},
            {'$set': {
                'account_status': 'pending',
                'invitation_token': token,
                'invite_sent_at': datetime.utcnow()
            }}
        )
        user['invitation_token'] = token
        user['account_status'] = 'pending'
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

    def search_members(self, club_id, search='', role='', team_id='', status=''):
        """Search club members with optional filters.

        Parameters
        ----------
        club_id : str or ObjectId
        search  : free-text matched against email, first_name, last_name
        role    : exact role string ('player', 'coach', …)
        team_id : ObjectId string — matches users whose player profile belongs to that team
        status  : 'pending' | 'active'
        """
        import re
        query = {'club_id': ObjectId(club_id) if isinstance(club_id, str) else club_id}

        if search:
            pattern = re.compile(re.escape(search), re.IGNORECASE)
            query['$or'] = [
                {'email': pattern},
                {'profile.first_name': pattern},
                {'profile.last_name': pattern},
            ]

        if role:
            query['role'] = role

        if status:
            query['account_status'] = status

        members = list(self.collection.find(query))

        # Filter by team via player profiles when requested
        if team_id:
            from bson import ObjectId as OID
            player_user_ids = {
                str(p['user_id'])
                for p in self.db['players'].find(
                    {'team_id': OID(team_id)}, {'user_id': 1}
                )
            }
            members = [m for m in members if str(m['_id']) in player_user_ids]

        return members


# Role-based access helpers
ROLE_PERMISSIONS = {
    'admin': ['all'],
    'coach': ['dashboard', 'roster', 'calendar', 'attendance', 'tactics', 'match_center',
              'create_event', 'create_post', 'feed', 'chat', 'profile', 'settings'],
    'player': ['calendar', 'roster', 'attendance', 'feed', 'chat', 'profile', 'settings',
               'documents', 'notifications'],
    'parent': ['parent_dashboard', 'calendar', 'roster', 'feed', 'chat', 'profile', 'settings'],
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
            {'name': 'Avancement App', 'url': '/superadmin/dashboard', 'icon': 'fa-list-check'},
            {'name': 'Site Public', 'url': '/public-club', 'icon': 'fa-globe'},
            {'name': 'Messages', 'url': '/messages', 'icon': 'fa-comments'},
        ],
        'coach': [
            {'name': 'Dashboard', 'url': '/coach/dashboard', 'icon': 'fa-gauge'},
            {'name': 'Calendrier', 'url': '/calendar', 'icon': 'fa-calendar-days'},
            {'name': 'Convocation', 'url': '/coach/convocation', 'icon': 'fa-clipboard-list'},
            {'name': 'Effectif', 'url': '/coach/roster', 'icon': 'fa-users'},
            {'name': 'Tactiques', 'url': '/coach/tactics', 'icon': 'fa-chess-board'},
            {'name': 'Match Center', 'url': '/coach/match-center', 'icon': 'fa-gamepad'},
            {'name': 'Boutique', 'url': '/shop', 'icon': 'fa-bag-shopping'},
            {'name': 'Messages', 'url': '/messages', 'icon': 'fa-comments'},
        ],
        'player': [
            {'name': 'Accueil', 'url': '/player/home', 'icon': 'fa-house'},
            {'name': 'Evo HUB', 'url': '/player/evo-hub', 'icon': 'fa-chart-radar'},
            {'name': 'Mon Équipe', 'url': '/player/team', 'icon': 'fa-people-group'},
            {'name': 'Messages', 'url': '/messages', 'icon': 'fa-comments'},
            {'name': 'Planning', 'url': '/player/calendar', 'icon': 'fa-calendar-days'},
            {'name': 'Boutique', 'url': '/shop', 'icon': 'fa-bag-shopping'},
            {'name': 'Contrats', 'url': '/player/contracts', 'icon': 'fa-file-signature'},
            {'name': 'Documents', 'url': '/player/documents', 'icon': 'fa-file-invoice'},
            {'name': 'Offres Privées', 'url': '/isy/partners', 'icon': 'fa-crown'},
            {'name': 'Social', 'url': '/feed', 'icon': 'fa-rss'},
        ],
        'parent': [
            {'name': 'Espace Parent', 'url': '/parent/dashboard', 'icon': 'fa-users'},
            {'name': 'Planning Enfant', 'url': '/parent/calendar', 'icon': 'fa-calendar-days'},
            {'name': 'Social', 'url': '/feed', 'icon': 'fa-rss'},
            {'name': 'Messages', 'url': '/messages', 'icon': 'fa-comments'},
            {'name': 'Boutique', 'url': '/shop', 'icon': 'fa-bag-shopping'},
        ],
        'fan': [
            {'name': 'Accueil', 'url': '/', 'icon': 'fa-house'},
            {'name': 'Actualités', 'url': '/feed', 'icon': 'fa-newspaper'},
            {'name': 'Clubs', 'url': '/public-club', 'icon': 'fa-futbol'},
            {'name': 'Boutique', 'url': '/shop', 'icon': 'fa-bag-shopping'},
            {'name': 'Offres Privées', 'url': '/isy/partners', 'icon': 'fa-crown'},
        ]
    }
    return all_nav.get(role, all_nav['fan'])
