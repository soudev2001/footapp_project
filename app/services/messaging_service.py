from bson import ObjectId
from datetime import datetime
from app.models import create_message

class MessagingService:
    def __init__(self, db):
        self.db = db
        self.collection = db.messages
        self.channels = db.channels

    def send_message(self, sender_id, content, receiver_id=None, team_id=None, msg_type='direct', channel_id=None):
        """Send a new message"""
        msg_data = create_message(sender_id, content, receiver_id, team_id, msg_type)
        if channel_id:
            msg_data['channel_id'] = ObjectId(channel_id)
            msg_data['type'] = 'channel'
        result = self.collection.insert_one(msg_data)
        msg_data['_id'] = result.inserted_id
        return msg_data

    def get_history(self, user_id=None, team_id=None, limit=50):
        """Get chat history for a user pair or a team"""
        query = {}
        if team_id:
            query = {'team_id': ObjectId(team_id), 'type': 'team'}
        elif user_id:
            pass
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

    def get_channel_messages(self, channel_id, limit=50):
        """Get messages for a custom channel"""
        query = {'channel_id': ObjectId(channel_id), 'type': 'channel'}
        return list(self.collection.find(query).sort('created_at', -1).limit(limit))

    # ========== CHANNELS ==========
    def create_channel(self, club_id, name, created_by, description='', member_ids=None, icon='hashtag', color='primary'):
        """Create a custom channel"""
        channel = {
            'club_id': ObjectId(club_id),
            'name': name,
            'description': description,
            'icon': icon,
            'color': color,
            'created_by': ObjectId(created_by),
            'members': [ObjectId(m) for m in (member_ids or [])],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = self.channels.insert_one(channel)
        channel['_id'] = result.inserted_id
        return channel

    def get_channels(self, club_id, user_id=None):
        """Get all channels for a club (optionally filtered by membership)"""
        query = {'club_id': ObjectId(club_id)}
        channels = list(self.channels.find(query).sort('created_at', -1))
        if user_id:
            uid = ObjectId(user_id)
            channels = [c for c in channels if uid in c.get('members', []) or uid == c.get('created_by')]
        return channels

    def get_channel_by_id(self, channel_id):
        """Get a single channel"""
        return self.channels.find_one({'_id': ObjectId(channel_id)})

    def delete_channel(self, channel_id):
        """Delete a channel and its messages"""
        self.collection.delete_many({'channel_id': ObjectId(channel_id)})
        return self.channels.delete_one({'_id': ObjectId(channel_id)})

    def mark_as_read(self, message_id, user_id):
        """Mark a message as read by a user"""
        return self.collection.update_one(
            {'_id': ObjectId(message_id)},
            {'$addToSet': {'read_by': ObjectId(user_id)}}
        )

    def get_unread_count(self, user_id):
        """Get total unread messages for a user"""
        return self.collection.count_documents({
            '$or': [
                {'receiver_id': ObjectId(user_id), 'read_by': {'$ne': ObjectId(user_id)}},
                {'team_id': {'$exists': True}, 'read_by': {'$ne': ObjectId(user_id)}}
            ]
        })

