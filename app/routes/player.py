# FootLogic V2 - Player Routes

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.routes.auth import login_required, role_required

player_bp = Blueprint('player', __name__, url_prefix='/player')

# ============================================================
# PLAYER ROUTES
# ============================================================

@player_bp.route('/home')
@login_required
def home():
    """Player home"""
    user_id = session.get('user_id')
    club_id = session.get('club_id')
    
    from app.services import get_player_service, get_event_service, get_post_service
    
    player_service = get_player_service()
    event_service = get_event_service()
    post_service = get_post_service()
    
    # Get player profile
    player = player_service.get_by_user(user_id) if user_id else None
    team_id = player.get('team_id') if player else None
    
    # Get upcoming events (filtered by team)
    upcoming = event_service.get_upcoming(club_id, team_id=team_id, limit=5) if club_id else []
    
    # Get recent posts
    posts = post_service.get_by_club(club_id, limit=5) if club_id else []
    
    return render_template('player/home.html',
        player=player,
        upcoming_events=upcoming,
        posts=posts
    )

@player_bp.route('/evo-hub')
@login_required
def evo_hub():
    """Player Evolution HUB"""
    user_id = session.get('user_id')
    from app.services import get_player_service
    player_service = get_player_service()
    player = player_service.get_by_user(user_id)
    
    if not player:
        flash('Profil joueur non trouve.', 'error')
        return redirect(url_for('player.home'))
        
    return render_template('player/evo_hub.html', player=player)

@player_bp.route('/profile')
@login_required
def profile():
    """Player profile"""
    user_id = session.get('user_id')
    
    from app.services import get_player_service, get_user_service
    
    player_service = get_player_service()
    user_service = get_user_service()
    
    user = user_service.get_by_id(user_id)
    player = player_service.get_by_user(user_id)
    
    return render_template('player/profile.html', user=user, player=player)

@player_bp.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    """Edit player profile"""
    user_id = session.get('user_id')
    
    from app.services import get_user_service
    user_service = get_user_service()
    
    user = user_service.get_by_id(user_id)
    
    if request.method == 'POST':
        profile = {
            'first_name': request.form.get('first_name'),
            'last_name': request.form.get('last_name'),
            'phone': request.form.get('phone'),
            'avatar': request.form.get('avatar') or user.get('profile', {}).get('avatar', '')
        }
        user_service.update_profile(user_id, profile)
        
        # Update session
        session['user_profile'] = profile
        
        flash('Profil mis a jour.', 'success')
        return redirect(url_for('player.profile'))
    
    return render_template('player/edit_profile.html', user=user)

@player_bp.route('/calendar')
@login_required
def calendar():
    user_id = session.get('user_id')
    club_id = session.get('club_id')
    
    from app.services import get_event_service, get_player_service
    event_service = get_event_service()
    player_service = get_player_service()
    
    # Filter by team if player
    player = player_service.get_by_user(user_id) if user_id else None
    team_id = player.get('team_id') if player else None
    
    events = event_service.get_by_club(club_id) if club_id else []
    # If it's a player, we might want to highlight or filter? 
    # For now, let's keep all club events but maybe filter in the service?
    # Actually, the user asked for filtering.
    if team_id:
        events = [e for e in events if not e.get('team_id') or e.get('team_id') == team_id]
    
    return render_template('player/calendar.html', events=events)

@player_bp.route('/team')
@login_required
def team():
    user_id = session.get('user_id')
    club_id = session.get('club_id')
    
    from app.services import get_player_service, get_club_service, get_team_service
    player_service = get_player_service()
    club_service = get_club_service()
    team_service = get_team_service()
    
    player = player_service.get_by_user(user_id) if user_id else None
    team_id = player.get('team_id') if player else None
    
    club = club_service.get_by_id(club_id) if club_id else None
    # Show my team by default
    players = player_service.get_by_club(club_id, team_id=team_id) if club_id else []
    
    selected_team = team_service.get_by_id(team_id) if team_id else None
    
    return render_template('player/team.html', club=club, players=players, team=selected_team)

@player_bp.route('/event/<event_id>')
@login_required
def event_detail(event_id):
    """Event detail"""
    from app.services import get_event_service
    event_service = get_event_service()
    
    event = event_service.get_by_id(event_id)
    if not event:
        flash('Evenement non trouve.', 'error')
        return redirect(url_for('player.calendar'))
    
    attendees = event_service.get_attendance_list(event_id)
    
    return render_template('player/event_detail.html', event=event, attendees=attendees)

@player_bp.route('/event/<event_id>/respond', methods=['POST'])
@login_required
def respond_event(event_id):
    """Respond to event (confirm/decline attendance)"""
    user_id = session.get('user_id')
    response = request.form.get('response')  # 'yes' or 'no'
    
    from app.services import get_event_service, get_player_service
    event_service = get_event_service()
    player_service = get_player_service()
    
    player = player_service.get_by_user(user_id)
    if player:
        player_id = str(player['_id'])
        if response == 'yes':
            event_service.add_attendee(event_id, player_id)
            flash('Presence confirmee.', 'success')
        else:
            event_service.remove_attendee(event_id, player_id)
            flash('Absence enregistree.', 'info')
    
    return redirect(url_for('player.event_detail', event_id=event_id))

@player_bp.route('/documents')
@login_required
def documents():
    """Player documents"""
    return render_template('player/documents.html')

@player_bp.route('/settings')
@login_required
def settings():
    """Player settings"""
    return render_template('player/settings.html')

@player_bp.route('/notifications')
@login_required
def notifications():
    """Player notifications"""
    return render_template('player/notifications.html')

# ============================================================
# CONTRACTS
# ============================================================

@player_bp.route('/contracts')
@login_required
def contracts():
    """View my contracts"""
    user_id = session.get('user_id')
    
    from app.services import get_contract_service, get_club_service
    contract_service = get_contract_service()
    club_service = get_club_service()
    
    contracts = contract_service.get_by_user(user_id)
    
    # Enrich with club details
    for c in contracts:
        c['club'] = club_service.get_by_id(c['club_id'])
    
    return render_template('player/contracts.html', contracts=contracts)


@player_bp.route('/contracts/<contract_id>/respond', methods=['POST'])
@login_required
def respond_contract(contract_id):
    """Accept or Reject a contract"""
    action = request.form.get('action') # 'active' or 'rejected'
    user_id = session.get('user_id')
    
    from app.services import get_contract_service, get_user_service, get_player_service
    contract_service = get_contract_service()
    user_service = get_user_service()
    player_service = get_player_service()
    
    contract = contract_service.get_by_id(contract_id)
    
    if not contract or str(contract['user_id']) != user_id:
        flash('Contrat invalide.', 'error')
        return redirect(url_for('player.contracts'))
        
    contract_service.respond_to_offer(contract_id, action)
    
    if action == 'active':
        # 1. Update User's club_id and team_id
        from bson import ObjectId
        from app.services.db import get_db
        db = get_db()
        
        update_fields = {'club_id': contract['club_id']}
        if contract.get('team_id'):
            update_fields['team_id'] = contract['team_id']
            
        db.users.update_one({'_id': ObjectId(user_id)}, {'$set': update_fields})
        
        # 2. Create/Update Player Profile
        existing_player = player_service.get_by_user(user_id)
        if not existing_player:
            player_service.create(
                user_id=user_id,
                club_id=str(contract['club_id']),
                name=session.get('user_profile', {}).get('first_name', 'Player'),
                jersey_number=0,
                position='MID',
                team_id=str(contract['team_id']) if contract.get('team_id') else None
            )
        else:
            # Update existing player profile with new club/team
            player_service.update(str(existing_player['_id']), {
                'club_id': contract['club_id'],
                'team_id': contract.get('team_id')
            })
        
        # Update session
        session['club_id'] = str(contract['club_id'])
        flash('Contrat accepté ! Bienvenue dans votre nouveau club.', 'success')
        return redirect(url_for('player.home'))
        
    flash('Offre rejetée.', 'info')
    return redirect(url_for('player.contracts'))

