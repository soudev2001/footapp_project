# FootLogic V2 - API Routes

from flask import Blueprint, jsonify, request
from app.models import serialize_doc, serialize_docs
from app.services import (
    get_player_service, get_club_service, get_event_service, 
    get_match_service, get_post_service
)

api_bp = Blueprint('api', __name__, url_prefix='/api')

# ============================================================
# PLAYERS API
# ============================================================

@api_bp.route('/players', methods=['GET'])
def get_players():
    """Get all players"""
    player_service = get_player_service()
    players = player_service.get_all()
    return jsonify({
        'success': True,
        'count': len(players),
        'data': serialize_docs(players)
    })

@api_bp.route('/players/<player_id>', methods=['GET'])
def get_player(player_id):
    """Get single player by ID"""
    player_service = get_player_service()
    player = player_service.get_by_id(player_id)
    if player:
        return jsonify({'success': True, 'data': serialize_doc(player)})
    return jsonify({'success': False, 'error': 'Player not found'}), 404

# ============================================================
# CLUBS API
# ============================================================

@api_bp.route('/clubs', methods=['GET'])
def get_clubs():
    """Get all clubs"""
    club_service = get_club_service()
    clubs = club_service.get_all()
    return jsonify({
        'success': True,
        'count': len(clubs),
        'data': serialize_docs(clubs)
    })

@api_bp.route('/clubs/<club_id>', methods=['GET'])
def get_club(club_id):
    """Get single club by ID"""
    club_service = get_club_service()
    club = club_service.get_by_id(club_id)
    if club:
        return jsonify({'success': True, 'data': serialize_doc(club)})
    return jsonify({'success': False, 'error': 'Club not found'}), 404

@api_bp.route('/clubs/<club_id>/players', methods=['GET'])
def get_club_players(club_id):
    """Get all players of a club"""
    player_service = get_player_service()
    players = player_service.get_by_club(club_id)
    return jsonify({
        'success': True,
        'count': len(players),
        'data': serialize_docs(players)
    })

# ============================================================
# EVENTS API
# ============================================================

@api_bp.route('/events', methods=['GET'])
def get_events():
    """Get all events"""
    event_service = get_event_service()
    events = event_service.get_all()
    return jsonify({
        'success': True,
        'count': len(events),
        'data': serialize_docs(events)
    })

@api_bp.route('/clubs/<club_id>/events', methods=['GET'])
def get_club_events(club_id):
    """Get events for a specific club"""
    event_service = get_event_service()
    events = event_service.get_by_club(club_id)
    return jsonify({
        'success': True,
        'count': len(events),
        'data': serialize_docs(events)
    })

# ============================================================
# MATCHES API
# ============================================================

@api_bp.route('/matches', methods=['GET'])
def get_matches():
    """Get all matches"""
    match_service = get_match_service()
    matches = match_service.get_all()
    return jsonify({
        'success': True,
        'count': len(matches),
        'data': serialize_docs(matches)
    })

@api_bp.route('/clubs/<club_id>/matches', methods=['GET'])
def get_club_matches(club_id):
    """Get matches for a specific club"""
    match_service = get_match_service()
    matches = match_service.get_by_club(club_id)
    return jsonify({
        'success': True,
        'count': len(matches),
        'data': serialize_docs(matches)
    })

# ============================================================
# POSTS API
# ============================================================

@api_bp.route('/posts', methods=['GET'])
def get_posts():
    """Get all posts"""
    post_service = get_post_service()
    posts = post_service.get_all()
    return jsonify({
        'success': True,
        'count': len(posts),
        'data': serialize_docs(posts)
    })

# ============================================================
# DATABASE UTILITIES (Development only)
# ============================================================

@api_bp.route('/seed', methods=['POST'])
def seed_database():
    """Seed database with demo data"""
    from app.services.seed_data import seed_all
    try:
        seed_all()
        return jsonify({'success': True, 'message': 'Database seeded successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/stats', methods=['GET'])
def get_db_stats():
    """Get database statistics"""
    from app.services.db import get_stats
    stats = get_stats()
    return jsonify({'success': True, 'data': stats})

@api_bp.route('/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'version': '2.0.0',
        'app': 'FootLogic V2'
    })

@api_bp.route('/auth/login', methods=['POST'])
def api_login():
    """Mock API login for Explorer testing"""
    data = request.json
    email = data.get('email', '').lower()
    # Simplified auth for demo explorer
    from app.services import get_user_service
    user_service = get_user_service()
    user = user_service.get_by_email(email)
    
    if user:
        # Generate a mock token (in a real app, use JWT)
        mock_token = f"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{str(user['_id'])}.{user['role']}"
        return jsonify({
            'success': True,
            'token': mock_token,
            'user': {
                'id': str(user['_id']),
                'role': user['role'],
                'email': user['email']
            }
        })
    return jsonify({'success': False, 'error': 'User not found'}), 404

