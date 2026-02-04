# FootLogic Elite - Isy Club Service
from bson import ObjectId
from datetime import datetime
from app.services.db import get_db

class IsyService:
    def __init__(self):
        self.db = get_db()
        self.sponsors = self.db.sponsors
        self.payments = self.db.payments
        self.events = self.db.community_events
        self.messages = self.db.club_messages
        self.event_forums = self.db.event_forums

    # SPONSORS
    def get_sponsors(self, club_id):
        return list(self.sponsors.find({'club_id': club_id}))

    def add_sponsor(self, club_id, data):
        data['club_id'] = club_id
        data['created_at'] = datetime.utcnow()
        result = self.sponsors.insert_one(data)
        return self.sponsors.find_one({'_id': result.inserted_id})

    def delete_sponsor(self, sponsor_id):
        self.sponsors.delete_one({'_id': ObjectId(sponsor_id)})

    # PAYMENTS
    def get_payments(self, club_id):
        return list(self.payments.find({'club_id': club_id}).sort('date', -1))

    def add_payment(self, club_id, user_id, amount, description, status='pending'):
        payment = {
            'club_id': club_id,
            'user_id': user_id,
            'amount': float(amount),
            'description': description,
            'status': status,
            'date': datetime.utcnow()
        }
        result = self.payments.insert_one(payment)
        return self.payments.find_one({'_id': result.inserted_id})

    def update_payment_status(self, payment_id, status):
        self.payments.update_one(
            {'_id': ObjectId(payment_id)},
            {'$set': {'status': status}}
        )

    # COMMUNITY EVENTS
    def get_community_events(self, club_id):
        return list(self.events.find({'club_id': club_id}).sort('date', -1))

    def add_community_event(self, club_id, data):
        data['club_id'] = club_id
        if isinstance(data.get('date'), str):
            data['date'] = datetime.fromisoformat(data['date'])
        result = self.events.insert_one(data)
        return self.events.find_one({'_id': result.inserted_id})


    # OFFICIAL MESSAGING (One-way)
    def send_broadcast(self, club_id, author_id, data):
        """Send a one-way official club message"""
        message = {
            'club_id': ObjectId(club_id),
            'author_id': ObjectId(author_id),
            'title': data.get('title'),
            'content': data.get('content'),
            'targets': data.get('targets', []), # roles or team ids
            'attachments': data.get('attachments', []),
            'type': 'broadcast',
            'created_at': datetime.utcnow()
        }
        result = self.messages.insert_one(message)
        return self.messages.find_one({'_id': result.inserted_id})

    def get_broadcasts(self, club_id, user_role=None, team_id=None):
        """Get relevant broadcasts for a user"""
        query = {'club_id': ObjectId(club_id)}
        if user_role or team_id:
            query['$or'] = [
                {'targets': {'$size': 0}}, # Public to all club
                {'targets': user_role},
                {'targets': str(team_id) if team_id else None}
            ]
        return list(self.messages.find(query).sort('created_at', -1))

    # CONVOCATIONS & LOGISTICS
    def invite_to_event(self, event_id, player_ids):
        """Invite players to an event (match/training)"""
        convocations = []
        for pid in player_ids:
            convocations.append({
                'player_id': pid,
                'status': 'pending', # pending, confirmed, refused
                'response_date': None
            })
        
        return self.db.community_events.update_one(
            {'_id': ObjectId(event_id)},
            {'$set': {'convocations': convocations}}
        )

    def update_convocation_status(self, event_id, player_id, status):
        """Update a player's response to an invitation"""
        return self.db.community_events.update_one(
            {'_id': ObjectId(event_id), 'convocations.player_id': str(player_id)},
            {'$set': {
                'convocations.$.status': status,
                'convocations.$.response_date': datetime.utcnow()
            }}
        )

    def update_event_logistics(self, event_id, tasks_data):
        """Update logistical tasks (carpooling, etc)"""
        return self.db.community_events.update_one(
            {'_id': ObjectId(event_id)},
            {'$set': {'logistics_tasks': tasks_data}}
        )

    # PERFORMANCE TRACKING
    def save_match_performance(self, event_id, performance_data):
        """Save post-match stats (scorers, assists, etc)"""
        return self.db.community_events.update_one(
            {'_id': ObjectId(event_id)},
            {'$set': {
                'performance_summary': performance_data,
                'status': 'completed'
            }}
        )

def get_isy_service():
    return IsyService()
