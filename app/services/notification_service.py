# FootLogic V2 - Notification Service

from datetime import datetime

class NotificationService:
    def __init__(self, db):
        self.db = db
        self.collection = db.notifications

    def send_invitation(self, user):
        """
        Envoie un email d'invitation avec un Token pour créer le profil de l'utilisateur.
        """
        email = user.get('email')
        token = user.get('invitation_token')
        role = user.get('role')
        club_id = user.get('club_id')
        
        # Récupération du club pour l'affichage du nom
        club_name = "votre club"
        if club_id:
            from bson import ObjectId
            club = self.db.clubs.find_one({'_id': ObjectId(club_id)})
            if club and 'name' in club:
                club_name = club['name']
        
        # Envoi de l'email réel
        from app.services.email_service import send_invitation_email
        success = send_invitation_email(email, token, role, club_name)
        
        # Create a notification record in DB
        notification = {
            'user_id': user['_id'],
            'type': 'invitation',
            'email': email,
            'sent_at': datetime.utcnow(),
            'status': 'sent' if success else 'failed'
        }
        self.collection.insert_one(notification)
        return success

    def notify_coach_player_added(self, coach_id, player_name):
        """Notify a coach that a player has been added to their team"""
        from bson import ObjectId
        notification = {
            'user_id': ObjectId(coach_id),
            'type': 'info',
            'message': f"Le joueur {player_name} a été ajouté à votre équipe.",
            'sent_at': datetime.utcnow(),
            'read': False
        }
        self.collection.insert_one(notification)

    def create_notification(self, user_id, title, message, type='info', link=None):
        """Create a generic notification and forward to linked parents if applicable"""
        from bson import ObjectId
        from app.services import get_parent_link_service, get_player_service
        
        # Insert the primary notification
        notification = {
            'user_id': ObjectId(user_id),
            'title': title,
            'message': message,
            'type': type,
            'link': link,
            'sent_at': datetime.utcnow(),
            'read': False
        }
        self.collection.insert_one(notification)
        
        # Check if user_id is actually a player_id (Coach roster sends player_id)
        # Verify if it's a valid player
        player_service = get_player_service(self.db) if hasattr(self, 'db') else None
        
        # If player_service exists, verify if user_id matches a player
        is_player = False
        player_name = ""
        if player_service:
            # We must be careful not to crash if user_id is not a player
            try:
                player = player_service.get_by_id(user_id)
                if player:
                    is_player = True
                    player_name = player.get('name', 'votre enfant')
            except Exception:
                pass
                
        if is_player:
            link_service = get_parent_link_service(self.db) if hasattr(self, 'db') else None
            if link_service:
                parents = link_service.get_linked_parents(user_id)
                for parent in parents:
                    parent_notif = {
                        'user_id': parent['_id'],
                        'title': title,
                        'message': f"[{player_name}] {message}",
                        'type': type,
                        'link': link, # Parent might not have access to the exact link if it's player specific, but we'll try
                        'sent_at': datetime.utcnow(),
                        'read': False
                    }
                    self.collection.insert_one(parent_notif)
