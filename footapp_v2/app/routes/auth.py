# FootApp V2 - Authentication Routes

from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# ============================================================
# AUTH HELPERS
# ============================================================

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Veuillez vous connecter.', 'warning')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(*roles):
    """Decorator to require specific roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_role' not in session:
                flash('Acces non autorise.', 'error')
                return redirect(url_for('auth.login'))
            if session['user_role'] not in roles and 'admin' not in session['user_role']:
                flash('Vous n\'avez pas les permissions necessaires.', 'error')
                return redirect(url_for('main.index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ============================================================
# AUTH ROUTES
# ============================================================

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        from app.services import get_user_service
        user_service = get_user_service()
        user = user_service.verify_password(email, password)
        
        if user:
            session['user_id'] = str(user['_id'])
            session['user_role'] = user['role']
            session['user_email'] = user['email']
            session['user_profile'] = user.get('profile', {})
            session['club_id'] = str(user['club_id']) if user.get('club_id') else None
            
            # Redirect based on role
            if user['role'] == 'admin':
                return redirect(url_for('admin.admin_panel'))
            elif user['role'] == 'coach':
                return redirect(url_for('main.dashboard'))
            else:
                return redirect(url_for('main.app_home'))
        else:
            flash('Email ou mot de passe incorrect.', 'error')
    
    return render_template('auth/login.html')

@auth_bp.route('/register-club', methods=['GET', 'POST'])
def register_club():
    """Club registration page (SaaS entry)"""
    if request.method == 'POST':
        club_name = request.form.get('club_name')
        city = request.form.get('city')
        email = request.form.get('email')
        password = request.form.get('password')
        
        from app.services import get_user_service, get_club_service
        user_service = get_user_service()
        club_service = get_club_service()
        
        # Check if email exists
        if user_service.get_by_email(email):
            flash('Cet email est deja utilise.', 'error')
            return redirect(url_for('auth.register_club'))
            
        # 1. Create Club
        club = club_service.create(club_name, city=city)
        club_id = club['_id']
        
        # 2. Create Admin User
        profile = {
            'first_name': 'Admin',
            'last_name': club_name,
            'avatar': '',
            'phone': ''
        }
        user = user_service.create(email, password, role='admin', club_id=club_id, profile=profile)
        
        # 3. Auto-login
        session['user_id'] = str(user['_id'])
        session['user_role'] = user['role']
        session['user_email'] = user['email']
        session['user_profile'] = user.get('profile', {})
        session['club_id'] = str(user['club_id'])
        
        flash(f'Bienvenue ! Le club {club_name} a été créé avec succès.', 'success')
        return redirect(url_for('admin.admin_panel'))
        
    return render_template('auth/register_club.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """User registration page (Default for Fans/Players)"""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        password_confirm = request.form.get('password_confirm')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        
        if password != password_confirm:
            flash('Les mots de passe ne correspondent pas.', 'error')
            return render_template('auth/register.html')
        
        from app.services import get_user_service
        user_service = get_user_service()
        
        # Check if email exists
        if user_service.get_by_email(email):
            flash('Cet email est deja utilise.', 'error')
            return render_template('auth/register.html')
        
        # Create user
        profile = {
            'first_name': first_name,
            'last_name': last_name,
            'avatar': '',
            'phone': ''
        }
        user = user_service.create(email, password, role='fan', profile=profile)
        
        flash('Inscription reussie! Connectez-vous.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html')

@auth_bp.route('/logout')
def logout():
    """Logout"""
    session.clear()
    flash('Vous etes deconnecte.', 'info')
    return redirect(url_for('main.index'))

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Forgot password page"""
    if request.method == 'POST':
        email = request.form.get('email')
        
        from app.services import get_user_service
        from app.services.db import get_db
        import secrets
        from datetime import datetime, timedelta
        
        user_service = get_user_service()
        user = user_service.get_by_email(email)
        
        if user:
            # Generate reset token
            token = secrets.token_urlsafe(32)
            expiry = datetime.utcnow() + timedelta(hours=1)
            
            # Store token in database
            db = get_db()
            db.users.update_one(
                {'email': email},
                {'$set': {
                    'reset_token': token,
                    'reset_token_expiry': expiry
                }}
            )
            
            # In production, send email with reset link
            # For demo, we'll just flash the token info
            reset_url = url_for('auth.reset_password', token=token, _external=True)
            print(f"[DEBUG] Password reset link: {reset_url}")
        
        # Always show same message for security (don't reveal if email exists)
        flash('Si cet email existe, un lien de reinitialisation a ete envoye.', 'info')
    
    return render_template('auth/forgot_password.html')

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Reset password with token"""
    from app.services.db import get_db
    from werkzeug.security import generate_password_hash
    from datetime import datetime
    
    db = get_db()
    user = db.users.find_one({
        'reset_token': token,
        'reset_token_expiry': {'$gt': datetime.utcnow()}
    })
    
    if not user:
        flash('Le lien de reinitialisation est invalide ou a expire.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        password_confirm = request.form.get('password_confirm')
        
        if password != password_confirm:
            flash('Les mots de passe ne correspondent pas.', 'error')
            return render_template('auth/reset_password.html', token=token)
        
        if len(password) < 6:
            flash('Le mot de passe doit contenir au moins 6 caracteres.', 'error')
            return render_template('auth/reset_password.html', token=token)
        
        # Update password and clear token
        db.users.update_one(
            {'_id': user['_id']},
            {
                '$set': {'password_hash': generate_password_hash(password)},
                '$unset': {'reset_token': '', 'reset_token_expiry': ''}
            }
        )
        
        flash('Mot de passe reinitialise avec succes! Connectez-vous.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/reset_password.html', token=token)
