# FootApp V2 - Match Service

from bson import ObjectId
from datetime import datetime

class MatchService:
    """Service for match-related operations"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.matches
    
    def get_all(self):
        """Get all matches sorted by date"""
        return list(self.collection.find().sort('date', -1))
    
    def get_by_id(self, match_id):
        """Get match by ID"""
        return self.collection.find_one({'_id': ObjectId(match_id)})
    
    def get_by_club(self, club_id):
        """Get all matches for a club"""
        return list(self.collection.find({'club_id': ObjectId(club_id)}).sort('date', -1))
    
    def get_upcoming(self, club_id, limit=5):
        """Get upcoming scheduled matches"""
        return list(self.collection.find({
            'club_id': ObjectId(club_id),
            'status': 'scheduled'
        }).sort('date', 1).limit(limit))
    
    def get_completed(self, club_id, limit=10):
        """Get completed matches"""
        return list(self.collection.find({
            'club_id': ObjectId(club_id),
            'status': 'completed'
        }).sort('date', -1).limit(limit))
    
    def create(self, club_id, opponent, date, is_home=True, **kwargs):
        """Create a new match"""
        match = {
            'club_id': ObjectId(club_id),
            'opponent': opponent,
            'date': date,
            'location': kwargs.get('location', ''),
            'is_home': is_home,
            'score': {'home': 0, 'away': 0},
            'status': kwargs.get('status', 'scheduled'),
            'lineup': [],
            'events': [],
            'created_at': datetime.utcnow()
        }
        result = self.collection.insert_one(match)
        match['_id'] = result.inserted_id
        return match
    
    def update(self, match_id, data):
        """Update match data"""
        return self.collection.update_one(
            {'_id': ObjectId(match_id)},
            {'$set': data}
        )
    
    def set_score(self, match_id, home_score, away_score):
        """Update match score"""
        return self.collection.update_one(
            {'_id': ObjectId(match_id)},
            {'$set': {
                'score.home': home_score,
                'score.away': away_score,
                'status': 'completed'
            }}
        )
    
    def set_lineup(self, match_id, player_ids):
        """Set match lineup"""
        return self.collection.update_one(
            {'_id': ObjectId(match_id)},
            {'$set': {'lineup': [ObjectId(pid) for pid in player_ids]}}
        )
    
    def add_event(self, match_id, event_type, player_id, minute):
        """Add match event (goal, assist, card, substitution)"""
        event = {
            'type': event_type,
            'player_id': ObjectId(player_id),
            'minute': minute,
            'timestamp': datetime.utcnow()
        }
        return self.collection.update_one(
            {'_id': ObjectId(match_id)},
            {'$push': {'events': event}}
        )
    
    def get_lineup(self, match_id):
        """Get match lineup with player details"""
        match = self.get_by_id(match_id)
        if not match:
            return []
        
        from app.services.db import mongo
        lineup_ids = match.get('lineup', [])
        return list(mongo.db.players.find({'_id': {'$in': lineup_ids}}))
    
    def get_season_stats(self, club_id):
        """Get season statistics for a club"""
        matches = list(self.collection.find({
            'club_id': ObjectId(club_id),
            'status': 'completed'
        }))
        
        wins = draws = losses = goals_for = goals_against = 0
        
        for m in matches:
            score = m.get('score', {'home': 0, 'away': 0})
            is_home = m.get('is_home', True)
            
            our_goals = score['home'] if is_home else score['away']
            their_goals = score['away'] if is_home else score['home']
            
            goals_for += our_goals
            goals_against += their_goals
            
            if our_goals > their_goals:
                wins += 1
            elif our_goals < their_goals:
                losses += 1
            else:
                draws += 1
        
        return {
            'played': len(matches),
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'goals_for': goals_for,
            'goals_against': goals_against,
            'goal_difference': goals_for - goals_against,
            'points': (wins * 3) + draws
        }
    
    def delete(self, match_id):
        """Delete a match"""
        return self.collection.delete_one({'_id': ObjectId(match_id)})
