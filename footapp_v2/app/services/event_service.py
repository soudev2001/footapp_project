# FootApp V2 - Event Service

from bson import ObjectId
from datetime import datetime

class EventService:
    """Service for event-related operations"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.events
    
    def get_all(self):
        """Get all events sorted by date"""
        return list(self.collection.find().sort('date', -1))
    
    def get_by_id(self, event_id):
        """Get event by ID"""
        return self.collection.find_one({'_id': ObjectId(event_id)})
    
    def get_by_club(self, club_id):
        """Get all events for a club"""
        return list(self.collection.find({'club_id': ObjectId(club_id)}).sort('date', -1))
    
    def get_upcoming(self, club_id, limit=10):
        """Get upcoming events"""
        return list(self.collection.find({
            'club_id': ObjectId(club_id),
            'date': {'$gte': datetime.utcnow()}
        }).sort('date', 1).limit(limit))
    
    def get_past(self, club_id, limit=10):
        """Get past events"""
        return list(self.collection.find({
            'club_id': ObjectId(club_id),
            'date': {'$lt': datetime.utcnow()}
        }).sort('date', -1).limit(limit))
    
    def get_by_type(self, club_id, event_type):
        """Get events by type (training, match, meeting, other)"""
        return list(self.collection.find({
            'club_id': ObjectId(club_id),
            'type': event_type
        }).sort('date', -1))
    
    def create(self, club_id, title, event_type, date, **kwargs):
        """Create a new event"""
        event = {
            'club_id': ObjectId(club_id),
            'title': title,
            'type': event_type,
            'date': date,
            'location': kwargs.get('location', ''),
            'description': kwargs.get('description', ''),
            'attendees': [],
            'created_by': ObjectId(kwargs['created_by']) if kwargs.get('created_by') else None,
            'created_at': datetime.utcnow()
        }
        result = self.collection.insert_one(event)
        event['_id'] = result.inserted_id
        return event
    
    def update(self, event_id, data):
        """Update event data"""
        return self.collection.update_one(
            {'_id': ObjectId(event_id)},
            {'$set': data}
        )
    
    def add_attendee(self, event_id, player_id):
        """Add attendee to event"""
        return self.collection.update_one(
            {'_id': ObjectId(event_id)},
            {'$addToSet': {'attendees': ObjectId(player_id)}}
        )
    
    def remove_attendee(self, event_id, player_id):
        """Remove attendee from event"""
        return self.collection.update_one(
            {'_id': ObjectId(event_id)},
            {'$pull': {'attendees': ObjectId(player_id)}}
        )
    
    def get_attendance(self, event_id):
        """Get attendance list for an event"""
        event = self.get_by_id(event_id)
        if not event:
            return []
        
        from app.services.db import mongo
        attendee_ids = event.get('attendees', [])
        return list(mongo.db.players.find({'_id': {'$in': attendee_ids}}))
    
    def delete(self, event_id):
        """Delete an event"""
        return self.collection.delete_one({'_id': ObjectId(event_id)})
