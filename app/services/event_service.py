# FootLogic V2 - Event Service

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
            'attendance': {}, # player_id_str: status
            'score': {'home': 0, 'away': 0},
            'match_events': [], # list of { minute, type, player_id, team, detail }
            'status': 'scheduled', # scheduled, live, finished
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
    
    def set_attendance(self, event_id, player_id, status):
        """Set attendance status for a player"""
        return self.collection.update_one(
            {'_id': ObjectId(event_id)},
            {'$set': {f'attendance.{str(player_id)}': status}}
        )
    
    def set_bulk_attendance(self, event_id, attendance_map):
        """Set attendance status for multiple players at once"""
        updates = {f'attendance.{str(pid)}': status for pid, status in attendance_map.items()}
        if not updates:
            return None
        return self.collection.update_one(
            {'_id': ObjectId(event_id)},
            {'$set': updates}
        )
    
    def get_attendance(self, event_id):
        """Get attendance map for an event"""
        event = self.get_by_id(event_id)
        return event.get('attendance', {}) if event else {}

    def get_attendance_list(self, event_id):
        """Get attendance objects for an event"""
        event = self.get_by_id(event_id)
        if not event:
            return []
        
        from app.services.db import mongo
        attendance_map = event.get('attendance', {})
        player_ids = [ObjectId(pid) for pid in attendance_map.keys()]
        
        players = list(mongo.db.players.find({'_id': {'$in': player_ids}}))
        
        # Merge status into player objects
        for player in players:
            player['attendance_status'] = attendance_map.get(str(player['_id']))
            
        return players
    
    def update_score(self, event_id, home_score, away_score):
        """Update match score"""
        return self.collection.update_one(
            {'_id': ObjectId(event_id)},
            {'$set': {'score': {'home': home_score, 'away': away_score}}}
        )
    
    def add_match_event(self, event_id, event_data):
        """Add event (goal, card, etc) to match"""
        return self.collection.update_one(
            {'_id': ObjectId(event_id)},
            {'$push': {'match_events': {
                **event_data,
                'id': str(ObjectId()) # Unique ID for the event
            }}}
        )

    def set_match_status(self, event_id, status):
        """Set match status (live, finished, etc)"""
        return self.collection.update_one(
            {'_id': ObjectId(event_id)},
            {'$set': {'status': status}}
        )
    
    def delete(self, event_id):
        """Delete an event"""
        return self.collection.delete_one({'_id': ObjectId(event_id)})

    def add_attendee(self, event_id, player_id):
        """Alias for set_attendance with 'present' status"""
        return self.set_attendance(event_id, player_id, 'present')

    def remove_attendee(self, event_id, player_id):
        """Alias for set_attendance with 'absent' status"""
        return self.set_attendance(event_id, player_id, 'absent')

