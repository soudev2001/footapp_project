"""Tests for UserService."""
from app.services.db import get_db


def get_service(app):
    with app.app_context():
        from app.services import get_user_service
        return get_user_service()


def test_create_user(app):
    """UserService.create should insert a user with hashed password."""
    with app.app_context():
        svc = get_service(app)
        user = svc.create('test@example.com', 'pass123', role='coach')
        assert user['email'] == 'test@example.com'
        assert user['role'] == 'coach'
        assert user['account_status'] == 'active'
        assert 'password_hash' in user


def test_get_by_email(app):
    """UserService.get_by_email should find the user."""
    with app.app_context():
        svc = get_service(app)
        svc.create('find@test.com', 'pass123')
        found = svc.get_by_email('find@test.com')
        assert found is not None
        assert found['email'] == 'find@test.com'


def test_get_by_email_not_found(app):
    """UserService.get_by_email should return None for unknown email."""
    with app.app_context():
        svc = get_service(app)
        assert svc.get_by_email('ghost@test.com') is None


def test_verify_password_valid(app):
    """verify_password should return user for correct credentials."""
    with app.app_context():
        svc = get_service(app)
        svc.create('auth@test.com', 'secret123')
        user = svc.verify_password('auth@test.com', 'secret123')
        assert user is not None
        assert user['email'] == 'auth@test.com'


def test_verify_password_invalid(app):
    """verify_password should return None for wrong password."""
    with app.app_context():
        svc = get_service(app)
        svc.create('auth@test.com', 'secret123')
        assert svc.verify_password('auth@test.com', 'wrong') is None


def test_create_pending_user(app):
    """create_pending_user should create user with invitation token."""
    with app.app_context():
        svc = get_service(app)
        user = svc.create_pending_user('pending@test.com', role='player')
        assert user['account_status'] == 'pending'
        assert user['invitation_token'] is not None


def test_update_profile(app):
    """update_profile should modify user profile data."""
    with app.app_context():
        svc = get_service(app)
        user = svc.create('profile@test.com', 'pass123')
        svc.update_profile(str(user['_id']), {'first_name': 'Updated', 'last_name': 'Name'})
        updated = svc.get_by_id(str(user['_id']))
        assert updated['profile']['first_name'] == 'Updated'


def test_get_by_id(app):
    """get_by_id should return user by ObjectId string."""
    with app.app_context():
        svc = get_service(app)
        user = svc.create('byid@test.com', 'pass123')
        found = svc.get_by_id(str(user['_id']))
        assert found['email'] == 'byid@test.com'


def test_delete_user(app):
    """delete should remove user from DB."""
    with app.app_context():
        svc = get_service(app)
        user = svc.create('delete@test.com', 'pass123')
        svc.delete(str(user['_id']))
        assert svc.get_by_email('delete@test.com') is None


def test_get_users_by_role(app):
    """get_users_by_role should filter by role."""
    with app.app_context():
        svc = get_service(app)
        svc.create('coach1@test.com', 'p', role='coach')
        svc.create('coach2@test.com', 'p', role='coach')
        svc.create('player@test.com', 'p', role='player')
        coaches = svc.get_users_by_role('coach')
        assert len(coaches) == 2


def test_get_members_by_club(app, seed_club, seed_admin, seed_coach):
    """get_members_by_club should return users linked to the club."""
    with app.app_context():
        svc = get_service(app)
        members = svc.get_members_by_club(str(seed_club['_id']))
        assert len(members) >= 2
