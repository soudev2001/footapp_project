# FootLogic V2 - Contract Service

from bson import ObjectId
from datetime import datetime

class ContractService:
    """Service for managing player/coach contracts"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.contracts
        
    def create_offer(self, club_id, user_id, role, conditions='', salary=0, team_id=None):
        """Create a new contract offer"""
        contract = {
            'club_id': ObjectId(club_id),
            'user_id': ObjectId(user_id),
            'team_id': ObjectId(team_id) if team_id else None,
            'role': role,
            'status': 'pending',
            'start_date': datetime.utcnow(),
            'salary': int(salary),
            'conditions': conditions,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = self.collection.insert_one(contract)
        contract['_id'] = result.inserted_id
        return contract

    def get_by_user(self, user_id):
        """Get all contracts for a user"""
        return list(self.collection.find({'user_id': ObjectId(user_id)}).sort('created_at', -1))

    def get_pending_by_user(self, user_id):
        """Get pending offers for a user"""
        return list(self.collection.find({
            'user_id': ObjectId(user_id), 
            'status': 'pending'
        }))

    def get_by_club(self, club_id):
        """Get all contracts for a club"""
        return list(self.collection.find({'club_id': ObjectId(club_id)}).sort('created_at', -1))

    def respond_to_offer(self, contract_id, action):
        """Accept or Reject a contract"""
        if action not in ['active', 'rejected']:
            raise ValueError("Invalid action")
            
        update_data = {
            'status': action,
            'updated_at': datetime.utcnow()
        }
        
        self.collection.update_one(
            {'_id': ObjectId(contract_id)},
            {'$set': update_data}
        )
        
        # If accepted, we might want to update the user's club_id immediately
        # But usually we do this in the route handler to keep service focused
        return self.collection.find_one({'_id': ObjectId(contract_id)})

    def get_by_id(self, contract_id):
        return self.collection.find_one({'_id': ObjectId(contract_id)})
