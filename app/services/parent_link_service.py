# FootLogic V2 - Parent Link Service

import secrets
import string
from datetime import datetime
from bson import ObjectId

class ParentLinkService:
    """Service to handle relationships between Parent users and Minor players"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.parent_links
        # Ensure unique index on link_code
        self.collection.create_index("link_code", unique=True, sparse=True)
        # Ensure unique parent/player combination
        self.collection.create_index([("parent_id", 1), ("player_id", 1)], unique=True)
        
    def generate_link_code(self, player_id, club_id, generated_by_user_id=None):
        """Generate a unique 6-character association code for a player"""
        # First check if there's already an active code we can reuse
        existing = self.collection.find_one({
            'player_id': ObjectId(player_id),
            'status': 'pending'
        })
        if existing:
            return existing['link_code']
            
        # Generate new 6 character alphanumeric code
        alphabet = string.ascii_uppercase + string.digits
        code = ''.join(secrets.choice(alphabet) for i in range(6))
        
        # Ensure the code doesn't exist already (extremely rare but possible)
        while self.collection.find_one({'link_code': code}):
            code = ''.join(secrets.choice(alphabet) for i in range(6))
            
        link_doc = {
            'player_id': ObjectId(player_id),
            'club_id': ObjectId(club_id),
            'parent_id': None, # Will be set upon linking
            'link_code': code,
            'status': 'pending', # pending -> active
            'created_at': datetime.utcnow(),
            'generated_by': ObjectId(generated_by_user_id) if generated_by_user_id else None
        }
        
        self.collection.insert_one(link_doc)
        return code

    def link_parent_to_player(self, parent_id, code):
        """Validate an association code and link the parent"""
        code = code.upper().strip()
        link = self.collection.find_one({'link_code': code, 'status': 'pending'})
        
        if not link:
            return False, "Code invalide, expiré ou déjà utilisé."
            
        # Check if this exact relationship already exists
        existing_rel = self.collection.find_one({
            'parent_id': ObjectId(parent_id),
            'player_id': link['player_id'],
            'status': 'active'
        })
        
        if existing_rel:
            return False, "Vous êtes déjà lié à ce joueur."
            
        # Update the link document to active
        result = self.collection.update_one(
            {'_id': link['_id']},
            {
                '$set': {
                    'parent_id': ObjectId(parent_id),
                    'status': 'active',
                    'linked_at': datetime.utcnow(),
                    'link_code': None # Invalidate code once used
                }
            }
        )
        
        if result.modified_count > 0:
            return True, "Enfant associé avec succès."
        return False, "Erreur lors de l'association."
        
    def get_linked_players(self, parent_id):
        """Get all active player profiles linked to a specific parent"""
        links = list(self.collection.find({
            'parent_id': ObjectId(parent_id),
            'status': 'active'
        }))
        
        if not links:
            return []
            
        player_ids = [link['player_id'] for link in links]
        
        # Fetch actual player documents
        players = list(self.db.players.find({'_id': {'$in': player_ids}}))
        return players
        
    def get_linked_parents(self, player_id):
        """Get all active parent profiles linked to a specific player"""
        links = list(self.collection.find({
            'player_id': ObjectId(player_id),
            'status': 'active'
        }))
        
        if not links:
            return []
            
        parent_ids = [link['parent_id'] for link in links]
        
        parents = list(self.db.users.find({'_id': {'$in': parent_ids}}))
        return parents
        
    def get_pending_code(self, player_id):
        """Retrieve the pending association code for a player if it exists"""
        link = self.collection.find_one({
            'player_id': ObjectId(player_id),
            'status': 'pending'
        })
        if link:
            return link['link_code']
        return None
        
    def delete_link(self, link_id):
        """Delete an association"""
        return self.collection.delete_one({'_id': ObjectId(link_id)})

def get_parent_link_service(db=None):
    from flask import current_app
    if db is None:
        db = current_app.extensions['pymongo'].db
    return ParentLinkService(db)
