# FootApp V2 - Post Service (News Feed)

from bson import ObjectId
from datetime import datetime

class PostService:
    """Service for post/feed-related operations"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.posts
    
    def get_all(self, limit=50):
        """Get all posts sorted by date"""
        return list(self.collection.find().sort('created_at', -1).limit(limit))
    
    def get_by_id(self, post_id):
        """Get post by ID"""
        return self.collection.find_one({'_id': ObjectId(post_id)})
    
    def get_by_club(self, club_id, limit=20):
        """Get posts for a club"""
        return list(self.collection.find({
            'club_id': ObjectId(club_id)
        }).sort('created_at', -1).limit(limit))
    
    def get_by_category(self, club_id, category, limit=10):
        """Get posts by category (news, announcement, match_report)"""
        return list(self.collection.find({
            'club_id': ObjectId(club_id),
            'category': category
        }).sort('created_at', -1).limit(limit))
    
    def create(self, club_id, author_id, title, content, **kwargs):
        """Create a new post"""
        post = {
            'club_id': ObjectId(club_id),
            'author_id': ObjectId(author_id) if author_id else None,
            'title': title,
            'content': content,
            'image': kwargs.get('image', ''),
            'category': kwargs.get('category', 'news'),
            'likes': 0,
            'comments': [],
            'created_at': datetime.utcnow()
        }
        result = self.collection.insert_one(post)
        post['_id'] = result.inserted_id
        return post
    
    def update(self, post_id, data):
        """Update post data"""
        data['updated_at'] = datetime.utcnow()
        return self.collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$set': data}
        )
    
    def like(self, post_id):
        """Increment like count"""
        return self.collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$inc': {'likes': 1}}
        )
    
    def unlike(self, post_id):
        """Decrement like count"""
        return self.collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$inc': {'likes': -1}}
        )
    
    def add_comment(self, post_id, user_id, text):
        """Add a comment to a post"""
        comment = {
            'user_id': ObjectId(user_id),
            'text': text,
            'created_at': datetime.utcnow()
        }
        return self.collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$push': {'comments': comment}}
        )
    
    def delete_comment(self, post_id, comment_index):
        """Delete a comment from a post"""
        post = self.get_by_id(post_id)
        if post and 'comments' in post:
            comments = post['comments']
            if 0 <= comment_index < len(comments):
                comments.pop(comment_index)
                return self.collection.update_one(
                    {'_id': ObjectId(post_id)},
                    {'$set': {'comments': comments}}
                )
        return None
    
    def delete(self, post_id):
        """Delete a post"""
        return self.collection.delete_one({'_id': ObjectId(post_id)})
    
    def search(self, club_id, query, limit=20):
        """Search posts by title or content"""
        return list(self.collection.find({
            'club_id': ObjectId(club_id),
            '$or': [
                {'title': {'$regex': query, '$options': 'i'}},
                {'content': {'$regex': query, '$options': 'i'}}
            ]
        }).sort('created_at', -1).limit(limit))
