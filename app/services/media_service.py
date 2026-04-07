from datetime import datetime
from bson import ObjectId


class MediaService:
    def __init__(self, db):
        self.db = db

    def get_gallery(self, club_id, category=None, limit=30):
        query = {'club_id': ObjectId(club_id)}
        if category:
            query['category'] = category
        items = list(self.db.media.find(query).sort('created_at', -1).limit(limit))
        for item in items:
            item['_id'] = str(item['_id'])
            item['club_id'] = str(item['club_id'])
            if item.get('match_id'):
                item['match_id'] = str(item['match_id'])
        return items

    def get_media(self, media_id):
        item = self.db.media.find_one({'_id': ObjectId(media_id)})
        if not item:
            return None
        item['_id'] = str(item['_id'])
        item['club_id'] = str(item['club_id'])
        self.db.media.update_one({'_id': ObjectId(media_id)}, {'$inc': {'views': 1}})
        return item

    def upload_media(self, club_id, data):
        doc = {
            'club_id': ObjectId(club_id),
            'title': data.get('title', 'Sans titre'),
            'media_type': data.get('media_type', 'photo'),
            'url': data.get('url', '/static/img/placeholder.png'),
            'thumbnail_url': data.get('thumbnail_url', ''),
            'category': data.get('category', 'general'),
            'description': data.get('description', ''),
            'match_id': ObjectId(data['match_id']) if data.get('match_id') else None,
            'duration': data.get('duration', 0),
            'views': 0,
            'created_at': datetime.utcnow(),
        }
        result = self.db.media.insert_one(doc)
        return str(result.inserted_id)
