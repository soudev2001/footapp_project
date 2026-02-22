"""Tests for admin routes."""
from tests.conftest import login


# ============================================================
# ACCESS CONTROL
# ============================================================

def test_admin_panel_requires_login(client):
    """GET /admin/ should redirect to login when not authenticated."""
    response = client.get('/admin/', follow_redirects=False)
    assert response.status_code == 302
    assert 'login' in response.headers['Location']


def test_admin_panel_forbidden_for_player(player_client):
    """GET /admin/ should redirect non-admin users."""
    response = player_client.get('/admin/', follow_redirects=False)
    assert response.status_code in (302, 403)


def test_admin_panel_accessible_for_admin(admin_client):
    """GET /admin/ should return 200 for admin users."""
    response = admin_client.get('/admin/')
    assert response.status_code == 200


# ============================================================
# ADMIN PANEL
# ============================================================

def test_admin_panel_shows_club_info(admin_client):
    """Admin panel should display club data."""
    response = admin_client.get('/admin/panel')
    assert response.status_code == 200
    assert b"FC Test" in response.data


def test_admin_seed_page(admin_client):
    """GET /admin/seed should return 200."""
    response = admin_client.get('/admin/seed')
    assert response.status_code == 200


# ============================================================
# MEMBER MANAGEMENT
# ============================================================

def test_admin_add_member(admin_client, app):
    """POST /admin/add-member should create a new user."""
    response = admin_client.post('/admin/add-member', data={
        'email': 'newcoach@test.com',
        'role': 'coach',
        'first_name': 'Nouveau',
        'last_name': 'Coach'
    }, follow_redirects=False)
    assert response.status_code == 302

    from app.services.db import get_db
    with app.app_context():
        db = get_db()
        user = db.users.find_one({'email': 'newcoach@test.com'})
        assert user is not None


# ============================================================
# TEAM MANAGEMENT
# ============================================================

def test_admin_add_team(admin_client, app):
    """POST /admin/teams/add should create a team."""
    response = admin_client.post('/admin/teams/add', data={
        'name': 'Equipe B',
        'category': 'U19',
        'description': 'Equipe reserve',
        'primary_color': '#ff0000',
        'secondary_color': '#0000ff'
    }, follow_redirects=False)
    assert response.status_code == 302

    from app.services.db import get_db
    with app.app_context():
        db = get_db()
        team = db.teams.find_one({'name': 'Equipe B'})
        assert team is not None
