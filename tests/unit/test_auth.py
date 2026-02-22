from tests.conftest import login


# ============================================================
# LOGIN
# ============================================================

def test_login_page_loads(client):
    """GET /login should return 200 with the login form."""
    response = client.get('/login')
    assert response.status_code == 200
    assert b"Connexion" in response.data


def test_login_with_invalid_credentials(client):
    """POST /login with bad credentials should show error message."""
    response = client.post('/login', data={
        'email': 'wrong@example.com',
        'password': 'wrongpassword'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"Email ou mot de passe incorrect" in response.data


def test_login_with_valid_credentials(client, seed_coach):
    """POST /login with valid credentials should redirect."""
    response = client.post('/login', data={
        'email': 'coach@test.com',
        'password': 'coach123'
    }, follow_redirects=False)
    assert response.status_code == 302


def test_login_sets_session(client, seed_admin):
    """Login should populate session with user data."""
    with client:
        login(client, 'admin@test.com', 'admin123')
        from flask import session
        assert session.get('user_id') == str(seed_admin['_id'])
        assert session.get('user_role') == 'admin'
        assert session.get('user_email') == 'admin@test.com'


# ============================================================
# LOGOUT
# ============================================================

def test_logout_clears_session(client, seed_admin):
    """Logout should clear session and redirect to homepage."""
    login(client, 'admin@test.com', 'admin123')
    response = client.get('/logout', follow_redirects=False)
    assert response.status_code == 302
    assert '/' in response.headers['Location']

    with client:
        client.get('/')
        from flask import session
        assert 'user_id' not in session


# ============================================================
# REGISTRATION
# ============================================================

def test_register_page_loads(client):
    """GET /register should return 200."""
    response = client.get('/register')
    assert response.status_code == 200


def test_register_new_user(client, app):
    """POST /register should create user and redirect to login."""
    response = client.post('/register', data={
        'email': 'newuser@test.com',
        'password': 'password123',
        'password_confirm': 'password123',
        'first_name': 'New',
        'last_name': 'User'
    }, follow_redirects=False)
    assert response.status_code == 302
    assert 'login' in response.headers['Location']

    from app.services.db import get_db
    with app.app_context():
        db = get_db()
        user = db.users.find_one({'email': 'newuser@test.com'})
        assert user is not None
        assert user['profile']['first_name'] == 'New'


def test_register_duplicate_email(client, seed_admin):
    """POST /register with existing email should show error."""
    response = client.post('/register', data={
        'email': 'admin@test.com',
        'password': 'password123',
        'password_confirm': 'password123',
        'first_name': 'Dup',
        'last_name': 'User'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"email est deja utilise" in response.data


def test_register_password_mismatch(client):
    """POST /register with mismatched passwords should show error."""
    response = client.post('/register', data={
        'email': 'mismatch@test.com',
        'password': 'password123',
        'password_confirm': 'differentpass',
        'first_name': 'Mis',
        'last_name': 'Match'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"mots de passe ne correspondent pas" in response.data


# ============================================================
# CLUB REGISTRATION
# ============================================================

def test_register_club_page_loads(client):
    """GET /register-club should return 200."""
    response = client.get('/register-club')
    assert response.status_code == 200


def test_register_club_creates_club_and_admin(client, app):
    """POST /register-club should create club + admin user and auto-login."""
    response = client.post('/register-club', data={
        'club_name': 'FC Nouveau',
        'city': 'Paris',
        'email': 'admin@fcnouveau.com',
        'password': 'admin123'
    }, follow_redirects=False)
    assert response.status_code == 302

    from app.services.db import get_db
    with app.app_context():
        db = get_db()
        club = db.clubs.find_one({'name': 'FC Nouveau'})
        assert club is not None
        user = db.users.find_one({'email': 'admin@fcnouveau.com'})
        assert user is not None
        assert user['role'] == 'admin'
        assert user['club_id'] == club['_id']


# ============================================================
# FORGOT PASSWORD
# ============================================================

def test_forgot_password_page_loads(client):
    """GET /forgot-password should return 200."""
    response = client.get('/forgot-password')
    assert response.status_code == 200


def test_forgot_password_creates_reset_token(client, app, seed_admin):
    """POST /forgot-password should create a reset token for existing user."""
    response = client.post('/forgot-password', data={
        'email': 'admin@test.com'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"lien de reinitialisation" in response.data

    from app.services.db import get_db
    with app.app_context():
        db = get_db()
        user = db.users.find_one({'email': 'admin@test.com'})
        assert user.get('reset_token') is not None
