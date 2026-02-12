# FootLogic V2 - Main Routes (Public Pages)

from flask import Blueprint, render_template, session, redirect, url_for, request, flash
from app.routes.auth import login_required


main_bp = Blueprint('main', __name__)

# ============================================================
# PWA & ROOT ASSETS
# ============================================================

from flask import send_from_directory, current_app
import os

@main_bp.route('/sw.js')
@main_bp.route('/static/sw.js')
def service_worker():
    from flask import make_response
    response = make_response(send_from_directory(os.path.join(current_app.root_path, 'static'), 'sw.js'))
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@main_bp.route('/manifest.json')
def manifest():
    return send_from_directory(os.path.join(current_app.root_path, 'static'), 'manifest.json')

@main_bp.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(current_app.root_path, 'static', 'img', 'icons'), 'icon.svg')

@main_bp.route('/seed')
def seed_database():
    """Debug route to seed the database"""
    from app.services.seed_data import seed_all
    try:
        seed_all()
        return "Database seeded successfully! You can now login with admin@footlogic.fr / admin123"
    except Exception as e:
        return f"Error seeding database: {str(e)}"

# ============================================================
# PUBLIC PAGES
# ============================================================

@main_bp.route('/')
def index():
    """Landing page as default entry point"""
    if 'user_id' in session:
        return redirect(url_for('main.app_home'))
    
    return render_template('public/index.html')

@main_bp.route('/nav-demo')
def nav_demo():
    """Navigation demo - shows all routes"""
    return render_template('nav_demo.html')

@main_bp.route('/public-club')
def public_club():
    """Public club page"""
    from flask import request
    from app.services import get_club_service, get_match_service, get_post_service
    
    club_service = get_club_service()
    match_service = get_match_service()
    post_service = get_post_service()
    
    club_id = request.args.get('club_id')
    
    if club_id:
        club = club_service.get_by_id(club_id)
    else:
        # Default to first club for landing
        clubs = club_service.get_all()
        club = clubs[0] if clubs else None
    
    if not club:
        return redirect(url_for('main.index'))
    
    # Fetch related data
    club_id = club['_id']
    matches = match_service.get_by_club(club_id)
    posts = post_service.get_by_club(club_id)
    stats = club_service.get_stats(club_id)
    
    return render_template('public/club.html', club=club, matches=matches, posts=posts, stats=stats)

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

@main_bp.route('/offline')
def offline():
    """Offline fallback page for PWA"""
    return render_template('public/offline.html')

# ============================================================
# APP PAGES (require login but accessible to all roles)
# ============================================================

@main_bp.route('/app-home')
def app_home():
    """App home - redirects to correct blueprint routes to ensure data loading"""
    role = session.get('user_role', 'fan')
    if role == 'admin':
        return redirect(url_for('admin.admin_panel'))
    elif role == 'coach':
        return redirect(url_for('coach.dashboard'))
    elif role == 'player':
        return redirect(url_for('player.home'))
    else:
        # Fan or other stays on the main app home
        from app.services import get_team_service, get_event_service, get_post_service, get_player_service
        team_service = get_team_service()
        event_service = get_event_service()
        post_service = get_post_service()
        club_id = session.get('club_id')
        
        teams = []
        upcoming_events = []
        if club_id:
            teams = team_service.get_by_club(club_id)
            
        # Selected team for fan (could be stored in session or query)
        selected_team_id = request.args.get('team_id')
        if not selected_team_id and teams:
            # Default to first team for now or none
            selected_team_id = str(teams[0]['_id'])
            
        if club_id:
            upcoming_events = event_service.get_upcoming(club_id, team_id=selected_team_id, limit=3)
        
        return render_template('app/home.html', 
            teams=teams, 
            selected_team_id=selected_team_id,
            upcoming_events=upcoming_events
        )

@main_bp.route('/dashboard')
def dashboard():
    """Dashboard - role-based redirect"""
    return redirect(url_for('main.app_home'))

@main_bp.route('/feed')
def feed():
    """News feed"""
    return render_template('app/feed.html')

@main_bp.route('/calendar')
@login_required
def calendar():
    """Calendar view"""
    club_id = session.get('club_id')
    if not club_id:
        return redirect(url_for('main.app_home')) or redirect(url_for('main.index'))
    
    from app.services import get_event_service
    event_service = get_event_service()
    events = event_service.get_upcoming(club_id, limit=30)
    
    return render_template('app/calendar.html', events=events)

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
@main_bp.route('/navigation_diagram')
def architecture():
    """System architecture"""
    return render_template('admin/architecture.html')

@main_bp.route('/match/<match_id>/live')
def match_live(match_id):
    """Public live match view"""
    from app.services import get_match_service
    match_service = get_match_service()
    
    match = match_service.get_by_id(match_id)
    if not match:
        return redirect(url_for('main.index'))
        
    from datetime import datetime
    return render_template('match/live.html', match=match, now=datetime.now().strftime("%d/%m/%Y %H:%M"))

# ============================================================
# COMMERCE
# ============================================================

@main_bp.route('/shop')
def shop_catalog():
    """Shop catalog page"""
    from app.services import get_shop_service
    shop_service = get_shop_service()
    
    category = request.args.get('category')
    products = shop_service.get_all_products(category=category)
    categories = shop_service.get_categories()
    
    return render_template('shop/catalog.html', products=products, categories=categories, selected_category=category)

@main_bp.route('/shop/product/<product_id>')
def shop_product(product_id):
    """Product detail page"""
    from app.services import get_shop_service
    shop_service = get_shop_service()
    
    product = shop_service.get_product_by_id(product_id)
    if not product:
        return redirect(url_for('main.shop_catalog'))
        
    related_products = shop_service.get_all_products(category=product.get('category'))[:4]
    
    return render_template('shop/product.html', product=product, related_products=related_products)

@main_bp.route('/shop/cart')
def cart():
    """View cart"""
    return render_template('shop/cart.html')

@main_bp.route('/checkout', methods=['GET', 'POST'])
@login_required
def checkout():
    """Checkout page"""
    if request.method == 'POST':
        # Simulated order processing
        flash('Commande validée ! Merci pour votre achat.', 'success')
        return redirect(url_for('main.app_home'))
        
    return render_template('shop/checkout.html')

@main_bp.route('/orders')
@login_required
def orders():
    """User orders history"""
    from app.services import get_shop_service
    shop_service = get_shop_service()
    user_id = session.get('user_id')
    
    orders = shop_service.get_user_orders(user_id)
    return render_template('shop/orders.html', orders=orders)
