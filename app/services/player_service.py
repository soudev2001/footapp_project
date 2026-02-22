# FootLogic V2 - Player Service

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
    
    def get_by_club(self, club_id, team_id=None):
        """Get all players for a club, optionally filtered by team"""
        query = {'club_id': ObjectId(club_id)}
        if team_id:
            query['team_id'] = ObjectId(team_id)
        return list(self.collection.find(query))
    
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
        team_id = kwargs.get('team_id')
        player = {
            'club_id': ObjectId(club_id),
            'team_id': ObjectId(team_id) if team_id else None,
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
            'technical_ratings': kwargs.get('technical_ratings', {
                'VIT': 50, 'TIR': 50, 'PAS': 50, 'DRI': 50, 'DEF': 50, 'PHY': 50
            }),
            'created_at': datetime.utcnow(),
            # ISY CLUB PRO FEATURES
            'parents': kwargs.get('parents', {
                'father': {'name': '', 'phone': '', 'id': None},
                'mother': {'name': '', 'phone': '', 'id': None}
            }),
            'health_info': kwargs.get('health_info', {
                'allergies': [],
                'medical_notes': '',
                'emergency_contact': ''
            }),
            'documents': kwargs.get('documents', {
                'license': {'status': 'missing', 'file': ''},
                'medical_cert': {'status': 'missing', 'file': ''},
                'id_card': {'status': 'missing', 'file': ''}
            }),
            'license_number': kwargs.get('license_number', '')
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
        """Update player statistics (goals, assist, etc)"""
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$set': {'stats': stats}}
        )

    def update_technical_ratings(self, player_id, ratings):
        """Update technical ratings (Pace, Shooting, etc)"""
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$set': {'technical_ratings': ratings}}
        )

    def add_physical_record(self, player_id, record):
        """Add a physical record (Weight, VMA, etc) to history"""
        record['date'] = datetime.utcnow()
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$push': {'physical_history': record}}
        )

    def add_evaluation(self, player_id, evaluation):
        """Add coach evaluation"""
        evaluation['date'] = datetime.utcnow()
        evaluation['id'] = str(ObjectId())
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$push': {'evaluations': evaluation}}
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

    # ROSTER PRO ACTIONS
    def update_documents(self, player_id, doc_type, status, filename=None):
        """Update a specific document status/file"""
        update_data = {f'documents.{doc_type}.status': status}
        if filename:
            update_data[f'documents.{doc_type}.file'] = filename
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$set': update_data}
        )

    def update_parent_info(self, player_id, parent_type, data):
        """Update father or mother information"""
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$set': {f'parents.{parent_type}': data}}
        )
    
    def get_upcoming(self, club_id, team_id=None, limit=10):
        """Get upcoming events, optionally filtered by team"""
        query = {
            'club_id': ObjectId(club_id),
            'date': {'$gte': datetime.utcnow()}
        }
        if team_id:
            query['team_id'] = ObjectId(team_id)
        return list(self.collection.find(query).sort('date', 1).limit(limit))
    
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
            if player.get('status') == 'active':
                pos = player.get('position')
                if pos in lineup:
                    lineup[pos].append(player)
        
        return lineup

    def save_lineup(self, club_id, formation, starters, team_id=None, substitutes=None, name=None, captains=None, set_pieces=None):
        """Save a custom lineup for a club/team"""
        query = {'club_id': ObjectId(club_id)}
        if team_id:
            query['team_id'] = ObjectId(team_id)

        update_data = {
            'formation': formation,
            'starters': {pos: ObjectId(pid) for pos, pid in starters.items() if pid},
            'substitutes': [ObjectId(s) for s in (substitutes or []) if s],
            'team_id': ObjectId(team_id) if team_id else None,
            'captains': [ObjectId(p) for p in (captains or []) if p],
            'set_pieces': {k: [ObjectId(p) for p in (v or []) if p] for k, v in (set_pieces or {}).items()},
            'updated_at': datetime.utcnow()
        }
        if name:
            update_data['name'] = name

        return self.db.lineups.update_one(
            query,
            {'$set': update_data},
            upsert=True
        )

    def get_active_lineup(self, club_id, team_id=None):
        """Get the current active lineup for a club/team"""
        query = {'club_id': ObjectId(club_id)}
        if team_id:
            query['team_id'] = ObjectId(team_id)

        lineup = self.db.lineups.find_one(query)
        if not lineup:
            return {'formation': '4-3-3', 'starters': {}, 'substitutes': [], 'tactical_config': {}}
        return lineup

    def save_tactical_config(self, club_id, team_id=None, config=None):
        """Save tactical configuration for a club/team"""
        query = {'club_id': ObjectId(club_id)}
        if team_id:
            query['team_id'] = ObjectId(team_id)

        return self.db.lineups.update_one(
            query,
            {
                '$set': {
                    'tactical_config': config or {},
                    'team_id': ObjectId(team_id) if team_id else None,
                    'updated_at': datetime.utcnow()
                }
            },
            upsert=True
        )

    def save_tactic_preset(self, club_id, team_id, name, formation, starters, substitutes, instructions=None, description='', captains=None, set_pieces=None):
        """Save a new tactical preset (upsert by name/club/team)"""
        from app.models import create_saved_tactic
        tactic = create_saved_tactic(club_id, team_id, name, formation, starters, substitutes, instructions, description, captains, set_pieces)
        
        query = {
            'club_id': ObjectId(club_id),
            'name': name
        }
        if team_id:
            query['team_id'] = ObjectId(team_id)
        else:
            query['team_id'] = None

        result = self.db.saved_tactics.update_one(
            query,
            {'$set': tactic},
            upsert=True
        )
        
        if result.upserted_id:
            return str(result.upserted_id)
        
        # If it was an update, we need to find the ID
        existing = self.db.saved_tactics.find_one(query)
        return str(existing['_id'])

    def get_tactic_presets(self, club_id, team_id=None):
        """Get all saved tactics for a club/team"""
        query = {'club_id': ObjectId(club_id)}
        if team_id:
            query['team_id'] = ObjectId(team_id)
        return list(self.db.saved_tactics.find(query).sort('created_at', -1))

    def get_tactic_preset(self, preset_id):
        """Get a specific preset"""
        return self.db.saved_tactics.find_one({'_id': ObjectId(preset_id)})
    
    def delete_tactic_preset(self, preset_id):
        """Delete a tactic preset"""
        return self.db.saved_tactics.delete_one({'_id': ObjectId(preset_id)})

