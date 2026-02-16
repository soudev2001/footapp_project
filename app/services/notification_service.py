# FootLogic V2 - Notification Service

from datetime import datetime

class NotificationService:
    def __init__(self, db):
        self.db = db
        self.collection = db.notifications

    def send_invitation(self, user):
        """
        Simulate sending an invitation email.
        In a real app, this would use Flask-Mail or an external API.
        """
        email = user.get('email')
        token = user.get('invitation_token')
        
        # Log the invitation (for demo purposes)
        print(f"DEBUG: Sending invitation to {email}")
        print(f"DEBUG: Invitation Link: /complete-profile/{token}")
        
        # Create a notification record in DB
        notification = {
            'user_id': user['_id'],
            'type': 'invitation',
            'email': email,
            'sent_at': datetime.utcnow(),
            'status': 'sent'
        }
        self.collection.insert_one(notification)
        return True

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
