from bson import ObjectId
from datetime import datetime
from app.services.db import get_db
from app.models import create_team

class TeamService:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.teams

    def get_by_club(self, club_id):
        """Get all teams for a club"""
        return list(self.collection.find({'club_id': ObjectId(club_id)}))

    def get_by_id(self, team_id):
        """Get team by ID"""
        return self.collection.find_one({'_id': ObjectId(team_id)})

    def create(self, club_id, name, category, coach_ids=None, description=''):
        """Create a new team via model helper"""
        team_data = create_team(club_id, name, category, coach_ids, description)
        result = self.collection.insert_one(team_data)
        team_data['_id'] = result.inserted_id
        return team_data

    def update(self, team_id, data):
        """Update team data"""
        if 'club_id' in data:
            data['club_id'] = ObjectId(data['club_id'])
        if 'coach_ids' in data:
            data['coach_ids'] = [ObjectId(cid) for cid in data['coach_ids']]
        
        return self.collection.update_one(
            {'_id': ObjectId(team_id)},
            {'$set': data}
        )

    def delete(self, team_id):
        """Delete a team"""
        return self.collection.delete_one({'_id': ObjectId(team_id)})

    def add_coach(self, team_id, coach_id):
        """Add a coach to a team"""
        return self.collection.update_one(
            {'_id': ObjectId(team_id)},
            {'$addToSet': {'coach_ids': ObjectId(coach_id)}}
        )

    def remove_coach(self, team_id, coach_id):
        """Remove a coach from a team"""
        return self.collection.update_one(
            {'_id': ObjectId(team_id)},
            {'$pull': {'coach_ids': ObjectId(coach_id)}}
        )

    def get_players(self, team_id):
        """Get all players in a team"""
        return list(self.db.players.find({'team_id': ObjectId(team_id)}))

def get_team_service():
    return TeamService()
