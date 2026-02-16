from bson import ObjectId
from datetime import datetime
from app.models import create_message

class MessagingService:
    def __init__(self, db):
        self.db = db
        self.collection = db.messages

    def send_message(self, sender_id, content, receiver_id=None, team_id=None, msg_type='direct'):
        """Send a new message"""
        msg_data = create_message(sender_id, content, receiver_id, team_id, msg_type)
        result = self.collection.insert_one(msg_data)
        msg_data['_id'] = result.inserted_id
        return msg_data

    def get_history(self, user_id=None, team_id=None, limit=50):
        """Get chat history for a user pair or a team"""
        query = {}
        if team_id:
            query = {'team_id': ObjectId(team_id), 'type': 'team'}
        elif user_id:
            # For DMs, we need messages where user_id is either sender or receiver
            # This is a bit complex for a simple query, usually involves $or
            pass # Will implement sophisticated query below

        return list(self.collection.find(query).sort('created_at', -1).limit(limit))

    def get_direct_messages(self, user_a, user_b, limit=50):
        """Get DM history between two users"""
        query = {
            'type': 'direct',
            '$or': [
                {'sender_id': ObjectId(user_a), 'receiver_id': ObjectId(user_b)},
                {'sender_id': ObjectId(user_b), 'receiver_id': ObjectId(user_a)}
            ]
        }
        return list(self.collection.find(query).sort('created_at', -1).limit(limit))

    def get_team_messages(self, team_id, limit=50):
        """Get group messages for a team"""
        query = {'team_id': ObjectId(team_id), 'type': 'team'}
        return list(self.collection.find(query).sort('created_at', -1).limit(limit))

    def mark_as_read(self, message_id, user_id):
        """Mark a message as read by a user"""
        return self.collection.update_one(
            {'_id': ObjectId(message_id)},
            {'$addToSet': {'read_by': ObjectId(user_id)}}
        )

    def get_unread_count(self, user_id):
        """Get total unread messages for a user (simplified)"""
        # In a real app, this would check if user_id is in read_by across relevant chats
        return self.collection.count_documents({
            '$or': [
                {'receiver_id': ObjectId(user_id), 'read_by': {'$ne': ObjectId(user_id)}},
                {'team_id': {'$exists': True}, 'read_by': {'$ne': ObjectId(user_id)}}
            ]
        })
