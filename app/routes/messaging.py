from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from app.routes.auth import login_required
from app.services import get_user_service, get_team_service, get_club_service

messaging_bp = Blueprint('messaging', __name__, url_prefix='/messages')

def get_messaging_service():
    from app.services.messaging_service import MessagingService
    from app.services.db import mongo
    return MessagingService(mongo.db)

@messaging_bp.route('/')
@login_required
def index():
    """Main messaging interface"""
    user_id = session.get('user_id')
    club_id = session.get('club_id')
    user_role = session.get('user_role', 'player')
    
    user_service = get_user_service()
    team_service = get_team_service()
    service = get_messaging_service()
    
    # All club members with roles for search
    members = user_service.get_members_by_club(club_id)
    teams = team_service.get_by_club(club_id)
    
    # Custom channels
    channels = service.get_channels(club_id, user_id)
    
    # Unique roles in club for channel creation filter
    roles = list(set(m.get('role', 'player') for m in members))
    
    return render_template('messaging/index.html', 
        members=members, 
        teams=teams, 
        channels=channels,
        roles=roles,
        is_admin=(user_role in ['admin', 'coach'])
    )

# ========== DIRECT MESSAGES ==========

@messaging_bp.route('/history/direct/<other_user_id>')
@login_required
def direct_history(other_user_id):
    """Fetch DM history with another user"""
    user_id = session.get('user_id')
    service = get_messaging_service()
    history = service.get_direct_messages(user_id, other_user_id)
    
    user_service = get_user_service()
    other_user = user_service.get_by_id(other_user_id)
    
    return jsonify({
        'history': [
            {
                'sender_id': str(m['sender_id']),
                'content': m['content'],
                'created_at': m['created_at'].isoformat()
            } for m in reversed(history)
        ],
        'other_user': {
            'name': f"{other_user['profile']['first_name']} {other_user['profile']['last_name']}",
            'id': str(other_user['_id'])
        }
    })

# ========== TEAM MESSAGES ==========

@messaging_bp.route('/history/team/<team_id>')
@login_required
def team_history(team_id):
    """Fetch team chat history"""
    service = get_messaging_service()
    history = service.get_team_messages(team_id)
    
    user_service = get_user_service()
    all_users = {str(u['_id']): f"{u['profile']['first_name']} {u['profile']['last_name']}" 
                 for u in user_service.get_all()}

    return jsonify({
        'history': [
            {
                'sender_id': str(m['sender_id']),
                'sender_name': all_users.get(str(m['sender_id']), 'Inconnu'),
                'content': m['content'],
                'created_at': m['created_at'].isoformat()
            } for m in reversed(history)
        ]
    })

# ========== CHANNEL MESSAGES ==========

@messaging_bp.route('/history/channel/<channel_id>')
@login_required
def channel_history(channel_id):
    """Fetch channel message history"""
    service = get_messaging_service()
    history = service.get_channel_messages(channel_id)
    
    user_service = get_user_service()
    all_users = {str(u['_id']): f"{u['profile']['first_name']} {u['profile']['last_name']}" 
                 for u in user_service.get_all()}

    channel = service.get_channel_by_id(channel_id)

    return jsonify({
        'history': [
            {
                'sender_id': str(m['sender_id']),
                'sender_name': all_users.get(str(m['sender_id']), 'Inconnu'),
                'content': m['content'],
                'created_at': m['created_at'].isoformat()
            } for m in reversed(history)
        ],
        'channel': {
            'name': channel.get('name', ''),
            'description': channel.get('description', ''),
            'member_count': len(channel.get('members', []))
        } if channel else None
    })

# ========== SEND MESSAGE ==========

@messaging_bp.route('/send', methods=['POST'])
@login_required
def send_message():
    """Send a message (DM, team, or channel)"""
    data = request.json
    sender_id = session.get('user_id')
    content = data.get('content')
    receiver_id = data.get('receiver_id')
    team_id = data.get('team_id')
    channel_id = data.get('channel_id')
    msg_type = data.get('type', 'direct')
    
    if not content:
        return jsonify({'error': 'Message vide'}), 400
        
    service = get_messaging_service()
    msg = service.send_message(sender_id, content, receiver_id, team_id, msg_type, channel_id=channel_id)
    
    return jsonify({'status': 'success', 'message_id': str(msg['_id'])})

# ========== CHANNEL CRUD ==========

@messaging_bp.route('/channels/create', methods=['POST'])
@login_required
def create_channel():
    """Create a new channel (admin/coach only)"""
    data = request.json
    club_id = session.get('club_id')
    user_id = session.get('user_id')
    
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Nom requis'}), 400
    
    service = get_messaging_service()
    
    # Resolve members from roles + individual IDs
    member_ids = set(data.get('member_ids', []))
    
    # Add members by role
    roles_to_add = data.get('roles', [])
    if roles_to_add:
        user_service = get_user_service()
        all_members = user_service.get_members_by_club(club_id)
        for m in all_members:
            if m.get('role') in roles_to_add:
                member_ids.add(str(m['_id']))
    
    # Always include creator
    member_ids.add(user_id)
    
    channel = service.create_channel(
        club_id=club_id,
        name=name,
        created_by=user_id,
        description=data.get('description', ''),
        member_ids=list(member_ids),
        icon=data.get('icon', 'hashtag'),
        color=data.get('color', 'primary')
    )
    
    return jsonify({'status': 'success', 'channel_id': str(channel['_id'])})

@messaging_bp.route('/channels/<channel_id>/delete', methods=['POST'])
@login_required
def delete_channel(channel_id):
    """Delete a channel"""
    service = get_messaging_service()
    service.delete_channel(channel_id)
    return jsonify({'status': 'success'})

@messaging_bp.route('/members/search')
@login_required
def search_members():
    """Search club members for new conversation"""
    club_id = session.get('club_id')
    q = request.args.get('q', '').lower()
    
    user_service = get_user_service()
    members = user_service.get_members_by_club(club_id)
    
    results = []
    for m in members:
        if str(m['_id']) == session.get('user_id'):
            continue
        full_name = f"{m['profile']['first_name']} {m['profile']['last_name']}".lower()
        role = m.get('role', '').lower()
        if q in full_name or q in role or not q:
            results.append({
                'id': str(m['_id']),
                'name': f"{m['profile']['first_name']} {m['profile']['last_name']}",
                'role': m.get('role', 'player'),
                'initials': f"{m['profile']['first_name'][:1]}{m['profile']['last_name'][:1]}"
            })
    
    return jsonify(results)
