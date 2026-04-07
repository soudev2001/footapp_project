from datetime import datetime
from bson import ObjectId


class FanEngagementService:
    def __init__(self, db):
        self.db = db

    # ---- Comments ----

    def get_comments(self, post_id):
        comments = list(self.db.comments.find({'post_id': ObjectId(post_id)}).sort('created_at', 1))
        for c in comments:
            c['_id'] = str(c['_id'])
            c['post_id'] = str(c['post_id'])
            c['author_id'] = str(c['author_id'])
            if c.get('parent_comment_id'):
                c['parent_comment_id'] = str(c['parent_comment_id'])
            user = self.db.users.find_one({'_id': ObjectId(c['author_id'])}, {'profile': 1})
            c['author_name'] = ''
            if user and user.get('profile'):
                c['author_name'] = f"{user['profile'].get('first_name', '')} {user['profile'].get('last_name', '')}"
        return comments

    def create_comment(self, post_id, author_id, content, parent_comment_id=None):
        doc = {
            'post_id': ObjectId(post_id),
            'author_id': ObjectId(author_id),
            'content': content,
            'parent_comment_id': ObjectId(parent_comment_id) if parent_comment_id else None,
            'likes': 0,
            'created_at': datetime.utcnow(),
        }
        result = self.db.comments.insert_one(doc)
        return str(result.inserted_id)

    # ---- Reactions ----

    def toggle_reaction(self, post_id, user_id, reaction_type='like'):
        existing = self.db.reactions.find_one({
            'post_id': ObjectId(post_id),
            'user_id': ObjectId(user_id),
            'type': reaction_type,
        })
        if existing:
            self.db.reactions.delete_one({'_id': existing['_id']})
            return {'action': 'removed'}
        self.db.reactions.insert_one({
            'post_id': ObjectId(post_id),
            'user_id': ObjectId(user_id),
            'type': reaction_type,
            'created_at': datetime.utcnow(),
        })
        return {'action': 'added'}

    def get_reactions_count(self, post_id):
        pipeline = [
            {'$match': {'post_id': ObjectId(post_id)}},
            {'$group': {'_id': '$type', 'count': {'$sum': 1}}}
        ]
        result = {r['_id']: r['count'] for r in self.db.reactions.aggregate(pipeline)}
        return result

    # ---- Polls ----

    def create_poll(self, club_id, question, options, expires_days=7):
        doc = {
            'club_id': ObjectId(club_id),
            'question': question,
            'options': [{'text': o, 'votes': 0} for o in options],
            'voters': [],
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + __import__('datetime').timedelta(days=expires_days),
        }
        result = self.db.polls.insert_one(doc)
        return str(result.inserted_id)

    def vote_poll(self, poll_id, option_index, user_id):
        poll = self.db.polls.find_one({'_id': ObjectId(poll_id)})
        if not poll:
            return None
        if str(user_id) in [str(v) for v in poll.get('voters', [])]:
            return {'error': 'Déjà voté'}
        if option_index < 0 or option_index >= len(poll.get('options', [])):
            return {'error': 'Option invalide'}
        self.db.polls.update_one(
            {'_id': ObjectId(poll_id)},
            {
                '$inc': {f'options.{option_index}.votes': 1},
                '$push': {'voters': ObjectId(user_id)}
            }
        )
        return {'success': True}

    def get_polls(self, club_id, limit=10):
        polls = list(self.db.polls.find({'club_id': ObjectId(club_id)}).sort('created_at', -1).limit(limit))
        for p in polls:
            p['_id'] = str(p['_id'])
            p['club_id'] = str(p['club_id'])
            p['voters'] = [str(v) for v in p.get('voters', [])]
        return polls
