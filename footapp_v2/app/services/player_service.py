# FootApp V2 - Player Service

from bson import ObjectId
from datetime import datetime

class PlayerService:
    """Service for player-related operations"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.players
    
    def get_all(self):
        """Get all players"""
        return list(self.collection.find())
    
    def get_by_id(self, player_id):
        """Get player by ID"""
        return self.collection.find_one({'_id': ObjectId(player_id)})
    
    def get_by_club(self, club_id):
        """Get all players for a club"""
        return list(self.collection.find({'club_id': ObjectId(club_id)}))
    
    def get_by_position(self, club_id, position):
        """Get players by position"""
        return list(self.collection.find({
            'club_id': ObjectId(club_id),
            'position': position
        }))
    
    def get_by_user(self, user_id):
        """Get player profile for a user"""
        return self.collection.find_one({'user_id': ObjectId(user_id)})
    
    def create(self, club_id, jersey_number, position, name, **kwargs):
        """Create a new player"""
        player = {
            'club_id': ObjectId(club_id),
            'user_id': ObjectId(kwargs['user_id']) if kwargs.get('user_id') else None,
            'jersey_number': jersey_number,
            'position': position,
            'name': name,
            'stats': kwargs.get('stats', {
                'goals': 0,
                'assists': 0,
                'matches_played': 0,
                'yellow_cards': 0,
                'red_cards': 0
            }),
            'photo': kwargs.get('photo', ''),
            'birth_date': kwargs.get('birth_date'),
            'height': kwargs.get('height', 175),
            'weight': kwargs.get('weight', 70),
            'status': kwargs.get('status', 'active'),
            'created_at': datetime.utcnow()
        }
        result = self.collection.insert_one(player)
        player['_id'] = result.inserted_id
        return player
    
    def update(self, player_id, data):
        """Update player data"""
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$set': data}
        )
    
    def update_stats(self, player_id, stats):
        """Update player statistics"""
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$set': {'stats': stats}}
        )
    
    def set_status(self, player_id, status):
        """Set player status (active, injured, suspended)"""
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$set': {'status': status}}
        )
    
    def delete(self, player_id):
        """Delete a player"""
        return self.collection.delete_one({'_id': ObjectId(player_id)})
    
    def get_top_scorers(self, club_id, limit=5):
        """Get top scorers for a club"""
        return list(self.collection.find(
            {'club_id': ObjectId(club_id)}
        ).sort('stats.goals', -1).limit(limit))
    
    def get_lineup_by_formation(self, club_id, formation='4-3-3'):
        """Get suggested lineup based on formation"""
        players = self.get_by_club(club_id)
        
        # Parse formation
        parts = [int(x) for x in formation.split('-')]
        lineup = {'GK': [], 'DEF': [], 'MID': [], 'ATT': []}
        
        for player in players:
            if player['status'] == 'active':
                pos = player['position']
                if pos in lineup:
                    lineup[pos].append(player)
        
        return lineup
