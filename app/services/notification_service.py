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
        """Create a generic notification"""
        from bson import ObjectId
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
