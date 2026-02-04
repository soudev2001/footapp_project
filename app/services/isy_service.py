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

def get_isy_service():
    return IsyService()
