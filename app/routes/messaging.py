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
    
    user_service = get_user_service()
    team_service = get_team_service()
    
    # Get recent conversations (simplified)
    # In a real app, we'd find unique sender/receivers from the message history
    members = user_service.get_members_by_club(club_id)
    teams = team_service.get_by_club(club_id)
    
    return render_template('messaging/index.html', members=members, teams=teams)

@messaging_bp.route('/history/direct/<other_user_id>')
@login_required
def direct_history(other_user_id):
    """Fetch DM history with another user"""
    user_id = session.get('user_id')
    service = get_messaging_service()
    history = service.get_direct_messages(user_id, other_user_id)
    
    # Enrich with member names
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

@messaging_bp.route('/history/team/<team_id>')
@login_required
def team_history(team_id):
    """Fetch team chat history"""
    service = get_messaging_service()
    history = service.get_team_messages(team_id)
    
    user_service = get_user_service()
    # Fetch all users to map IDs to names (cache this in a real app)
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

@messaging_bp.route('/send', methods=['POST'])
@login_required
def send_message():
    """Send a message"""
    data = request.json
    sender_id = session.get('user_id')
    content = data.get('content')
    receiver_id = data.get('receiver_id')
    team_id = data.get('team_id')
    msg_type = data.get('type', 'direct')
    
    if not content:
        return jsonify({'error': 'Message vide'}), 400
        
    service = get_messaging_service()
    msg = service.send_message(sender_id, content, receiver_id, team_id, msg_type)
    
    return jsonify({'status': 'success', 'message_id': str(msg['_id'])})
