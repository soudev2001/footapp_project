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
            'first_name': kwargs.get('first_name', ''),
            'last_name': kwargs.get('last_name', ''),
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
        """Update player data with name synchronization and type cleanup"""
        # Clean up data to avoid MongoDB errors and type mismatches
        update_data = {k: v for k, v in data.items() if k not in ['id', '_id', 'profile']}
        
        # Handle first_name/last_name to update name field for compatibility
        if 'first_name' in update_data or 'last_name' in update_data:
            existing = self.get_by_id(player_id)
            if existing:
                fname = update_data.get('first_name', existing.get('first_name', ''))
                lname = update_data.get('last_name', existing.get('last_name', ''))
                update_data['name'] = f"{fname} {lname}".strip()

        # Convert IDs to ObjectId
        for field in ['club_id', 'team_id', 'user_id']:
            if field in update_data and isinstance(update_data[field], str) and update_data[field]:
                try:
                    update_data[field] = ObjectId(update_data[field])
                except:
                    pass
        
        return self.collection.update_one(
            {'_id': ObjectId(player_id)},
            {'$set': update_data}
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

    def save_lineup(self, club_id, formation, starters, team_id=None, substitutes=None, name=None, captains=None, set_pieces=None, player_instructions=None):
        """Save a custom lineup for a club/team"""
        query = {'club_id': ObjectId(club_id)}
        if team_id:
            query['team_id'] = ObjectId(team_id)

        # Handle starters as list (from frontend) or dict (legacy)
        # Preserve None values to maintain position order
        if isinstance(starters, list):
            starters_data = [ObjectId(pid) if pid else None for pid in starters]
        elif isinstance(starters, dict):
            starters_data = [ObjectId(pid) for pid in starters.values() if pid]
        else:
            starters_data = []

        update_data = {
            'formation': formation,
            'starters': starters_data,
            'substitutes': [ObjectId(s) for s in (substitutes or []) if s],
            'team_id': ObjectId(team_id) if team_id else None,
            'captains': [ObjectId(p) for p in (captains or []) if p],
            'set_pieces': {k: [ObjectId(p) for p in (v or []) if p] for k, v in (set_pieces or {}).items()},
            'player_instructions': player_instructions or {},
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
            return {'formation': '4-3-3', 'starters': [], 'substitutes': [], 'captains': [], 'tactical_config': {}}

        # Normalize starters to a flat list of string IDs (preserve None for empty slots)
        raw_starters = lineup.get('starters', [])
        if isinstance(raw_starters, dict):
            starters = [str(v) for v in raw_starters.values() if v]
        elif isinstance(raw_starters, list):
            # Preserve None values to maintain position order
            starters = [str(s) if s else None for s in raw_starters]
        else:
            starters = []
        lineup['starters'] = starters
        lineup['substitutes'] = [str(s) for s in lineup.get('substitutes', []) if s]
        lineup['captains'] = [str(c) for c in lineup.get('captains', []) if c]
        if lineup['captains']:
            lineup['captain'] = lineup['captains'][0]
        return lineup

    def save_convocation(self, club_id, event_id, data):
        """Save a convocation document for a match/event"""
        doc = {
            'club_id': ObjectId(club_id),
            'event_id': ObjectId(event_id) if event_id else None,
            'formation': data.get('formation', '4-3-3'),
            'starters': data.get('starters', []),
            'substitutes': data.get('substitutes', []),
            'captains': data.get('captains', []),
            'set_pieces': data.get('set_pieces', {}),
            'player_instructions': data.get('player_instructions', {}),
            'message': data.get('message', ''),
            'match_date': data.get('match_date'),
            'player_ids': data.get('player_ids', []),
            'sent_at': datetime.utcnow(),
        }
        result = self.db.convocations.insert_one(doc)
        return str(result.inserted_id)

    def get_convocation(self, convocation_id):
        """Get a convocation by ID"""
        try:
            doc = self.db.convocations.find_one({'_id': ObjectId(convocation_id)})
            if doc:
                doc['id'] = str(doc.pop('_id'))
                if doc.get('club_id'):
                    doc['club_id'] = str(doc['club_id'])
                if doc.get('event_id'):
                    doc['event_id'] = str(doc['event_id'])
            return doc
        except Exception:
            return None

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

    def save_tactic_preset(self, club_id, team_id, name, formation, starters, substitutes, instructions=None, description='', captains=None, set_pieces=None, player_instructions=None, tactic_id=None):
        """Save a tactic. If tactic_id is provided, update by ID. Otherwise upsert by name/club/team."""
        from app.models import create_saved_tactic
        tactic = create_saved_tactic(club_id, team_id, name, formation, starters, substitutes, instructions, description, captains, set_pieces, player_instructions)

        if tactic_id:
            # Update existing tactic by ID
            result = self.db.saved_tactics.update_one(
                {'_id': ObjectId(tactic_id), 'club_id': ObjectId(club_id)},
                {'$set': tactic}
            )
            return tactic_id
        else:
            # Upsert by name/club/team for new tactics
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
