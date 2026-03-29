# FootLogic V2 - API Routes (Real JWT + Complete Endpoints)

import jwt
import os
import datetime
from flask import Blueprint, jsonify, request, current_app, render_template
from app.models import serialize_doc, serialize_docs
from app.services import (
    get_player_service, get_club_service, get_event_service,
    get_match_service, get_post_service, get_user_service,
    get_team_service, get_notification_service, get_contract_service,
    get_shop_service, get_project_service, get_parent_link_service,
    get_subscription_service, get_isy_service
)
from app.services.messaging_service import MessagingService
from app.services.db import mongo
from functools import wraps
from bson import ObjectId

api_bp = Blueprint('api', __name__, url_prefix='/api')


# ============================================================
# JWT HELPERS
# ============================================================

def generate_token(user, expires_hours=None):
    """Generate a signed JWT token for a user."""
    if expires_hours is None:
        expires_hours = current_app.config.get('JWT_EXPIRATION_HOURS', 24)
    payload = {
        'user_id': str(user['_id']),
        'email': user.get('email', ''),
        'role': user.get('role', 'fan'),
        'club_id': str(user.get('club_id', '')) if user.get('club_id') else None,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=expires_hours),
        'iat': datetime.datetime.utcnow(),
        'type': 'access'
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')


def generate_refresh_token(user):
    """Generate a longer-lived refresh token."""
    days = current_app.config.get('JWT_REFRESH_EXPIRATION_DAYS', 30)
    payload = {
        'user_id': str(user['_id']),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=days),
        'iat': datetime.datetime.utcnow(),
        'type': 'refresh'
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')


def token_required(f):
    """Decorator that requires a valid JWT Bearer token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({'success': False, 'message': 'Token is missing!'}), 401

        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            if payload.get('type') == 'refresh':
                return jsonify({'success': False, 'message': 'Cannot use refresh token for API calls'}), 401
            request.current_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Token is invalid!'}), 401

        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    """Decorator that requires specific user roles."""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            user_role = request.current_user.get('role', '')
            if user_role == 'admin' or user_role in roles:
                return f(*args, **kwargs)
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        return decorated
    return decorator


# ============================================================
# AUTH ENDPOINTS
# ============================================================

@api_bp.route('/auth/login', methods=['POST'])
def api_login():
    """Authenticate user and return JWT tokens."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Request body required'}), 400

    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password required'}), 400

    user_service = get_user_service()
    user = user_service.verify_password(email, password)

    if not user:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    access_token = generate_token(user)
    refresh_token = generate_refresh_token(user)

    profile = user.get('profile', {})
    return jsonify({
        'success': True,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'role': user.get('role', 'fan'),
            'club_id': str(user.get('club_id', '')) if user.get('club_id') else None,
            'profile': {
                'first_name': profile.get('first_name', ''),
                'last_name': profile.get('last_name', ''),
                'avatar': profile.get('avatar', ''),
                'phone': profile.get('phone', ''),
            }
        }
    })


@api_bp.route('/auth/register', methods=['POST'])
def api_register():
    """Register a new user and return JWT tokens."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Request body required'}), 400

    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'fan')
    club_id = data.get('club_id')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password required'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400

    user_service = get_user_service()
    existing = user_service.get_by_email(email)
    if existing:
        return jsonify({'success': False, 'error': 'Email already registered'}), 409

    profile = {
        'first_name': data.get('first_name', ''),
        'last_name': data.get('last_name', ''),
        'phone': data.get('phone', ''),
    }

    user_id = user_service.create(email, password, role=role, club_id=club_id, profile=profile)
    user = user_service.get_by_id(user_id)

    access_token = generate_token(user)
    refresh_token = generate_refresh_token(user)

    return jsonify({
        'success': True,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'role': user.get('role', 'fan'),
            'club_id': str(user.get('club_id', '')) if user.get('club_id') else None,
        }
    }), 201


@api_bp.route('/auth/refresh', methods=['POST'])
def api_refresh():
    """Refresh access token using a valid refresh token."""
    data = request.get_json()
    refresh = data.get('refresh_token') if data else None
    if not refresh:
        return jsonify({'success': False, 'error': 'Refresh token required'}), 400

    try:
        payload = jwt.decode(refresh, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        if payload.get('type') != 'refresh':
            return jsonify({'success': False, 'error': 'Invalid token type'}), 401
    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'error': 'Refresh token expired, please login again'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'error': 'Invalid refresh token'}), 401

    user_service = get_user_service()
    user = user_service.get_by_id(payload['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    access_token = generate_token(user)
    return jsonify({
        'success': True,
        'access_token': access_token
    })


@api_bp.route('/auth/me', methods=['GET'])
@token_required
def api_me():
    """Get current authenticated user profile."""
    user_service = get_user_service()
    user = user_service.get_by_id(request.current_user['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    profile = user.get('profile', {})
    player_service = get_player_service()
    player = player_service.get_by_user(str(user['_id']))

    result = {
        'id': str(user['_id']),
        'email': user['email'],
        'role': user.get('role', 'fan'),
        'club_id': str(user.get('club_id', '')) if user.get('club_id') else None,
        'profile': {
            'first_name': profile.get('first_name', ''),
            'last_name': profile.get('last_name', ''),
            'avatar': profile.get('avatar', ''),
            'phone': profile.get('phone', ''),
        }
    }

    if player:
        result['player'] = serialize_doc(player)

    return jsonify({'success': True, 'data': result})


# ============================================================
# PLAYER ENDPOINTS
# ============================================================

@api_bp.route('/player/profile', methods=['GET'])
@token_required
def get_player_profile():
    """Get current player's full profile."""
    player_service = get_player_service()
    player = player_service.get_by_user(request.current_user['user_id'])
    if not player:
        return jsonify({'success': False, 'error': 'Player profile not found'}), 404
    return jsonify({'success': True, 'data': serialize_doc(player)})


@api_bp.route('/player/profile', methods=['PUT'])
@token_required
def update_player_profile():
    """Update current user profile."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    user_service = get_user_service()
    user_service.update_profile(request.current_user['user_id'], data)
    return jsonify({'success': True, 'message': 'Profile updated'})


@api_bp.route('/player/stats', methods=['GET'])
@token_required
def get_player_stats():
    """Get current player's stats."""
    player_service = get_player_service()
    player = player_service.get_by_user(request.current_user['user_id'])
    if not player:
        return jsonify({'success': False, 'error': 'Player not found'}), 404

    return jsonify({
        'success': True,
        'data': {
            'stats': player.get('stats', {}),
            'technical_ratings': player.get('technical_ratings', {}),
            'physical_records': player.get('physical_records', []),
        }
    })


@api_bp.route('/player/contracts', methods=['GET'])
@token_required
def get_player_contracts():
    """Get current player's contracts."""
    contract_service = get_contract_service()
    contracts = contract_service.get_by_user(request.current_user['user_id'])
    return jsonify({
        'success': True,
        'data': serialize_docs(contracts)
    })


@api_bp.route('/player/contracts/<contract_id>/respond', methods=['POST'])
@token_required
def respond_contract(contract_id):
    """Accept or reject a contract offer."""
    data = request.get_json()
    action = data.get('action') if data else None
    if action not in ('active', 'rejected'):
        return jsonify({'success': False, 'error': 'action must be active or rejected'}), 400
    contract_service = get_contract_service()
    contract_service.respond_to_offer(contract_id, action)
    return jsonify({'success': True, 'message': f'Contract {action}'})


# ============================================================
# PLAYERS API (public / coach)
# ============================================================

@api_bp.route('/players', methods=['GET'])
def get_players():
    """Get all players (optionally filtered by club_id query param)."""
    club_id = request.args.get('club_id')
    team_id = request.args.get('team_id')
    player_service = get_player_service()

    if club_id:
        players = player_service.get_by_club(club_id, team_id=team_id)
    else:
        players = player_service.get_all()

    return jsonify({
        'success': True,
        'count': len(players),
        'data': serialize_docs(players)
    })


@api_bp.route('/players/<player_id>', methods=['GET'])
def get_player(player_id):
    """Get single player by ID."""
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
    """Get all clubs."""
    club_service = get_club_service()
    clubs = club_service.get_all()
    return jsonify({
        'success': True,
        'count': len(clubs),
        'data': serialize_docs(clubs)
    })


@api_bp.route('/clubs/<club_id>', methods=['GET'])
def get_club(club_id):
    """Get single club by ID."""
    club_service = get_club_service()
    club = club_service.get_by_id(club_id)
    if club:
        return jsonify({'success': True, 'data': serialize_doc(club)})
    return jsonify({'success': False, 'error': 'Club not found'}), 404


@api_bp.route('/clubs/<club_id>/stats', methods=['GET'])
def get_club_stats(club_id):
    """Get club statistics."""
    club_service = get_club_service()
    stats = club_service.get_stats(club_id)
    return jsonify({'success': True, 'data': stats})


@api_bp.route('/clubs/<club_id>/players', methods=['GET'])
def get_club_players(club_id):
    """Get all players of a club."""
    team_id = request.args.get('team_id')
    player_service = get_player_service()
    players = player_service.get_by_club(club_id, team_id=team_id)
    return jsonify({
        'success': True,
        'count': len(players),
        'data': serialize_docs(players)
    })


# ============================================================
# TEAM ENDPOINTS
# ============================================================

@api_bp.route('/teams', methods=['GET'])
@token_required
def get_teams():
    """Get teams for current user's club."""
    club_id = request.current_user.get('club_id')
    if not club_id:
        return jsonify({'success': True, 'data': []})
    team_service = get_team_service()
    teams = team_service.get_by_club(club_id)
    return jsonify({'success': True, 'data': serialize_docs(teams)})


@api_bp.route('/teams/<team_id>', methods=['GET'])
@token_required
def get_team(team_id):
    """Get team details."""
    team_service = get_team_service()
    team = team_service.get_by_id(team_id)
    if not team:
        return jsonify({'success': False, 'error': 'Team not found'}), 404
    return jsonify({'success': True, 'data': serialize_doc(team)})


@api_bp.route('/teams/<team_id>/players', methods=['GET'])
@token_required
def get_team_players(team_id):
    """Get players of a specific team."""
    team_service = get_team_service()
    players = team_service.get_players(team_id)
    return jsonify({
        'success': True,
        'count': len(players),
        'data': serialize_docs(players)
    })


# ============================================================
# EVENTS / CALENDAR API
# ============================================================

@api_bp.route('/events', methods=['GET'])
def get_events():
    """Get events. Filter by club_id, team_id, type query params."""
    club_id = request.args.get('club_id')
    event_type = request.args.get('type')
    event_service = get_event_service()

    if club_id and event_type:
        events = event_service.get_by_type(club_id, event_type)
    elif club_id:
        events = event_service.get_by_club(club_id)
    else:
        events = event_service.get_all()

    return jsonify({
        'success': True,
        'count': len(events),
        'data': serialize_docs(events)
    })


@api_bp.route('/events/<event_id>', methods=['GET'])
def get_event(event_id):
    """Get single event."""
    event_service = get_event_service()
    event = event_service.get_by_id(event_id)
    if event:
        return jsonify({'success': True, 'data': serialize_doc(event)})
    return jsonify({'success': False, 'error': 'Event not found'}), 404


@api_bp.route('/calendar/upcoming', methods=['GET'])
@token_required
def get_calendar_upcoming():
    """Get upcoming events + matches for current user's club."""
    club_id = request.current_user.get('club_id')
    team_id = request.args.get('team_id')
    limit = request.args.get('limit', 20, type=int)

    if not club_id:
        return jsonify({'success': True, 'data': {'events': [], 'matches': []}})

    event_service = get_event_service()
    match_service = get_match_service()

    events = event_service.get_upcoming(club_id, team_id=team_id, limit=limit)
    matches = match_service.get_upcoming(club_id, team_id=team_id, limit=limit)

    return jsonify({
        'success': True,
        'data': {
            'events': serialize_docs(events),
            'matches': serialize_docs(matches),
        }
    })


@api_bp.route('/events/<event_id>/rsvp', methods=['POST'])
@token_required
def update_rsvp(event_id):
    """RSVP to an event (present/absent/uncertain)."""
    data = request.get_json()
    status = data.get('status') if data else None
    if status not in ('present', 'absent', 'uncertain'):
        return jsonify({'success': False, 'error': 'Status must be present, absent, or uncertain'}), 400

    event_service = get_event_service()
    player_service = get_player_service()
    player = player_service.get_by_user(request.current_user['user_id'])
    player_id = str(player['_id']) if player else request.current_user['user_id']

    event_service.set_attendance(event_id, player_id, status)
    return jsonify({'success': True, 'message': f'RSVP updated to {status}'})


@api_bp.route('/events/<event_id>/attendance', methods=['GET'])
@token_required
def get_event_attendance(event_id):
    """Get attendance list for an event."""
    event_service = get_event_service()
    attendance = event_service.get_attendance_list(event_id)
    return jsonify({'success': True, 'data': serialize_docs(attendance)})


# ============================================================
# MATCHES API
# ============================================================

@api_bp.route('/matches', methods=['GET'])
def get_matches():
    """Get matches. Filter by club_id query param."""
    club_id = request.args.get('club_id')
    match_service = get_match_service()

    if club_id:
        matches = match_service.get_by_club(club_id)
    else:
        matches = match_service.get_all()

    return jsonify({
        'success': True,
        'count': len(matches),
        'data': serialize_docs(matches)
    })


@api_bp.route('/matches/upcoming', methods=['GET'])
@token_required
def get_upcoming_matches():
    """Get upcoming matches for current user's club."""
    club_id = request.current_user.get('club_id')
    team_id = request.args.get('team_id')
    limit = request.args.get('limit', 10, type=int)

    if not club_id:
        return jsonify({'success': True, 'data': []})

    match_service = get_match_service()
    matches = match_service.get_upcoming(club_id, team_id=team_id, limit=limit)
    return jsonify({'success': True, 'data': serialize_docs(matches)})


@api_bp.route('/matches/results', methods=['GET'])
@token_required
def get_match_results():
    """Get completed matches."""
    club_id = request.current_user.get('club_id')
    team_id = request.args.get('team_id')
    limit = request.args.get('limit', 10, type=int)

    if not club_id:
        return jsonify({'success': True, 'data': []})

    match_service = get_match_service()
    matches = match_service.get_completed(club_id, team_id=team_id, limit=limit)
    return jsonify({'success': True, 'data': serialize_docs(matches)})


@api_bp.route('/matches/<match_id>', methods=['GET'])
def get_match(match_id):
    """Get single match details."""
    match_service = get_match_service()
    match = match_service.get_by_id(match_id)
    if not match:
        return jsonify({'success': False, 'error': 'Match not found'}), 404
    return jsonify({'success': True, 'data': serialize_doc(match)})


@api_bp.route('/matches/<match_id>/lineup', methods=['GET'])
def get_match_lineup(match_id):
    """Get match lineup."""
    match_service = get_match_service()
    lineup = match_service.get_lineup(match_id)
    return jsonify({'success': True, 'data': serialize_docs(lineup) if lineup else []})


@api_bp.route('/matches/season-stats', methods=['GET'])
@token_required
def get_season_stats():
    """Get season stats for current club."""
    club_id = request.current_user.get('club_id')
    team_id = request.args.get('team_id')
    if not club_id:
        return jsonify({'success': True, 'data': {}})
    match_service = get_match_service()
    stats = match_service.get_season_stats(club_id, team_id=team_id)
    return jsonify({'success': True, 'data': stats})


# ============================================================
# POSTS / FEED API
# ============================================================

@api_bp.route('/posts', methods=['GET'])
def get_posts():
    """Get posts. Filter by club_id query param."""
    club_id = request.args.get('club_id')
    category = request.args.get('category')
    limit = request.args.get('limit', 20, type=int)
    post_service = get_post_service()

    if club_id and category:
        posts = post_service.get_by_category(club_id, category, limit=limit)
    elif club_id:
        posts = post_service.get_by_club(club_id, limit=limit)
    else:
        posts = post_service.get_all(limit=limit)

    return jsonify({
        'success': True,
        'count': len(posts),
        'data': serialize_docs(posts)
    })


@api_bp.route('/posts/<post_id>', methods=['GET'])
def get_post(post_id):
    """Get single post."""
    post_service = get_post_service()
    post = post_service.get_by_id(post_id)
    if post:
        return jsonify({'success': True, 'data': serialize_doc(post)})
    return jsonify({'success': False, 'error': 'Post not found'}), 404


@api_bp.route('/posts/<post_id>/like', methods=['POST'])
@token_required
def like_post(post_id):
    """Like a post."""
    post_service = get_post_service()
    post_service.like(post_id)
    return jsonify({'success': True, 'message': 'Post liked'})


@api_bp.route('/posts/<post_id>/comment', methods=['POST'])
@token_required
def comment_post(post_id):
    """Add a comment to a post."""
    data = request.get_json()
    text = data.get('text') if data else None
    if not text:
        return jsonify({'success': False, 'error': 'Comment text required'}), 400
    post_service = get_post_service()
    post_service.add_comment(post_id, request.current_user['user_id'], text)
    return jsonify({'success': True, 'message': 'Comment added'})


@api_bp.route('/posts/search', methods=['GET'])
@token_required
def search_posts():
    """Search posts."""
    club_id = request.current_user.get('club_id')
    query = request.args.get('q', '')
    if not club_id or not query:
        return jsonify({'success': True, 'data': []})
    post_service = get_post_service()
    posts = post_service.search(club_id, query)
    return jsonify({'success': True, 'data': serialize_docs(posts)})


# ============================================================
# MESSAGING API
# ============================================================

@api_bp.route('/messages/conversations', methods=['GET'])
@token_required
def get_conversations():
    """Get conversation previews for current user."""
    club_id = request.current_user.get('club_id')
    user_id = request.current_user['user_id']
    svc = MessagingService(mongo.db)
    previews = svc.get_last_messages_preview(user_id, club_id)
    return jsonify({'success': True, 'data': serialize_docs(previews)})


@api_bp.route('/messages/direct/<other_user_id>', methods=['GET'])
@token_required
def get_direct_messages(other_user_id):
    """Get direct message history with another user."""
    limit = request.args.get('limit', 50, type=int)
    svc = MessagingService(mongo.db)
    messages = svc.get_direct_messages(request.current_user['user_id'], other_user_id, limit=limit)
    return jsonify({'success': True, 'data': serialize_docs(messages)})


@api_bp.route('/messages/team/<team_id>', methods=['GET'])
@token_required
def get_team_messages(team_id):
    """Get team chat messages."""
    limit = request.args.get('limit', 50, type=int)
    svc = MessagingService(mongo.db)
    messages = svc.get_team_messages(team_id, limit=limit)
    return jsonify({'success': True, 'data': serialize_docs(messages)})


@api_bp.route('/messages/channel/<channel_id>', methods=['GET'])
@token_required
def get_channel_messages(channel_id):
    """Get channel messages."""
    limit = request.args.get('limit', 50, type=int)
    svc = MessagingService(mongo.db)
    messages = svc.get_channel_messages(channel_id, limit=limit)
    return jsonify({'success': True, 'data': serialize_docs(messages)})


@api_bp.route('/messages/send', methods=['POST'])
@token_required
def send_message():
    """Send a message (direct, team, or channel)."""
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({'success': False, 'error': 'Content required'}), 400

    svc = MessagingService(mongo.db)
    msg_id = svc.send_message(
        sender_id=request.current_user['user_id'],
        content=data['content'],
        receiver_id=data.get('receiver_id'),
        team_id=data.get('team_id'),
        msg_type=data.get('type', 'direct'),
        channel_id=data.get('channel_id'),
    )
    return jsonify({'success': True, 'message_id': str(msg_id)}), 201


@api_bp.route('/messages/<message_id>/read', methods=['POST'])
@token_required
def mark_message_read(message_id):
    """Mark a message as read."""
    svc = MessagingService(mongo.db)
    svc.mark_as_read(message_id, request.current_user['user_id'])
    return jsonify({'success': True})


@api_bp.route('/messages/unread-count', methods=['GET'])
@token_required
def get_unread_count():
    """Get unread messages count."""
    svc = MessagingService(mongo.db)
    count = svc.get_unread_count(request.current_user['user_id'])
    return jsonify({'success': True, 'count': count})


@api_bp.route('/messages/channels', methods=['GET'])
@token_required
def get_channels():
    """Get channels for current user's club."""
    club_id = request.current_user.get('club_id')
    if not club_id:
        return jsonify({'success': True, 'data': []})
    svc = MessagingService(mongo.db)
    channels = svc.get_channels(club_id, user_id=request.current_user['user_id'])
    return jsonify({'success': True, 'data': serialize_docs(channels)})


# ============================================================
# NOTIFICATIONS API
# ============================================================

@api_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications():
    """Get notifications for current user."""
    user_id = request.current_user['user_id']
    notifications = mongo.db.notifications.find(
        {'user_id': user_id}
    ).sort('created_at', -1).limit(50)
    return jsonify({'success': True, 'data': serialize_docs(list(notifications))})


@api_bp.route('/notifications/mark-read/<notification_id>', methods=['POST'])
@token_required
def mark_notification_read(notification_id):
    """Mark a notification as read."""
    mongo.db.notifications.update_one(
        {'_id': ObjectId(notification_id)},
        {'$set': {'read': True}}
    )
    return jsonify({'success': True})


@api_bp.route('/notifications/mark-all-read', methods=['POST'])
@token_required
def mark_all_notifications_read():
    """Mark all notifications as read for current user."""
    user_id = request.current_user['user_id']
    mongo.db.notifications.update_many(
        {'user_id': user_id, 'read': False},
        {'$set': {'read': True}}
    )
    return jsonify({'success': True})


@api_bp.route('/notifications/register-device', methods=['POST'])
@token_required
def register_device_token():
    """Register a device push notification token (FCM/Expo)."""
    data = request.get_json()
    push_token = data.get('push_token') or data.get('fcmToken') if data else None
    if not push_token:
        return jsonify({'success': False, 'error': 'push_token required'}), 400

    platform = data.get('platform', 'expo')
    user_id = request.current_user['user_id']

    mongo.db.device_tokens.update_one(
        {'user_id': user_id, 'token': push_token},
        {'$set': {
            'user_id': user_id,
            'token': push_token,
            'platform': platform,
            'updated_at': datetime.datetime.utcnow()
        }},
        upsert=True
    )
    return jsonify({'success': True, 'message': 'Device token registered'})


# ============================================================
# COACH ENDPOINTS
# ============================================================

@api_bp.route('/coach/dashboard', methods=['GET'])
@role_required('coach')
def coach_dashboard():
    """Get coach dashboard data."""
    club_id = request.current_user.get('club_id')
    team_id = request.args.get('team_id')

    if not club_id:
        return jsonify({'success': True, 'data': {}})

    player_service = get_player_service()
    match_service = get_match_service()
    event_service = get_event_service()

    players = player_service.get_by_club(club_id, team_id=team_id)
    upcoming_matches = match_service.get_upcoming(club_id, team_id=team_id, limit=5)
    upcoming_events = event_service.get_upcoming(club_id, team_id=team_id, limit=5)
    season_stats = match_service.get_season_stats(club_id, team_id=team_id)
    top_scorers = player_service.get_top_scorers(club_id, limit=5)

    injured = [p for p in players if p.get('status') == 'injured']

    return jsonify({
        'success': True,
        'data': {
            'total_players': len(players),
            'injured_players': serialize_docs(injured),
            'upcoming_matches': serialize_docs(upcoming_matches),
            'upcoming_events': serialize_docs(upcoming_events),
            'season_stats': season_stats,
            'top_scorers': serialize_docs(top_scorers),
        }
    })


@api_bp.route('/coach/roster', methods=['GET'])
@role_required('coach')
def coach_roster():
    """Get full roster for coach."""
    club_id = request.current_user.get('club_id')
    team_id = request.args.get('team_id')
    if not club_id:
        return jsonify({'success': True, 'data': []})
    player_service = get_player_service()
    players = player_service.get_by_club(club_id, team_id=team_id)
    return jsonify({'success': True, 'data': serialize_docs(players)})


@api_bp.route('/coach/convocation', methods=['POST'])
@role_required('coach')
def send_convocation():
    """Send convocation for a match/event."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400

    event_id = data.get('event_id')
    player_ids = data.get('player_ids', [])

    if not event_id or not player_ids:
        return jsonify({'success': False, 'error': 'event_id and player_ids required'}), 400

    notification_service = get_notification_service()
    event_service = get_event_service()
    event = event_service.get_by_id(event_id)

    for pid in player_ids:
        notification_service.create_notification(
            user_id=pid,
            title='Convocation',
            message=f'Vous \u00eates convoqu\u00e9 pour: {event.get("title", "\u00c9v\u00e9nement") if event else "\u00c9v\u00e9nement"}',
            type='convocation',
            link='/player/calendar'
        )
        event_service.set_attendance(event_id, pid, 'convoked')

    return jsonify({'success': True, 'message': f'{len(player_ids)} players convoked'})


@api_bp.route('/coach/lineup', methods=['GET'])
@role_required('coach')
def get_lineup():
    """Get active lineup."""
    club_id = request.current_user.get('club_id')
    team_id = request.args.get('team_id')
    if not club_id:
        return jsonify({'success': True, 'data': None})
    player_service = get_player_service()
    lineup = player_service.get_active_lineup(club_id, team_id)
    return jsonify({'success': True, 'data': serialize_doc(lineup) if lineup else None})


@api_bp.route('/coach/lineup', methods=['POST'])
@role_required('coach')
def save_lineup():
    """Save a lineup."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400

    club_id = request.current_user.get('club_id')
    player_service = get_player_service()
    result = player_service.save_lineup(
        club_id=club_id,
        formation=data.get('formation', '4-3-3'),
        starters=data.get('starters', []),
        team_id=data.get('team_id'),
        substitutes=data.get('substitutes', []),
        name=data.get('name', ''),
        captains=data.get('captains', []),
        set_pieces=data.get('set_pieces', {})
    )
    return jsonify({'success': True, 'data': str(result)})


@api_bp.route('/coach/tactics', methods=['GET'])
@role_required('coach')
def get_tactics():
    """Get saved tactic presets."""
    club_id = request.current_user.get('club_id')
    team_id = request.args.get('team_id')
    if not club_id:
        return jsonify({'success': True, 'data': []})
    player_service = get_player_service()
    tactics = player_service.get_tactic_presets(club_id, team_id)
    return jsonify({'success': True, 'data': serialize_docs(tactics)})


# ============================================================
# DATABASE UTILITIES (Development only)
# ============================================================

@api_bp.route('/seed', methods=['POST'])
def seed_database():
    """Seed database with demo data."""
    from app.services.seed_data import seed_all
    try:
        seed_all()
        return jsonify({'success': True, 'message': 'Database seeded successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/stats', methods=['GET'])
def get_db_stats():
    """Get database statistics."""
    from app.services.db import get_stats
    stats = get_stats()
    return jsonify({'success': True, 'data': stats})


@api_bp.route('/health', methods=['GET'])
def health_check():
    """API health check."""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'version': '2.0.0',
        'app': 'FootLogic V2'
    })


# ============================================================
# SWAGGER DOCS
# ============================================================

@api_bp.route('/docs')
def swagger_ui():
    """Serve Swagger UI for API Documentation."""
    return render_template('api/docs.html')


# ============================================================
# PLAYER EXTENDED ENDPOINTS
# ============================================================

@api_bp.route('/player/documents', methods=['GET'])
@token_required
def get_player_documents():
    """Get player documents (license, medical cert, ID)."""
    player_service = get_player_service()
    player = player_service.get_by_user(request.current_user['user_id'])
    if not player:
        return jsonify({'success': False, 'error': 'Player not found'}), 404
    docs = player.get('documents', {})
    return jsonify({'success': True, 'data': docs})


ALLOWED_DOC_TYPES = {'licence', 'medical_cert', 'id_card', 'insurance', 'photo'}
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}


@api_bp.route('/player/documents/<doc_type>', methods=['POST'])
@token_required
def upload_player_document(doc_type):
    """Upload a player document file."""
    if doc_type not in ALLOWED_DOC_TYPES:
        return jsonify({'success': False, 'error': 'Type de document invalide'}), 400

    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'Aucun fichier fourni'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'success': False, 'error': 'Nom de fichier vide'}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({'success': False, 'error': 'Extension non autorisée'}), 400

    player_service = get_player_service()
    player = player_service.get_by_user(request.current_user['user_id'])
    if not player:
        return jsonify({'success': False, 'error': 'Player not found'}), 404

    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'player_docs',
                              str(player['_id']))
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{doc_type}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    rel_url = f"/static/uploads/player_docs/{player['_id']}/{filename}"
    player_service.update_documents(str(player['_id']), doc_type, 'provided', rel_url)

    return jsonify({'success': True, 'data': {'url': rel_url, 'doc_type': doc_type}})


@api_bp.route('/player/evolution', methods=['GET'])
@token_required
def get_player_evolution():
    """Get player evolution data (ratings, physical history, evaluations)."""
    player_service = get_player_service()
    player = player_service.get_by_user(request.current_user['user_id'])
    if not player:
        return jsonify({'success': False, 'error': 'Player not found'}), 404
    return jsonify({
        'success': True,
        'data': {
            'technical_ratings': player.get('technical_ratings', {}),
            'physical_history': player.get('physical_history', []),
            'evaluations': player.get('evaluations', []),
            'stats': player.get('stats', {}),
        }
    })


# ============================================================
# COACH EXTENDED ENDPOINTS
# ============================================================

@api_bp.route('/coach/players', methods=['POST'])
@role_required('coach')
def coach_add_player():
    """Add a new player to the club."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400

    club_id = request.current_user.get('club_id')
    user_service = get_user_service()
    player_service = get_player_service()

    email = (data.get('email') or '').strip().lower()
    if email:
        existing = user_service.get_by_email(email)
        if existing:
            return jsonify({'success': False, 'error': 'Email already registered'}), 409

    profile = {
        'first_name': data.get('first_name', ''),
        'last_name': data.get('last_name', ''),
        'phone': data.get('phone', ''),
    }

    password = data.get('password', 'changeme123')
    user_id = user_service.create(email or f"player_{datetime.datetime.utcnow().timestamp()}@footapp.local",
                                   password, role='player', club_id=club_id, profile=profile)

    player_id = player_service.create(
        user_id=str(user_id),
        club_id=club_id,
        team_id=data.get('team_id'),
        jersey_number=data.get('jersey_number'),
        position=data.get('position', 'MID'),
        birth_date=data.get('birth_date'),
        photo=data.get('photo'),
    )
    return jsonify({'success': True, 'player_id': str(player_id)}), 201


@api_bp.route('/coach/players/<player_id>', methods=['PUT'])
@role_required('coach')
def coach_edit_player(player_id):
    """Edit player details."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    player_service = get_player_service()
    player_service.update(player_id, data)
    return jsonify({'success': True, 'message': 'Player updated'})


@api_bp.route('/coach/players/<player_id>', methods=['DELETE'])
@role_required('coach')
def coach_delete_player(player_id):
    """Remove player from roster."""
    player_service = get_player_service()
    player_service.delete(player_id)
    return jsonify({'success': True, 'message': 'Player removed'})


@api_bp.route('/coach/players/<player_id>/ratings', methods=['POST'])
@role_required('coach')
def coach_update_ratings(player_id):
    """Update player technical ratings."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    player_service = get_player_service()
    player_service.update_technical_ratings(player_id, data)
    return jsonify({'success': True, 'message': 'Ratings updated'})


@api_bp.route('/coach/players/<player_id>/evaluation', methods=['POST'])
@role_required('coach')
def coach_add_evaluation(player_id):
    """Add coach evaluation for a player."""
    data = request.get_json()
    if not data or not data.get('comment'):
        return jsonify({'success': False, 'error': 'Comment required'}), 400
    player_service = get_player_service()
    player_service.add_evaluation(player_id, {
        'coach_id': request.current_user['user_id'],
        'comment': data['comment'],
        'rating': data.get('rating'),
        'date': datetime.datetime.utcnow().isoformat(),
    })
    return jsonify({'success': True, 'message': 'Evaluation added'})


@api_bp.route('/coach/players/<player_id>/physical', methods=['POST'])
@role_required('coach')
def coach_add_physical(player_id):
    """Record physical metrics for a player."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    player_service = get_player_service()
    record = {
        'weight': data.get('weight'),
        'height': data.get('height'),
        'vma': data.get('vma'),
        'date': datetime.datetime.utcnow().isoformat(),
    }
    player_service.add_physical_record(player_id, record)
    return jsonify({'success': True, 'message': 'Physical record added'})


@api_bp.route('/coach/attendance/update', methods=['POST'])
@role_required('coach')
def coach_update_attendance():
    """Bulk update attendance for an event."""
    data = request.get_json()
    if not data or not data.get('event_id') or not data.get('attendance'):
        return jsonify({'success': False, 'error': 'event_id and attendance required'}), 400

    event_service = get_event_service()
    for item in data['attendance']:
        event_service.set_attendance(data['event_id'], item['player_id'], item['status'])
    return jsonify({'success': True, 'message': 'Attendance updated'})


@api_bp.route('/coach/events', methods=['POST'])
@role_required('coach')
def coach_create_event():
    """Create a new event (training, match, meeting)."""
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'success': False, 'error': 'Title required'}), 400

    club_id = request.current_user.get('club_id')
    event_service = get_event_service()
    event_id = event_service.create(
        club_id=club_id,
        team_id=data.get('team_id'),
        title=data['title'],
        event_type=data.get('type', 'training'),
        date=data.get('date'),
        end_date=data.get('end_date'),
        location=data.get('location', ''),
        description=data.get('description', ''),
    )
    return jsonify({'success': True, 'event_id': str(event_id)}), 201


@api_bp.route('/coach/events/<event_id>', methods=['PUT'])
@role_required('coach')
def coach_edit_event(event_id):
    """Edit an existing event."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    event_service = get_event_service()
    event_service.update(event_id, data)
    return jsonify({'success': True, 'message': 'Event updated'})


@api_bp.route('/coach/events/<event_id>', methods=['DELETE'])
@role_required('coach')
def coach_delete_event(event_id):
    """Delete an event."""
    event_service = get_event_service()
    event_service.delete(event_id)
    return jsonify({'success': True, 'message': 'Event deleted'})


@api_bp.route('/coach/matches/<match_id>/score', methods=['POST'])
@role_required('coach')
def coach_update_score(match_id):
    """Update match score."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    match_service = get_match_service()
    match_service.set_score(match_id, data.get('home', 0), data.get('away', 0),
                            status=data.get('status', 'in_progress'))
    return jsonify({'success': True, 'message': 'Score updated'})


@api_bp.route('/coach/matches/<match_id>/event', methods=['POST'])
@role_required('coach')
def coach_add_match_event(match_id):
    """Add match event (goal, card, substitution)."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    match_service = get_match_service()
    match_service.add_event(match_id, data)
    return jsonify({'success': True, 'message': 'Match event added'})


@api_bp.route('/coach/matches', methods=['POST'])
@role_required('coach')
def coach_create_match():
    """Create a new match."""
    data = request.get_json()
    if not data or not data.get('opponent'):
        return jsonify({'success': False, 'error': 'Opponent required'}), 400
    club_id = request.current_user.get('club_id')
    match_service = get_match_service()
    match_id = match_service.create(
        club_id=club_id,
        opponent=data['opponent'],
        date=data.get('date'),
        is_home=data.get('is_home', True),
        team_id=data.get('team_id'),
        competition=data.get('competition', ''),
        location=data.get('location', ''),
    )
    return jsonify({'success': True, 'match_id': str(match_id)}), 201


# ============================================================
# ADMIN ENDPOINTS
# ============================================================

@api_bp.route('/admin/dashboard', methods=['GET'])
@role_required('admin')
def admin_dashboard():
    """Get admin dashboard data."""
    club_id = request.current_user.get('club_id')
    if not club_id:
        return jsonify({'success': True, 'data': {}})

    user_service = get_user_service()
    team_service = get_team_service()
    player_service = get_player_service()
    event_service = get_event_service()
    match_service = get_match_service()

    members = user_service.get_by_club(club_id)
    teams = team_service.get_by_club(club_id)
    players = player_service.get_by_club(club_id)
    upcoming_events = event_service.get_upcoming(club_id, limit=5)
    club_service = get_club_service()
    club = club_service.get_by_id(club_id)

    role_counts = {}
    for m in members:
        r = m.get('role', 'fan')
        role_counts[r] = role_counts.get(r, 0) + 1

    pending = [m for m in members if m.get('account_status') == 'pending']

    return jsonify({
        'success': True,
        'data': {
            'club': serialize_doc(club) if club else {},
            'total_members': len(members),
            'total_teams': len(teams),
            'total_players': len(players),
            'role_counts': role_counts,
            'pending_invitations': len(pending),
            'upcoming_events': serialize_docs(upcoming_events),
            'teams': serialize_docs(teams),
        }
    })


@api_bp.route('/admin/members', methods=['GET'])
@role_required('admin')
def admin_members():
    """Get all members of the club."""
    club_id = request.current_user.get('club_id')
    if not club_id:
        return jsonify({'success': True, 'data': []})
    role = request.args.get('role')
    status = request.args.get('status')
    user_service = get_user_service()
    members = user_service.get_by_club(club_id)
    if role:
        members = [m for m in members if m.get('role') == role]
    if status:
        members = [m for m in members if m.get('account_status') == status]
    return jsonify({'success': True, 'count': len(members), 'data': serialize_docs(members)})


@api_bp.route('/admin/members', methods=['POST'])
@role_required('admin')
def admin_add_member():
    """Add a new member to the club."""
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'success': False, 'error': 'Email required'}), 400

    club_id = request.current_user.get('club_id')
    user_service = get_user_service()
    email = data['email'].strip().lower()

    existing = user_service.get_by_email(email)
    if existing:
        return jsonify({'success': False, 'error': 'Email already registered'}), 409

    profile = {
        'first_name': data.get('first_name', ''),
        'last_name': data.get('last_name', ''),
        'phone': data.get('phone', ''),
    }
    user_id = user_service.create(
        email, data.get('password', 'changeme123'),
        role=data.get('role', 'player'), club_id=club_id, profile=profile
    )
    return jsonify({'success': True, 'user_id': str(user_id)}), 201


@api_bp.route('/admin/members/<user_id>', methods=['PUT'])
@role_required('admin')
def admin_edit_member(user_id):
    """Edit a member."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    user_service = get_user_service()
    user_service.update_profile(user_id, data)
    if 'role' in data:
        user_service.update_role(user_id, data['role'])
    return jsonify({'success': True, 'message': 'Member updated'})


@api_bp.route('/admin/members/<user_id>', methods=['DELETE'])
@role_required('admin')
def admin_delete_member(user_id):
    """Delete a member."""
    user_service = get_user_service()
    user_service.delete(user_id)
    return jsonify({'success': True, 'message': 'Member deleted'})


@api_bp.route('/admin/teams', methods=['POST'])
@role_required('admin')
def admin_add_team():
    """Add a new team to the club."""
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'success': False, 'error': 'Team name required'}), 400
    club_id = request.current_user.get('club_id')
    team_service = get_team_service()
    team_id = team_service.create(
        club_id=club_id,
        name=data['name'],
        category=data.get('category', ''),
        colors=data.get('colors', {}),
    )
    return jsonify({'success': True, 'team_id': str(team_id)}), 201


@api_bp.route('/admin/teams/<team_id>', methods=['PUT'])
@role_required('admin')
def admin_edit_team(team_id):
    """Edit a team."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    team_service = get_team_service()
    team_service.update(team_id, data)
    return jsonify({'success': True, 'message': 'Team updated'})


@api_bp.route('/admin/teams/<team_id>', methods=['DELETE'])
@role_required('admin')
def admin_delete_team(team_id):
    """Delete a team."""
    team_service = get_team_service()
    team_service.delete(team_id)
    return jsonify({'success': True, 'message': 'Team deleted'})


@api_bp.route('/admin/club', methods=['PUT'])
@role_required('admin')
def admin_update_club():
    """Update club settings."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    club_id = request.current_user.get('club_id')
    club_service = get_club_service()
    club_service.update(club_id, data)
    return jsonify({'success': True, 'message': 'Club updated'})


@api_bp.route('/admin/onboarding', methods=['GET'])
@role_required('admin')
def admin_onboarding():
    """Get onboarding status (invitations)."""
    club_id = request.current_user.get('club_id')
    if not club_id:
        return jsonify({'success': True, 'data': {}})
    user_service = get_user_service()
    members = user_service.get_by_club(club_id)
    pending = [m for m in members if m.get('account_status') == 'pending']
    active = [m for m in members if m.get('account_status') == 'active']
    return jsonify({
        'success': True,
        'data': {
            'total': len(members),
            'pending': serialize_docs(pending),
            'active_count': len(active),
            'pending_count': len(pending),
        }
    })


@api_bp.route('/admin/analytics', methods=['GET'])
@role_required('admin')
def admin_analytics():
    """Get club analytics."""
    club_id = request.current_user.get('club_id')
    if not club_id:
        return jsonify({'success': True, 'data': {}})
    from app.services import get_club_service
    club_service = get_club_service()
    stats = club_service.get_stats(club_id)
    return jsonify({'success': True, 'data': stats})


@api_bp.route('/admin/subscription', methods=['GET'])
@role_required('admin')
def admin_get_subscription():
    """Get current subscription plan."""
    club_id = request.current_user.get('club_id')
    if not club_id:
        return jsonify({'success': True, 'data': {}})
    sub_service = get_subscription_service()
    sub = sub_service.get_by_club(club_id)
    return jsonify({'success': True, 'data': serialize_doc(sub) if sub else {}})


@api_bp.route('/admin/subscription', methods=['PUT'])
@role_required('admin')
def admin_update_subscription():
    """Update subscription plan."""
    data = request.get_json()
    if not data or not data.get('plan'):
        return jsonify({'success': False, 'error': 'Plan required'}), 400
    club_id = request.current_user.get('club_id')
    sub_service = get_subscription_service()
    sub_service.update_subscription(club_id, data['plan'])
    return jsonify({'success': True, 'message': 'Subscription updated'})


# ============================================================
# PARENT ENDPOINTS
# ============================================================

@api_bp.route('/parent/dashboard', methods=['GET'])
@role_required('parent')
def parent_dashboard():
    """Get parent dashboard with linked children."""
    user_id = request.current_user['user_id']
    parent_link_service = get_parent_link_service()
    player_service = get_player_service()

    links = parent_link_service.get_linked_players(user_id)
    children = []
    for link in links:
        player = player_service.get_by_id(link.get('player_id'))
        if player:
            user_service = get_user_service()
            user = user_service.get_by_id(str(player.get('user_id', '')))
            child_data = serialize_doc(player)
            if user:
                child_data['user_profile'] = user.get('profile', {})
            children.append(child_data)

    return jsonify({'success': True, 'data': {'children': children}})


@api_bp.route('/parent/link', methods=['POST'])
@role_required('parent')
def parent_link_child():
    """Link child to parent via 6-char code."""
    data = request.get_json()
    code = data.get('code', '').strip() if data else ''
    if not code or len(code) != 6:
        return jsonify({'success': False, 'error': 'Valid 6-character code required'}), 400

    parent_link_service = get_parent_link_service()
    result = parent_link_service.link_parent_to_player(request.current_user['user_id'], code)
    if result:
        return jsonify({'success': True, 'message': 'Child linked successfully'})
    return jsonify({'success': False, 'error': 'Invalid or expired code'}), 400


@api_bp.route('/parent/children/<player_id>/calendar', methods=['GET'])
@role_required('parent')
def parent_child_calendar(player_id):
    """Get calendar for a linked child's team."""
    player_service = get_player_service()
    player = player_service.get_by_id(player_id)
    if not player:
        return jsonify({'success': False, 'error': 'Player not found'}), 404

    team_id = player.get('team_id')
    club_id = player.get('club_id')
    event_service = get_event_service()
    match_service = get_match_service()
    events = event_service.get_upcoming(str(club_id), team_id=str(team_id) if team_id else None, limit=20)
    matches = match_service.get_upcoming(str(club_id), team_id=str(team_id) if team_id else None, limit=10)
    return jsonify({
        'success': True,
        'data': {
            'events': serialize_docs(events),
            'matches': serialize_docs(matches),
        }
    })


@api_bp.route('/parent/children/<player_id>/roster', methods=['GET'])
@role_required('parent')
def parent_child_roster(player_id):
    """Get roster for a child's team (restricted view)."""
    player_service = get_player_service()
    player = player_service.get_by_id(player_id)
    if not player:
        return jsonify({'success': False, 'error': 'Player not found'}), 404

    team_id = player.get('team_id')
    if not team_id:
        return jsonify({'success': True, 'data': []})

    team_service = get_team_service()
    players = team_service.get_players(str(team_id))
    safe_data = []
    for p in players:
        safe_data.append({
            '_id': str(p.get('_id', '')),
            'jersey_number': p.get('jersey_number'),
            'position': p.get('position'),
            'first_name': p.get('first_name', ''),
            'last_name': p.get('last_name', ''),
        })
    return jsonify({'success': True, 'data': safe_data})


@api_bp.route('/parent/generate-code/<player_id>', methods=['POST'])
@role_required('coach', 'admin')
def generate_parent_code(player_id):
    """Generate a parent linking code for a player."""
    parent_link_service = get_parent_link_service()
    code = parent_link_service.generate_link_code(player_id)
    return jsonify({'success': True, 'code': code})


# ============================================================
# ISY ENDPOINTS
# ============================================================

@api_bp.route('/isy/dashboard', methods=['GET'])
@role_required('coach', 'admin')
def isy_dashboard():
    """Get ISY hub dashboard."""
    club_id = request.current_user.get('club_id')
    if not club_id:
        return jsonify({'success': True, 'data': {}})
    sponsors = list(mongo.db.sponsors.find({'club_id': club_id}))
    payments = list(mongo.db.payments.find({'club_id': club_id}).sort('date', -1).limit(20))
    total_revenue = sum(p.get('amount', 0) for p in payments if p.get('status') == 'confirmed')
    return jsonify({
        'success': True,
        'data': {
            'sponsors': serialize_docs(sponsors),
            'recent_payments': serialize_docs(payments),
            'total_sponsors': len(sponsors),
            'total_revenue': total_revenue,
        }
    })


@api_bp.route('/isy/sponsors', methods=['GET'])
@role_required('coach', 'admin')
def isy_get_sponsors():
    """Get sponsors list."""
    club_id = request.current_user.get('club_id')
    sponsors = list(mongo.db.sponsors.find({'club_id': club_id}))
    return jsonify({'success': True, 'data': serialize_docs(sponsors)})


@api_bp.route('/isy/sponsors', methods=['POST'])
@role_required('coach', 'admin')
def isy_add_sponsor():
    """Add a new sponsor."""
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'success': False, 'error': 'Sponsor name required'}), 400
    club_id = request.current_user.get('club_id')
    sponsor_id = mongo.db.sponsors.insert_one({
        'club_id': club_id,
        'name': data['name'],
        'contact': data.get('contact', ''),
        'amount': data.get('amount', 0),
        'type': data.get('type', 'gold'),
        'created_at': datetime.datetime.utcnow(),
    }).inserted_id
    return jsonify({'success': True, 'sponsor_id': str(sponsor_id)}), 201


@api_bp.route('/isy/sponsors/<sponsor_id>', methods=['DELETE'])
@role_required('coach', 'admin')
def isy_delete_sponsor(sponsor_id):
    """Delete a sponsor."""
    mongo.db.sponsors.delete_one({'_id': ObjectId(sponsor_id)})
    return jsonify({'success': True, 'message': 'Sponsor deleted'})


@api_bp.route('/isy/payments', methods=['GET'])
@role_required('coach', 'admin')
def isy_get_payments():
    """Get payments list."""
    club_id = request.current_user.get('club_id')
    payments = list(mongo.db.payments.find({'club_id': club_id}).sort('date', -1))
    return jsonify({'success': True, 'data': serialize_docs(payments)})


@api_bp.route('/isy/payments', methods=['POST'])
@role_required('coach', 'admin')
def isy_add_payment():
    """Record a payment."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Data required'}), 400
    club_id = request.current_user.get('club_id')
    payment_id = mongo.db.payments.insert_one({
        'club_id': club_id,
        'player_id': data.get('player_id'),
        'player_name': data.get('player_name', ''),
        'amount': data.get('amount', 0),
        'type': data.get('type', 'cotisation'),
        'status': data.get('status', 'pending'),
        'date': datetime.datetime.utcnow(),
        'description': data.get('description', ''),
    }).inserted_id
    return jsonify({'success': True, 'payment_id': str(payment_id)}), 201


@api_bp.route('/isy/payments/<payment_id>/confirm', methods=['POST'])
@role_required('coach', 'admin')
def isy_confirm_payment(payment_id):
    """Confirm a payment."""
    mongo.db.payments.update_one(
        {'_id': ObjectId(payment_id)},
        {'$set': {'status': 'confirmed'}}
    )
    return jsonify({'success': True, 'message': 'Payment confirmed'})


# ============================================================
# SHOP ENDPOINTS
# ============================================================

@api_bp.route('/shop/products', methods=['GET'])
def shop_get_products():
    """Get shop products."""
    club_id = request.args.get('club_id')
    query = {'club_id': club_id} if club_id else {}
    products = list(mongo.db.products.find(query))
    return jsonify({'success': True, 'data': serialize_docs(products)})


@api_bp.route('/shop/products/<product_id>', methods=['GET'])
def shop_get_product(product_id):
    """Get single product."""
    product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
    if not product:
        return jsonify({'success': False, 'error': 'Product not found'}), 404
    return jsonify({'success': True, 'data': serialize_doc(product)})


@api_bp.route('/shop/orders', methods=['GET'])
@token_required
def shop_get_orders():
    """Get user's orders."""
    user_id = request.current_user['user_id']
    orders = list(mongo.db.orders.find({'user_id': user_id}).sort('created_at', -1))
    return jsonify({'success': True, 'data': serialize_docs(orders)})


@api_bp.route('/shop/orders', methods=['POST'])
@token_required
def shop_create_order():
    """Create a new order."""
    data = request.get_json()
    if not data or not data.get('items'):
        return jsonify({'success': False, 'error': 'Items required'}), 400

    user_id = request.current_user['user_id']
    club_id = request.current_user.get('club_id')
    items = data['items']
    total = sum(item.get('price', 0) * item.get('quantity', 1) for item in items)

    order_id = mongo.db.orders.insert_one({
        'user_id': user_id,
        'club_id': club_id,
        'items': items,
        'total': total,
        'status': 'pending',
        'created_at': datetime.datetime.utcnow(),
    }).inserted_id
    return jsonify({'success': True, 'order_id': str(order_id)}), 201


# ============================================================
# SHOP CATEGORIES ENDPOINT
# ============================================================

@api_bp.route('/shop/categories', methods=['GET'])
def shop_get_categories():
    """Get product categories."""
    products = list(mongo.db.products.find({}, {'category': 1}))
    categories = list(set(p.get('category', 'Autre') for p in products if p.get('category')))
    return jsonify({'success': True, 'data': sorted(categories)})


# ============================================================
# COMPETITIONS ENDPOINTS
# ============================================================

@api_bp.route('/competitions', methods=['GET'])
def get_competitions():
    """Get competitions."""
    club_id = request.args.get('club_id')
    query = {'club_id': club_id} if club_id else {}
    competitions = list(mongo.db.competitions.find(query).sort('start_date', -1))
    return jsonify({'success': True, 'data': serialize_docs(competitions)})


@api_bp.route('/competitions/<competition_id>', methods=['GET'])
def get_competition(competition_id):
    """Get single competition."""
    comp = mongo.db.competitions.find_one({'_id': ObjectId(competition_id)})
    if not comp:
        return jsonify({'success': False, 'error': 'Competition not found'}), 404
    return jsonify({'success': True, 'data': serialize_doc(comp)})


# ============================================================
# COACH SCOUTING ENDPOINT
# ============================================================

@api_bp.route('/coach/scouting', methods=['GET'])
@role_required('coach')
def coach_scouting():
    """Get scouting prospects."""
    user_id = request.current_user['user_id']
    club_id = request.current_user.get('club_id')
    prospects = list(mongo.db.scouting.find({'club_id': club_id}).sort('created_at', -1))
    return jsonify({'success': True, 'data': serialize_docs(prospects)})


@api_bp.route('/coach/scouting', methods=['POST'])
@role_required('coach')
def coach_add_prospect():
    """Add a scouting prospect."""
    data = request.get_json()
    if not data or not data.get('first_name'):
        return jsonify({'success': False, 'error': 'First name required'}), 400
    club_id = request.current_user.get('club_id')
    prospect_id = mongo.db.scouting.insert_one({
        'club_id': club_id,
        'first_name': data['first_name'],
        'last_name': data.get('last_name', ''),
        'position': data.get('position', ''),
        'club': data.get('club', ''),
        'notes': data.get('notes', ''),
        'rating': data.get('rating'),
        'created_at': datetime.datetime.utcnow(),
    }).inserted_id
    return jsonify({'success': True, 'prospect_id': str(prospect_id)}), 201


# ============================================================
# SUPERADMIN ENDPOINTS
# ============================================================

@api_bp.route('/superadmin/dashboard', methods=['GET'])
@role_required('superadmin')
def superadmin_dashboard():
    """Get platform-wide dashboard."""
    clubs = list(mongo.db.clubs.find())
    users = mongo.db.users.count_documents({})
    players = mongo.db.players.count_documents({})
    return jsonify({
        'success': True,
        'data': {
            'total_clubs': len(clubs),
            'total_users': users,
            'total_players': players,
            'clubs': serialize_docs(clubs),
        }
    })


@api_bp.route('/superadmin/projects', methods=['GET'])
@role_required('superadmin')
def superadmin_projects():
    """Get all projects."""
    project_service = get_project_service()
    projects = project_service.get_all()
    return jsonify({'success': True, 'data': serialize_docs(projects)})


@api_bp.route('/superadmin/projects', methods=['POST'])
@role_required('superadmin')
def superadmin_create_project():
    """Create a new project."""
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'success': False, 'error': 'Name required'}), 400
    project_service = get_project_service()
    project_id = project_service.create(data)
    return jsonify({'success': True, 'project_id': str(project_id)}), 201


@api_bp.route('/superadmin/projects/<project_id>', methods=['GET'])
@role_required('superadmin')
def superadmin_project_detail(project_id):
    """Get project details with tickets."""
    project_service = get_project_service()
    project = project_service.get_by_id(project_id)
    if not project:
        return jsonify({'success': False, 'error': 'Project not found'}), 404
    return jsonify({'success': True, 'data': serialize_doc(project)})


@api_bp.route('/superadmin/projects/<project_id>/tickets', methods=['POST'])
@role_required('superadmin')
def superadmin_create_ticket(project_id):
    """Create a ticket for a project."""
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'success': False, 'error': 'Title required'}), 400
    project_service = get_project_service()
    ticket_id = project_service.create_ticket(project_id, data)
    return jsonify({'success': True, 'ticket_id': str(ticket_id)}), 201


@api_bp.route('/superadmin/clubs', methods=['GET'])
@role_required('superadmin')
def superadmin_clubs():
    """Get all clubs for management."""
    clubs = list(mongo.db.clubs.find())
    result = []
    for club in clubs:
        user_count = mongo.db.users.count_documents({'club_id': club['_id']})
        c = serialize_doc(club)
        c['member_count'] = user_count
        result.append(c)
    return jsonify({'success': True, 'data': result})
