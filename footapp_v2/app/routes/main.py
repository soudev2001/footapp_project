# FootApp V2 - Main Routes (Public Pages)

from flask import Blueprint, render_template, session

main_bp = Blueprint('main', __name__)

# ============================================================
# PUBLIC PAGES
# ============================================================

@main_bp.route('/')
def index():
    """Landing page"""
    return render_template('public/index.html')

@main_bp.route('/nav-demo')
def nav_demo():
    """Navigation demo - shows all routes"""
    return render_template('nav_demo.html')

@main_bp.route('/public-club')
def public_club():
    """Public club page"""
    return render_template('public/club.html')

@main_bp.route('/ranking')
def ranking():
    """Public ranking page"""
    return render_template('public/ranking.html')

@main_bp.route('/terms')
def terms():
    """Terms and conditions"""
    return render_template('public/terms.html')

@main_bp.route('/help')
def help():
    """Help page"""
    return render_template('public/help.html')

@main_bp.route('/404')
def page_404():
    """404 error page"""
    return render_template('errors/404.html')

# ============================================================
# APP PAGES (require login but accessible to all roles)
# ============================================================

@main_bp.route('/app-home')
def app_home():
    """App home - redirects based on role"""
    role = session.get('user_role', 'fan')
    if role == 'admin':
        return render_template('admin/panel.html')
    elif role == 'coach':
        return render_template('coach/dashboard.html')
    elif role == 'player':
        return render_template('player/home.html')
    else:
        return render_template('app/home.html')

@main_bp.route('/dashboard')
def dashboard():
    """Dashboard - role-based"""
    role = session.get('user_role', 'fan')
    if role in ['admin', 'coach']:
        return render_template('coach/dashboard.html')
    return render_template('app/home.html')

@main_bp.route('/feed')
def feed():
    """News feed"""
    return render_template('app/feed.html')

@main_bp.route('/calendar')
def calendar():
    """Calendar view"""
    return render_template('app/calendar.html')

@main_bp.route('/roster')
def roster():
    """Team roster"""
    return render_template('app/roster.html')

@main_bp.route('/profile')
def profile():
    """User profile"""
    return render_template('app/profile.html')

@main_bp.route('/edit-profile')
def edit_profile():
    """Edit profile"""
    return render_template('app/edit_profile.html')

@main_bp.route('/settings')
def settings():
    """Settings page"""
    return render_template('app/settings.html')

@main_bp.route('/notifications')
def notifications():
    """Notifications"""
    return render_template('app/notifications.html')

@main_bp.route('/documents')
def documents():
    """Documents"""
    return render_template('app/documents.html')

@main_bp.route('/gallery')
def gallery():
    """Photo gallery"""
    return render_template('app/gallery.html')

# ============================================================
# MESSAGING
# ============================================================

@main_bp.route('/chat-inbox')
def chat_inbox():
    """Chat inbox"""
    return render_template('app/chat_inbox.html')

@main_bp.route('/chat-conversation')
def chat_conversation():
    """Chat conversation"""
    return render_template('app/chat_conversation.html')

# ============================================================
# COACH/ADMIN PAGES
# ============================================================

@main_bp.route('/admin-panel')
def admin_panel():
    """Admin panel"""
    return render_template('admin/panel.html')

@main_bp.route('/attendance')
def attendance():
    """Attendance management"""
    return render_template('coach/attendance.html')

@main_bp.route('/tactics')
def tactics():
    """Tactics board"""
    return render_template('coach/tactics.html')

@main_bp.route('/match-center')
def match_center():
    """Match center"""
    return render_template('coach/match_center.html')

@main_bp.route('/create-event')
def create_event():
    """Create event form"""
    return render_template('coach/create_event.html')

@main_bp.route('/create-post')
def create_post():
    """Create post form"""
    return render_template('app/create_post.html')

@main_bp.route('/event-training')
def event_training():
    """Training event detail"""
    return render_template('app/event_training.html')

@main_bp.route('/architecture')
def architecture():
    """System architecture"""
    return render_template('admin/architecture.html')

# ============================================================
# COMMERCE
# ============================================================

@main_bp.route('/shop-product')
def shop_product():
    """Product page"""
    return render_template('shop/product.html')

@main_bp.route('/checkout')
def checkout():
    """Checkout page"""
    return render_template('shop/checkout.html')

@main_bp.route('/invoice')
def invoice():
    """Invoice page"""
    return render_template('shop/invoice.html')

@main_bp.route('/reservations')
def reservations():
    """Reservations page"""
    return render_template('shop/reservations.html')
