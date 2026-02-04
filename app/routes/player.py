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
    
    # Get upcoming events
    upcoming = event_service.get_upcoming(club_id, limit=5) if club_id else []
    
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
    """Player calendar view"""
    club_id = session.get('club_id')
    
    from app.services import get_event_service
    event_service = get_event_service()
    
    events = event_service.get_by_club(club_id) if club_id else []
    
    return render_template('player/calendar.html', events=events)

@player_bp.route('/team')
@login_required
def team():
    """View team roster"""
    club_id = session.get('club_id')
    
    from app.services import get_player_service, get_club_service
    player_service = get_player_service()
    club_service = get_club_service()
    
    club = club_service.get_by_id(club_id) if club_id else None
    players = player_service.get_by_club(club_id) if club_id else []
    
    return render_template('player/team.html', club=club, players=players)

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
        # 1. Update User's club_id
        from bson import ObjectId
        # Direct DB update needed or userService method
        # Using raw collection for now or assume userService has update method
        # Let's use the one we have access to via services
        from app.services.db import get_db
        db = get_db()
        db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'club_id': contract['club_id']}})
        
        # 2. Create Player Profile if it doesn't exist
        existing_player = player_service.get_by_user(user_id)
        if not existing_player:
            player_service.create(
                user_id=user_id,
                club_id=str(contract['club_id']), # expects string usually
                name=session.get('user_profile', {}).get('first_name', 'Player'),
                jersey_number=0,
                position='MID'
            )
        
        # Update session
        session['club_id'] = str(contract['club_id'])
        flash('Contrat accepté ! Bienvenue dans votre nouveau club.', 'success')
        return redirect(url_for('player.home'))
        
    flash('Offre rejetée.', 'info')
    return redirect(url_for('player.contracts'))

