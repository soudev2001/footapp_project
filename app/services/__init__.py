# FootLogic V2 - Services Package

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

def get_contract_service():
    from .contract_service import ContractService
    return ContractService(mongo.db)

def get_isy_service():
    from .isy_service import IsyService
    return IsyService()

def get_team_service():
    from .team_service import TeamService
    return TeamService()

def get_subscription_service():
    from .subscription_service import SubscriptionService
    return SubscriptionService(mongo.db)

def get_shop_service():
    from .shop_service import ShopService
    return ShopService(mongo.db)

def get_project_service():
    from .project_service import ProjectService
    return ProjectService()

# Role helpers
from .user_service import has_permission, get_nav_for_role, ROLE_PERMISSIONS

