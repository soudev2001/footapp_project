"""Tests for ContractService, PostService, MessagingService, TeamService, SubscriptionService."""
from bson import ObjectId
from datetime import datetime


# ============================================================
# CONTRACT SERVICE
# ============================================================

def test_create_contract_offer(app, seed_club, seed_player_user):
    """create_offer should create a pending contract."""
    with app.app_context():
        from app.services import get_contract_service
        svc = get_contract_service()
        contract = svc.create_offer(
            club_id=str(seed_club['_id']),
            user_id=str(seed_player_user['_id']),
            role='player',
            salary=2000
        )
        assert contract['status'] == 'pending'
        assert contract['salary'] == 2000


def test_get_pending_by_user(app, seed_club, seed_player_user):
    """get_pending_by_user should return pending offers."""
    with app.app_context():
        from app.services import get_contract_service
        svc = get_contract_service()
        svc.create_offer(str(seed_club['_id']), str(seed_player_user['_id']), 'player')
        pending = svc.get_pending_by_user(str(seed_player_user['_id']))
        assert len(pending) == 1


def test_respond_to_offer_accept(app, seed_club, seed_player_user):
    """respond_to_offer with 'active' should accept contract."""
    with app.app_context():
        from app.services import get_contract_service
        svc = get_contract_service()
        contract = svc.create_offer(str(seed_club['_id']), str(seed_player_user['_id']), 'player')
        updated = svc.respond_to_offer(str(contract['_id']), 'active')
        assert updated['status'] == 'active'


def test_respond_to_offer_reject(app, seed_club, seed_player_user):
    """respond_to_offer with 'rejected' should reject contract."""
    with app.app_context():
        from app.services import get_contract_service
        svc = get_contract_service()
        contract = svc.create_offer(str(seed_club['_id']), str(seed_player_user['_id']), 'player')
        updated = svc.respond_to_offer(str(contract['_id']), 'rejected')
        assert updated['status'] == 'rejected'


# ============================================================
# POST SERVICE
# ============================================================

def test_create_post(app, seed_club, seed_admin):
    """create should insert a post."""
    with app.app_context():
        from app.services import get_post_service
        svc = get_post_service()
        post = svc.create(
            club_id=str(seed_club['_id']),
            author_id=str(seed_admin['_id']),
            title='Test Post',
            content='Contenu du post'
        )
        assert post['title'] == 'Test Post'


def test_like_and_unlike(app, seed_club, seed_admin):
    """like/unlike should increment/decrement likes."""
    with app.app_context():
        from app.services import get_post_service
        svc = get_post_service()
        post = svc.create(str(seed_club['_id']), str(seed_admin['_id']), 'Likeable', 'Content')
        svc.like(str(post['_id']))
        svc.like(str(post['_id']))
        updated = svc.get_by_id(str(post['_id']))
        assert updated['likes'] == 2

        svc.unlike(str(post['_id']))
        updated = svc.get_by_id(str(post['_id']))
        assert updated['likes'] == 1


def test_add_comment(app, seed_club, seed_admin):
    """add_comment should push a comment to the post."""
    with app.app_context():
        from app.services import get_post_service
        svc = get_post_service()
        post = svc.create(str(seed_club['_id']), str(seed_admin['_id']), 'Commentable', 'Content')
        svc.add_comment(str(post['_id']), str(seed_admin['_id']), 'Super post!')
        updated = svc.get_by_id(str(post['_id']))
        assert len(updated['comments']) == 1
        assert updated['comments'][0]['text'] == 'Super post!'


def test_search_posts(app, seed_club, seed_admin):
    """search should find posts by title/content regex."""
    with app.app_context():
        from app.services import get_post_service
        svc = get_post_service()
        svc.create(str(seed_club['_id']), str(seed_admin['_id']), 'Match Report', 'Victoire 3-0')
        svc.create(str(seed_club['_id']), str(seed_admin['_id']), 'News', 'Nouveau joueur')
        results = svc.search(str(seed_club['_id']), 'match')
        assert len(results) == 1


def test_get_by_category(app, seed_club, seed_admin):
    """get_by_category should filter posts."""
    with app.app_context():
        from app.services import get_post_service
        svc = get_post_service()
        svc.create(str(seed_club['_id']), str(seed_admin['_id']), 'News1', 'C', category='news')
        svc.create(str(seed_club['_id']), str(seed_admin['_id']), 'Report', 'C', category='match_report')
        news = svc.get_by_category(str(seed_club['_id']), 'news')
        assert all(p['category'] == 'news' for p in news)


# ============================================================
# MESSAGING SERVICE
# ============================================================

def test_send_direct_message(app, seed_admin, seed_coach):
    """send_message should create a message document."""
    with app.app_context():
        from app.services import get_notification_service
        from app.services.messaging_service import MessagingService
        from app.services.db import get_db
        svc = MessagingService(get_db())
        msg = svc.send_message(
            sender_id=str(seed_admin['_id']),
            content='Hello coach!',
            receiver_id=str(seed_coach['_id']),
            msg_type='direct'
        )
        assert msg is not None


def test_get_direct_messages(app, seed_admin, seed_coach):
    """get_direct_messages should return DM history."""
    with app.app_context():
        from app.services.messaging_service import MessagingService
        from app.services.db import get_db
        svc = MessagingService(get_db())
        svc.send_message(str(seed_admin['_id']), 'Msg 1', receiver_id=str(seed_coach['_id']))
        svc.send_message(str(seed_coach['_id']), 'Reply', receiver_id=str(seed_admin['_id']))
        msgs = svc.get_direct_messages(str(seed_admin['_id']), str(seed_coach['_id']))
        assert len(msgs) == 2


# ============================================================
# TEAM SERVICE
# ============================================================

def test_create_team(app, seed_club):
    """TeamService.create should insert a team."""
    with app.app_context():
        from app.services import get_team_service
        svc = get_team_service()
        team = svc.create(
            club_id=str(seed_club['_id']),
            name='Equipe Test',
            category='U19'
        )
        assert team is not None


def test_get_by_club(app, seed_club, seed_team):
    """get_by_club should return teams for the club."""
    with app.app_context():
        from app.services import get_team_service
        svc = get_team_service()
        teams = svc.get_by_club(str(seed_club['_id']))
        assert len(teams) >= 1


def test_delete_team(app, seed_club):
    """delete should remove team."""
    with app.app_context():
        from app.services import get_team_service
        svc = get_team_service()
        team = svc.create(str(seed_club['_id']), 'ToDelete', 'Senior')
        svc.delete(str(team['_id']))
        assert svc.get_by_id(str(team['_id'])) is None


# ============================================================
# SUBSCRIPTION SERVICE
# ============================================================

def test_get_plans(app):
    """get_plans should return available plans."""
    with app.app_context():
        from app.services import get_subscription_service
        svc = get_subscription_service()
        plans = svc.get_plans()
        assert 'pack_pro' in plans
        assert 'pass_elite' in plans


def test_update_subscription(app, seed_club):
    """update_subscription should set club plan."""
    with app.app_context():
        from app.services import get_subscription_service
        svc = get_subscription_service()
        svc.update_subscription(str(seed_club['_id']), 'pass_elite')
        status = svc.get_subscription_status(str(seed_club['_id']))
        assert status is not None
        assert status['plan_id'] == 'pass_elite'


def test_calculate_monthly_bill(app, seed_club):
    """calculate_monthly_bill should compute billing."""
    with app.app_context():
        from app.services import get_subscription_service
        svc = get_subscription_service()
        svc.update_subscription(str(seed_club['_id']), 'pack_pro')
        bill = svc.calculate_monthly_bill(str(seed_club['_id']))
        assert bill is not None
        assert 'total_monthly' in bill
        assert bill['base_price'] > 0
