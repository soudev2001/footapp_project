import pytest
from bson import ObjectId
from datetime import datetime
from werkzeug.security import generate_password_hash
from app import create_app
from app.services.db import get_db


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    app = create_app('testing')
    yield app


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Flask CLI test runner."""
    return app.test_cli_runner()


@pytest.fixture(autouse=True)
def clean_db(app):
    """Clear test collections before each test."""
    with app.app_context():
        db = get_db()
        for name in db.list_collection_names():
            db[name].delete_many({})
    yield
    with app.app_context():
        db = get_db()
        for name in db.list_collection_names():
            db[name].delete_many({})


# ============================================================
# DATA SEED HELPERS
# ============================================================

@pytest.fixture
def db(app):
    """Direct database access within app context."""
    with app.app_context():
        yield get_db()


@pytest.fixture
def seed_club(app):
    """Create a test club and return its data."""
    with app.app_context():
        db = get_db()
        club_id = ObjectId()
        club = {
            '_id': club_id,
            'name': 'FC Test',
            'city': 'TestVille',
            'colors': {'primary': '#84cc16', 'secondary': '#facc15'},
            'logo': '',
            'stadium': 'Stade Test',
            'founded_year': 2020,
            'description': 'Club de test',
            'created_at': datetime.utcnow()
        }
        db.clubs.insert_one(club)
        return club


@pytest.fixture
def seed_team(app, seed_club):
    """Create a test team linked to the test club."""
    with app.app_context():
        db = get_db()
        team_id = ObjectId()
        team = {
            '_id': team_id,
            'name': 'Equipe A',
            'club_id': seed_club['_id'],
            'category': 'Senior',
            'colors': {'primary': '#84cc16', 'secondary': '#facc15'},
            'description': 'Equipe principale',
            'created_at': datetime.utcnow()
        }
        db.teams.insert_one(team)
        return team


def _create_user(app, email, password, role, club_id=None, team_id=None, status='active'):
    """Internal helper to create a user in the test DB."""
    with app.app_context():
        db = get_db()
        user_id = ObjectId()
        user = {
            '_id': user_id,
            'email': email,
            'password_hash': generate_password_hash(password),
            'role': role,
            'roles': [role],
            'club_id': club_id,
            'team_id': team_id,
            'created_at': datetime.utcnow(),
            'account_status': status,
            'profile': {
                'first_name': role.capitalize(),
                'last_name': 'User',
                'avatar': '',
                'phone': ''
            }
        }
        db.users.insert_one(user)
        return user


@pytest.fixture
def seed_admin(app, seed_club):
    """Create an admin user linked to the test club."""
    return _create_user(app, 'admin@test.com', 'admin123', 'admin', seed_club['_id'])


@pytest.fixture
def seed_coach(app, seed_club):
    """Create a coach user linked to the test club."""
    return _create_user(app, 'coach@test.com', 'coach123', 'coach', seed_club['_id'])


@pytest.fixture
def seed_player_user(app, seed_club, seed_team):
    """Create a player user linked to the test club and team."""
    return _create_user(app, 'player@test.com', 'player123', 'player', seed_club['_id'], seed_team['_id'])


@pytest.fixture
def seed_player(app, seed_club, seed_team, seed_player_user):
    """Create a player document in the players collection."""
    with app.app_context():
        db = get_db()
        player_id = ObjectId()
        player = {
            '_id': player_id,
            'name': 'Player User',
            'club_id': seed_club['_id'],
            'team_id': seed_team['_id'],
            'user_id': seed_player_user['_id'],
            'jersey_number': 10,
            'position': 'Milieu',
            'status': 'active',
            'height': 180,
            'weight': 75,
            'technical_ratings': {'VIT': 70, 'TIR': 65, 'PAS': 80, 'DRI': 75, 'DEF': 50, 'PHY': 70},
            'stats': {'goals': 5, 'assists': 3, 'matches_played': 12},
            'created_at': datetime.utcnow()
        }
        db.players.insert_one(player)
        return player


# ============================================================
# LOGIN HELPERS
# ============================================================

def login(client, email, password):
    """Login helper that returns the response."""
    return client.post('/login', data={
        'email': email,
        'password': password
    }, follow_redirects=True)


@pytest.fixture
def admin_client(client, seed_admin):
    """A client logged in as admin."""
    login(client, 'admin@test.com', 'admin123')
    return client


@pytest.fixture
def coach_client(client, seed_coach):
    """A client logged in as coach."""
    login(client, 'coach@test.com', 'coach123')
    return client


@pytest.fixture
def player_client(client, seed_player_user):
    """A client logged in as player."""
    login(client, 'player@test.com', 'player123')
    return client
