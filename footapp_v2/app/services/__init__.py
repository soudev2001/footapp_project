# FootApp V2 - Services Package

from .db import mongo, init_db, get_db

# Service factory functions
def get_user_service():
    from .user_service import UserService
    return UserService(mongo.db)

def get_club_service():
    from .club_service import ClubService
    return ClubService(mongo.db)

def get_player_service():
    from .player_service import PlayerService
    return PlayerService(mongo.db)

def get_event_service():
    from .event_service import EventService
    return EventService(mongo.db)

def get_match_service():
    from .match_service import MatchService
    return MatchService(mongo.db)

def get_post_service():
    from .post_service import PostService
    return PostService(mongo.db)

# Role helpers
from .user_service import has_permission, get_nav_for_role, ROLE_PERMISSIONS
