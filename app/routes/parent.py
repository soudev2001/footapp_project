# FootLogic V2 - Parent Portal
from flask import Blueprint, render_template, request, flash, redirect, url_for, session, current_app, jsonify
from functools import wraps
from bson import ObjectId
from app.services import get_parent_link_service, get_event_service, get_player_service

parent_bp = Blueprint('parent', __name__, url_prefix='/parent')

def parent_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_role') != 'parent':
            flash('Accès réservé aux parents.', 'warning')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

@parent_bp.route('/dashboard', methods=['GET'])
@parent_required
def dashboard():
    """Main dashboard for parents, listing their linked children"""
    parent_id = session.get('user_id')
    link_service = get_parent_link_service()
    
    # Get all successfully linked children (player profiles)
    children = link_service.get_linked_players(parent_id)
    
    return render_template('parent/dashboard.html', children=children)

@parent_bp.route('/link', methods=['POST'])
@parent_required
def link_child():
    """Handle code submission to link a parent to a child"""
    code = request.form.get('association_code', '').strip()
    if not code:
        flash("Veuillez entrer un code d'association.", 'warning')
        return redirect(url_for('parent.dashboard'))
        
    parent_id = session.get('user_id')
    link_service = get_parent_link_service()
    
    success, message = link_service.link_parent_to_player(parent_id, code)
    if success:
        flash(message, 'success')
    else:
        flash(message, 'danger')
        
    return redirect(url_for('parent.dashboard'))

@parent_bp.route('/calendar', methods=['GET'])
@parent_required
def calendar():
    """Filtered calendar showing ONLY events for the parent's children"""
    parent_id = session.get('user_id')
    link_service = get_parent_link_service()
    event_service = get_event_service()
    
    children = link_service.get_linked_players(parent_id)
    if not children:
        flash("Vous n'avez pas encore d'enfant associé.", "info")
        return render_template('parent/calendar.html', events=[])
        
    # Get team IDs for all linked children
    team_ids = [str(child['team_id']) for child in children if child.get('team_id')]
    team_ids = list(set(team_ids)) # Remove duplicates
    
    # Get all events for these specific teams
    events = []
    for team_id in team_ids:
        team_events = event_service.collection.find({'team_id': ObjectId(team_id)})
        events.extend(list(team_events))
        
    # Deduplicate events just in case children share teams
    unique_events = {str(e['_id']): e for e in events}.values()
    
    from app.models import serialize_docs
    return render_template('parent/calendar.html', events=serialize_docs(list(unique_events)), children=children)

@parent_bp.route('/child/<player_id>/roster', methods=['GET'])
@parent_required
def child_roster(player_id):
    """Restricted roster view: only teammates, without sensitive info"""
    parent_id = session.get('user_id')
    link_service = get_parent_link_service()
    player_service = get_player_service()
    
    # Verify the parent is actually linked to this child
    children = link_service.get_linked_players(parent_id)
    is_linked = any(str(c['_id']) == player_id for c in children)
    
    if not is_linked:
        flash("Vous n'êtes pas autorisé à voir ces informations.", "danger")
        return redirect(url_for('parent.dashboard'))
        
    child = player_service.get_by_id(player_id)
    if not child or not child.get('team_id'):
        flash("Cet enfant n'est affecté à aucune équipe.", "info")
        return redirect(url_for('parent.dashboard'))
        
    # Get ALL players in the child's team
    teammates = player_service.get_by_club(child['club_id'], team_id=child['team_id'])
    
    # Filter out sensitive data from teammates
    safe_roster = []
    for p in teammates:
        safe_player = {
            'name': p.get('name'),
            'position': p.get('position'),
            'jersey_number': p.get('jersey_number'),
            'photo': p.get('photo', ''),
            'is_child': str(p['_id']) == player_id
        }
        safe_roster.append(safe_player)
        
    return render_template('parent/roster_restricted.html', child=child, teammates=safe_roster)

@parent_bp.route('/api/generate_code/<player_id>', methods=['POST'])
def api_generate_code(player_id):
    """API endpoint for an Admin/Coach to generate an association code for a player"""
    # Verify coach/admin
    if session.get('user_role') not in ['admin', 'superadmin', 'coach']:
        return jsonify({'success': False, 'message': 'Accès refusé'}), 403
        
    club_id = session.get('club_id')
    generator_id = session.get('user_id')
    link_service = get_parent_link_service()
    
    code = link_service.generate_link_code(player_id, club_id, generated_by_user_id=generator_id)
    
    if code:
        return jsonify({'success': True, 'code': code})
    return jsonify({'success': False, 'message': 'Erreur lors de la génération'}), 500
