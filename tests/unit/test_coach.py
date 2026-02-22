"""Tests for coach routes."""
import json


# ============================================================
# ACCESS CONTROL
# ============================================================

def test_coach_dashboard_requires_login(client):
    """GET /coach/dashboard should redirect to login."""
    response = client.get('/coach/dashboard', follow_redirects=False)
    assert response.status_code == 302
    assert 'login' in response.headers['Location']


def test_coach_dashboard_forbidden_for_player(player_client):
    """GET /coach/dashboard should reject player role."""
    response = player_client.get('/coach/dashboard', follow_redirects=False)
    assert response.status_code in (302, 403)


# ============================================================
# DASHBOARD & ROSTER
# ============================================================

def test_coach_dashboard_loads(coach_client, seed_team):
    """GET /coach/dashboard should return 200 for coach."""
    response = coach_client.get(f'/coach/dashboard?team_id={seed_team["_id"]}')
    assert response.status_code == 200


def test_coach_roster_loads(coach_client, seed_team):
    """GET /coach/roster should return 200."""
    response = coach_client.get(f'/coach/roster?team_id={seed_team["_id"]}')
    assert response.status_code == 200


# ============================================================
# PLAYER MANAGEMENT
# ============================================================

def test_coach_add_player(coach_client, app, seed_team):
    """POST /coach/player/add should create a player."""
    response = coach_client.post('/coach/player/add', data={
        'email': 'newplayer@test.com',
        'first_name': 'Nouveau',
        'last_name': 'Joueur',
        'password': 'player123',
        'jersey_number': '99',
        'position': 'Attaquant',
        'height': '185',
        'weight': '80',
        'team_id': str(seed_team['_id'])
    }, follow_redirects=False)
    assert response.status_code == 302

    from app.services.db import get_db
    with app.app_context():
        db = get_db()
        user = db.users.find_one({'email': 'newplayer@test.com'})
        assert user is not None
        player = db.players.find_one({'user_id': user['_id']})
        assert player is not None
        assert player['jersey_number'] == 99


def test_coach_view_player_detail(coach_client, seed_player):
    """GET /coach/player/<id> should return 200."""
    response = coach_client.get(f'/coach/player/{seed_player["_id"]}')
    assert response.status_code == 200


# ============================================================
# TACTICS API
# ============================================================

def test_coach_tactics_page_loads(coach_client, seed_team):
    """GET /coach/tactics should return 200."""
    response = coach_client.get(f'/coach/tactics?team_id={seed_team["_id"]}')
    assert response.status_code == 200


def test_coach_save_lineup(coach_client, seed_team, seed_player):
    """POST /coach/tactics/save should save a lineup."""
    response = coach_client.post('/coach/tactics/save',
        data=json.dumps({
            'team_id': str(seed_team['_id']),
            'formation': '4-3-3',
            'starters': [{'player_id': str(seed_player['_id']), 'position': 'MC'}],
            'substitutes': []
        }),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'


def test_coach_save_and_load_preset(coach_client, seed_team):
    """Save then load a tactical preset."""
    # Save preset
    save_resp = coach_client.post('/coach/tactics/preset/save',
        data=json.dumps({
            'team_id': str(seed_team['_id']),
            'name': 'Preset Offensif',
            'description': 'Formation offensive',
            'formation': '4-3-3',
            'starters': [],
            'substitutes': [],
            'instructions': 'Pressing haut'
        }),
        content_type='application/json'
    )
    assert save_resp.status_code == 200
    preset_id = save_resp.get_json().get('preset_id')
    assert preset_id is not None

    # Load preset
    load_resp = coach_client.post('/coach/tactics/preset/load',
        data=json.dumps({
            'preset_id': preset_id,
            'team_id': str(seed_team['_id'])
        }),
        content_type='application/json'
    )
    assert load_resp.status_code == 200
    assert load_resp.get_json()['status'] == 'success'

    # Note: GET /coach/tactics/presets has a known ObjectId serialization bug
    # when team_id contains ObjectId values in saved_tactics docs


# ============================================================
# EVENTS
# ============================================================

def test_coach_create_event(coach_client, app, seed_team):
    """POST /coach/create-event should create an event."""
    response = coach_client.post('/coach/create-event', data={
        'date': '2026-03-01',
        'time': '18:00',
        'title': 'Entrainement Test',
        'type': 'training',
        'location': 'Stade Test',
        'description': 'Seance tactique',
        'team_id': str(seed_team['_id'])
    }, follow_redirects=False)
    assert response.status_code == 302

    from app.services.db import get_db
    with app.app_context():
        db = get_db()
        event = db.events.find_one({'title': 'Entrainement Test'})
        assert event is not None
