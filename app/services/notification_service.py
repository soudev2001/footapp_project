# FootLogic V2 - Notification Service

from datetime import datetime, timedelta

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

    def get_dashboard_alerts(self, club_id, team_id=None, user_role='player'):
        """Generate real-time dashboard alerts from upcoming matches and events"""
        from app.services import get_match_service, get_event_service

        match_service = get_match_service()
        event_service = get_event_service()

        now = datetime.utcnow()
        alerts = []

        # Upcoming matches (next 7 days)
        upcoming_matches = match_service.get_upcoming(club_id, team_id=team_id, limit=10)
        for match in upcoming_matches:
            match_date = match.get('date')
            if not match_date:
                continue
            if isinstance(match_date, str):
                try:
                    match_date = datetime.fromisoformat(match_date)
                except (ValueError, TypeError):
                    continue
            delta = (match_date - now).total_seconds()
            if delta < 0 or delta > 7 * 86400:
                continue
            urgent = delta < 48 * 3600
            opponent = match.get('opponent', 'Adversaire')
            location = match.get('location', '')
            alerts.append({
                'type': 'match',
                'urgent': urgent,
                'title': f"Match vs {opponent}",
                'message': f"{'🏠 Domicile' if match.get('is_home') else '🚌 Extérieur'}{(' • ' + location) if location else ''}",
                'date': match_date,
                'date_label': match_date.strftime('%d/%m à %H:%M') if match_date else '',
                'link': None,
                'match_id': str(match.get('_id', '')),
                'icon': 'fa-futbol',
                'color': 'red',
            })

        # Upcoming events (next 7 days)
        upcoming_events = event_service.get_upcoming(club_id, team_id=team_id, limit=15)
        for event in upcoming_events:
            event_date = event.get('date')
            if not event_date:
                continue
            if isinstance(event_date, str):
                try:
                    event_date = datetime.fromisoformat(event_date)
                except (ValueError, TypeError):
                    continue
            delta = (event_date - now).total_seconds()
            if delta < 0 or delta > 7 * 86400:
                continue

            etype = event.get('event_type') or event.get('type', 'other')
            # Skip match-type events (already covered by match_service)
            if etype == 'match':
                continue

            if etype == 'training':
                urgent = delta < 24 * 3600
                icon = 'fa-dumbbell'
                color = 'green'
                label = 'Entraînement'
            elif etype == 'meeting':
                urgent = delta < 24 * 3600
                icon = 'fa-handshake'
                color = 'amber'
                label = 'Réunion'
            else:
                urgent = delta < 24 * 3600
                icon = 'fa-calendar-day'
                color = 'primary'
                label = 'Événement'

            alerts.append({
                'type': etype,
                'urgent': urgent,
                'title': event.get('title', label),
                'message': event.get('location', ''),
                'date': event_date,
                'date_label': event_date.strftime('%d/%m à %H:%M') if event_date else '',
                'link': None,
                'event_id': str(event.get('_id', '')),
                'icon': icon,
                'color': color,
            })

        # Sort by date (soonest first), urgent items first within same date
        alerts.sort(key=lambda a: (not a['urgent'], a['date']))
        return alerts
