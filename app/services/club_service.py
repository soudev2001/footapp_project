# FootLogic V2 - Club Service

from bson import ObjectId
from datetime import datetime

class ClubService:
    """Service for club-related operations"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.clubs
    
    def get_all(self):
        """Get all clubs"""
        return list(self.collection.find())
    
    def get_by_id(self, club_id):
        """Get club by ID"""
        return self.collection.find_one({'_id': ObjectId(club_id)})
    
    def create(self, name, city, colors, **kwargs):
        """Create a new club"""
        club = {
            'name': name,
            'city': city,
            'colors': colors,
            'logo': kwargs.get('logo', ''),
            'stadium': kwargs.get('stadium', ''),
            'founded_year': kwargs.get('founded_year', datetime.now().year),
            'description': kwargs.get('description', ''),
            'created_at': datetime.utcnow()
        }
        result = self.collection.insert_one(club)
        club['_id'] = result.inserted_id
        return club
    
    def update(self, club_id, data):
        """Update club data"""
        return self.collection.update_one(
            {'_id': ObjectId(club_id)},
            {'$set': data}
        )
    
    def delete(self, club_id):
        """Delete a club"""
        return self.collection.delete_one({'_id': ObjectId(club_id)})
    
    def get_stats(self, club_id):
        """Get club statistics"""
        from app.services.db import mongo
        return {
            'players': mongo.db.players.count_documents({'club_id': ObjectId(club_id)}),
            'events': mongo.db.events.count_documents({'club_id': ObjectId(club_id)}),
            'matches': mongo.db.matches.count_documents({'club_id': ObjectId(club_id)}),
            'posts': mongo.db.posts.count_documents({'club_id': ObjectId(club_id)})
        }

