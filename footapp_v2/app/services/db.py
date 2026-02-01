# FootApp V2 - Database Service (MongoDB Connection)

from flask_pymongo import PyMongo

mongo = PyMongo()

def init_db(app):
    """Initialize MongoDB connection"""
    mongo.init_app(app)
    return mongo

def get_db():
    """Get database instance"""
    return mongo.db

# ============================================================
# CRUD HELPER FUNCTIONS
# ============================================================

# --- CLUBS ---
def get_all_clubs():
    return list(mongo.db.clubs.find())

def get_club_by_id(club_id):
    from bson import ObjectId
    return mongo.db.clubs.find_one({'_id': ObjectId(club_id)})

def insert_club(club_doc):
    return mongo.db.clubs.insert_one(club_doc)

# --- PLAYERS ---
def get_all_players():
    return list(mongo.db.players.find())

def get_players_by_club(club_id):
    from bson import ObjectId
    return list(mongo.db.players.find({'club_id': ObjectId(club_id)}))

def get_player_by_id(player_id):
    from bson import ObjectId
    return mongo.db.players.find_one({'_id': ObjectId(player_id)})

def insert_player(player_doc):
    return mongo.db.players.insert_one(player_doc)

# --- EVENTS ---
def get_all_events():
    return list(mongo.db.events.find().sort('date', -1))

def get_events_by_club(club_id):
    from bson import ObjectId
    return list(mongo.db.events.find({'club_id': ObjectId(club_id)}).sort('date', -1))

def get_upcoming_events(club_id, limit=5):
    from bson import ObjectId
    from datetime import datetime
    return list(mongo.db.events.find({
        'club_id': ObjectId(club_id),
        'date': {'$gte': datetime.utcnow()}
    }).sort('date', 1).limit(limit))

def insert_event(event_doc):
    return mongo.db.events.insert_one(event_doc)

# --- MATCHES ---
def get_all_matches():
    return list(mongo.db.matches.find().sort('date', -1))

def get_matches_by_club(club_id):
    from bson import ObjectId
    return list(mongo.db.matches.find({'club_id': ObjectId(club_id)}).sort('date', -1))

def get_upcoming_matches(club_id, limit=5):
    from bson import ObjectId
    from datetime import datetime
    return list(mongo.db.matches.find({
        'club_id': ObjectId(club_id),
        'status': 'scheduled'
    }).sort('date', 1).limit(limit))

def insert_match(match_doc):
    return mongo.db.matches.insert_one(match_doc)

# --- POSTS ---
def get_all_posts():
    return list(mongo.db.posts.find().sort('created_at', -1))

def get_posts_by_club(club_id, limit=10):
    from bson import ObjectId
    return list(mongo.db.posts.find({'club_id': ObjectId(club_id)}).sort('created_at', -1).limit(limit))

def insert_post(post_doc):
    return mongo.db.posts.insert_one(post_doc)

# --- USERS ---
def get_user_by_email(email):
    return mongo.db.users.find_one({'email': email})

def get_user_by_id(user_id):
    from bson import ObjectId
    return mongo.db.users.find_one({'_id': ObjectId(user_id)})

def insert_user(user_doc):
    return mongo.db.users.insert_one(user_doc)

# --- UTILITY ---
def clear_all_collections():
    """Clear all data (use with caution!)"""
    mongo.db.users.delete_many({})
    mongo.db.clubs.delete_many({})
    mongo.db.players.delete_many({})
    mongo.db.events.delete_many({})
    mongo.db.matches.delete_many({})
    mongo.db.posts.delete_many({})
    print("[DB] All collections cleared")

def get_stats():
    """Get database statistics"""
    return {
        'users': mongo.db.users.count_documents({}),
        'clubs': mongo.db.clubs.count_documents({}),
        'players': mongo.db.players.count_documents({}),
        'events': mongo.db.events.count_documents({}),
        'matches': mongo.db.matches.count_documents({}),
        'posts': mongo.db.posts.count_documents({})
    }
