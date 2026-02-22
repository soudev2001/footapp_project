"""Tests for public routes (no auth required)."""


def test_homepage_loads(client):
    """GET / should return 200 with landing page."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"FootLogic" in response.data


def test_homepage_redirects_when_logged_in(admin_client):
    """GET / should redirect to app-home when logged in."""
    response = admin_client.get('/', follow_redirects=False)
    assert response.status_code == 302
    assert 'app-home' in response.headers['Location']


def test_ranking_page_loads(client):
    """GET /ranking should return 200."""
    response = client.get('/ranking')
    assert response.status_code == 200


def test_terms_page_loads(client):
    """GET /terms should return 200."""
    response = client.get('/terms')
    assert response.status_code == 200


def test_help_page_loads(client):
    """GET /help should return 200."""
    response = client.get('/help')
    assert response.status_code == 200


def test_404_page(client):
    """GET /nonexistent should return 404."""
    response = client.get('/this-route-does-not-exist')
    assert response.status_code == 404


def test_public_club_page(client, seed_club):
    """GET /public-club should return 200 with club info."""
    response = client.get(f'/public-club?club_id={seed_club["_id"]}')
    assert response.status_code == 200
