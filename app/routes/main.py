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
        from app.services import get_team_service, get_event_service, get_post_service, get_player_service, get_match_service
        team_service = get_team_service()
        event_service = get_event_service()
        post_service = get_post_service()
        player_service = get_player_service()
        match_service = get_match_service()
        club_id = session.get('club_id')
        
        teams = []
        upcoming_events = []
        recent_posts = []
        player_count = 0
        next_match = None
        match_stats = {'wins': 0, 'draws': 0, 'losses': 0, 'total': 0}
        
        if club_id:
            teams = team_service.get_by_club(club_id)
            
            # Player count
            all_players = player_service.get_by_club(club_id)
            player_count = len(all_players) if all_players else 0
            
            # Recent posts
            try:
                recent_posts = post_service.get_by_club(club_id)[:3]
            except Exception:
                recent_posts = []
            
            # Matches data
            try:
                all_matches = match_service.get_by_club(club_id)
                for m in all_matches:
                    if m.get('status') == 'completed':
                        match_stats['total'] += 1
                        score = m.get('score', {})
                        home = score.get('home', 0)
                        away = score.get('away', 0)
                        if m.get('is_home', True):
                            if home > away: match_stats['wins'] += 1
                            elif home < away: match_stats['losses'] += 1
                            else: match_stats['draws'] += 1
                        else:
                            if away > home: match_stats['wins'] += 1
                            elif away < home: match_stats['losses'] += 1
                            else: match_stats['draws'] += 1
                    elif m.get('status') == 'scheduled' and not next_match:
                        next_match = m
            except Exception:
                pass
            
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
            upcoming_events=upcoming_events,
            recent_posts=recent_posts,
            player_count=player_count,
            next_match=next_match,
            match_stats=match_stats
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
    
    from app.services import get_event_service, get_team_service
    from app.models import serialize_docs
    event_service = get_event_service()
    team_service = get_team_service()
    
    upcoming = event_service.get_upcoming(club_id, limit=50)
    past = event_service.get_past(club_id, limit=20)
    all_events = event_service.get_by_club(club_id)
    teams = team_service.get_by_club(club_id)
    
    # Serialize for JSON usage in calendar JS
    import json
    events_json = json.dumps(serialize_docs(all_events), default=str)
    
    return render_template('app/calendar.html', 
                         events=all_events,
                         upcoming=upcoming,
                         past=past,
                         teams=teams,
                         events_json=events_json)

@main_bp.route('/roster')
def roster():
    """Team roster"""
    from app.services import get_player_service, get_user_service
    club_id = session.get('club_id')
    players = []
    if club_id:
        player_service = get_player_service()
        user_service = get_user_service()
        raw_players = player_service.get_by_club(club_id)
        for p in raw_players:
            # Enrich with user profile if available
            if not p.get('profile'):
                user = user_service.get_by_id(str(p.get('user_id'))) if p.get('user_id') else None
                p['profile'] = user.get('profile', {'first_name': '', 'last_name': ''}) if user else {'first_name': p.get('name', ''), 'last_name': ''}
            if not p.get('stats'):
                p['stats'] = {'goals': 0, 'assists': 0, 'matches_played': 0, 'yellow_cards': 0, 'red_cards': 0}
            players.append(p)
    return render_template('app/roster.html', players=players)

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
