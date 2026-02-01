# FootApp V2 - API Routes

from flask import Blueprint, jsonify, request
from app.models import serialize_doc, serialize_docs

api_bp = Blueprint('api', __name__, url_prefix='/api')

# ============================================================
# PLAYERS API
# ============================================================

@api_bp.route('/players', methods=['GET'])
def get_players():
    """Get all players"""
    from app.services.db import get_all_players
    players = get_all_players()
    return jsonify({
        'success': True,
        'count': len(players),
        'data': serialize_docs(players)
    })

@api_bp.route('/players/<player_id>', methods=['GET'])
def get_player(player_id):
    """Get single player by ID"""
    from app.services.db import get_player_by_id
    player = get_player_by_id(player_id)
    if player:
        return jsonify({'success': True, 'data': serialize_doc(player)})
    return jsonify({'success': False, 'error': 'Player not found'}), 404

# ============================================================
# CLUBS API
# ============================================================

@api_bp.route('/clubs', methods=['GET'])
def get_clubs():
    """Get all clubs"""
    from app.services.db import get_all_clubs
    clubs = get_all_clubs()
    return jsonify({
        'success': True,
        'count': len(clubs),
        'data': serialize_docs(clubs)
    })

@api_bp.route('/clubs/<club_id>', methods=['GET'])
def get_club(club_id):
    """Get single club by ID"""
    from app.services.db import get_club_by_id
    club = get_club_by_id(club_id)
    if club:
        return jsonify({'success': True, 'data': serialize_doc(club)})
    return jsonify({'success': False, 'error': 'Club not found'}), 404

@api_bp.route('/clubs/<club_id>/players', methods=['GET'])
def get_club_players(club_id):
    """Get all players of a club"""
    from app.services.db import get_players_by_club
    players = get_players_by_club(club_id)
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
    from app.services.db import get_all_events
    events = get_all_events()
    return jsonify({
        'success': True,
        'count': len(events),
        'data': serialize_docs(events)
    })

@api_bp.route('/clubs/<club_id>/events', methods=['GET'])
def get_club_events(club_id):
    """Get events for a specific club"""
    from app.services.db import get_events_by_club
    events = get_events_by_club(club_id)
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
    from app.services.db import get_all_matches
    matches = get_all_matches()
    return jsonify({
        'success': True,
        'count': len(matches),
        'data': serialize_docs(matches)
    })

@api_bp.route('/clubs/<club_id>/matches', methods=['GET'])
def get_club_matches(club_id):
    """Get matches for a specific club"""
    from app.services.db import get_matches_by_club
    matches = get_matches_by_club(club_id)
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
    from app.services.db import get_all_posts
    posts = get_all_posts()
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
        'app': 'FootApp V2'
    })
