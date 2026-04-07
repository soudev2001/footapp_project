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

def get_notification_service():
    from .notification_service import NotificationService
    return NotificationService(mongo.db)

def get_parent_link_service():
    from .parent_link_service import ParentLinkService
    return ParentLinkService(mongo.db)

def get_member_onboarding_service():
    from .member_onboarding_service import MemberOnboardingService
    return MemberOnboardingService(mongo.db)

def get_analytics_service():
    from .analytics_service import AnalyticsService
    return AnalyticsService(mongo.db)

def get_announcement_service():
    from .announcement_service import AnnouncementService
    return AnnouncementService(mongo.db)

def get_billing_service():
    from .billing_service import BillingService
    return BillingService(mongo.db)

def get_competition_service():
    from .competition_service import CompetitionService
    return CompetitionService(mongo.db)

def get_training_service():
    from .training_service import TrainingService
    return TrainingService(mongo.db)

def get_injury_service():
    from .injury_service import InjuryService
    return InjuryService(mongo.db)

def get_player_analytics_service():
    from .player_analytics_service import PlayerAnalyticsService
    return PlayerAnalyticsService(mongo.db)

def get_platform_management_service():
    from .platform_management_service import PlatformManagementService
    return PlatformManagementService(mongo.db)

def get_platform_analytics_service():
    from .platform_analytics_service import PlatformAnalyticsService
    return PlatformAnalyticsService(mongo.db)

def get_parent_monitoring_service():
    from .parent_monitoring_service import ParentMonitoringService
    return ParentMonitoringService(mongo.db)

def get_fan_engagement_service():
    from .fan_engagement_service import FanEngagementService
    return FanEngagementService(mongo.db)

def get_media_service():
    from .media_service import MediaService
    return MediaService(mongo.db)

# Role helpers
from .user_service import has_permission, get_nav_for_role, ROLE_PERMISSIONS
