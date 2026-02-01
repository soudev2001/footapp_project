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

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Registration page"""
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
        # TODO: Implement password reset logic
        flash('Si cet email existe, un lien de reinitialisation a ete envoye.', 'info')
    
    return render_template('auth/forgot_password.html')
