"""Tests for player routes."""
from tests.conftest import login


# ============================================================
# ACCESS CONTROL
# ============================================================

def test_player_home_requires_login(client):
    """GET /player/home should redirect to login."""
    response = client.get('/player/home', follow_redirects=False)
    assert response.status_code == 302
    assert 'login' in response.headers['Location']


# ============================================================
# PLAYER PAGES
# ============================================================

def test_player_home_loads(player_client):
    """GET /player/home should return 200 for logged-in player."""
    response = player_client.get('/player/home')
    assert response.status_code == 200


def test_player_profile_loads(client, seed_player, seed_player_user):
    """GET /player/profile should return 200 when player doc exists."""
    login(client, 'player@test.com', 'player123')
    response = client.get('/player/profile')
    assert response.status_code == 200


def test_player_calendar_loads(player_client):
    """GET /player/calendar should return 200."""
    response = player_client.get('/player/calendar')
    assert response.status_code == 200


def test_player_contracts_loads(player_client):
    """GET /player/contracts should return 200."""
    response = player_client.get('/player/contracts')
    assert response.status_code == 200


# ============================================================
# PROFILE EDIT
# ============================================================

def test_player_edit_profile(player_client):
    """POST /player/profile/edit should update profile."""
    response = player_client.post('/player/profile/edit', data={
        'first_name': 'Updated',
        'last_name': 'Name',
        'phone': '+33600000000'
    }, follow_redirects=False)
    assert response.status_code == 302
    assert 'profile' in response.headers['Location']
