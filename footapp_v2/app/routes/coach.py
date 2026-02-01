# FootApp V2 - Coach Routes

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.routes.auth import login_required, role_required

coach_bp = Blueprint('coach', __name__, url_prefix='/coach')

# ============================================================
# COACH ROUTES
# ============================================================

@coach_bp.route('/dashboard')
@login_required
@role_required('coach', 'admin')
def dashboard():
    """Coach dashboard"""
    club_id = session.get('club_id')
    if not club_id:
        flash('Aucun club associe.', 'warning')
        return redirect(url_for('main.index'))
    
    from app.services import get_player_service, get_event_service, get_match_service
    
    player_service = get_player_service()
    event_service = get_event_service()
    match_service = get_match_service()
    
    players = player_service.get_by_club(club_id)
    upcoming_events = event_service.get_upcoming(club_id, limit=5)
    upcoming_matches = match_service.get_upcoming(club_id, limit=3)
    season_stats = match_service.get_season_stats(club_id)
    
    return render_template('coach/dashboard.html',
        players=players,
        upcoming_events=upcoming_events,
        upcoming_matches=upcoming_matches,
        season_stats=season_stats
    )

@coach_bp.route('/roster')
@login_required
@role_required('coach', 'admin')
def roster():
    """Team roster management"""
    club_id = session.get('club_id')
    if not club_id:
        return redirect(url_for('main.index'))
    
    from app.services import get_player_service
    player_service = get_player_service()
    
    players = player_service.get_by_club(club_id)
    
    # Group by position
    by_position = {'GK': [], 'DEF': [], 'MID': [], 'ATT': []}
    for player in players:
        pos = player.get('position', 'MID')
        if pos in by_position:
            by_position[pos].append(player)
    
    return render_template('coach/roster.html', players=players, by_position=by_position)

@coach_bp.route('/player/<player_id>')
@login_required
@role_required('coach', 'admin')
def player_detail(player_id):
    """Player detail view"""
    from app.services import get_player_service
    player_service = get_player_service()
    
    player = player_service.get_by_id(player_id)
    if not player:
        flash('Joueur non trouve.', 'error')
        return redirect(url_for('coach.roster'))
    
    return render_template('coach/player_detail.html', player=player)

@coach_bp.route('/player/<player_id>/edit', methods=['GET', 'POST'])
@login_required
@role_required('coach', 'admin')
def edit_player(player_id):
    """Edit player"""
    from app.services import get_player_service
    player_service = get_player_service()
    
    player = player_service.get_by_id(player_id)
    if not player:
        flash('Joueur non trouve.', 'error')
        return redirect(url_for('coach.roster'))
    
    if request.method == 'POST':
        data = {
            'name': request.form.get('name'),
            'jersey_number': int(request.form.get('jersey_number', 0)),
            'position': request.form.get('position'),
            'status': request.form.get('status'),
            'height': int(request.form.get('height', 175)),
            'weight': int(request.form.get('weight', 70))
        }
        player_service.update(player_id, data)
        flash('Joueur mis a jour.', 'success')
        return redirect(url_for('coach.player_detail', player_id=player_id))
    
    return render_template('coach/edit_player.html', player=player)

@coach_bp.route('/attendance')
@login_required
@role_required('coach', 'admin')
def attendance():
    """Attendance management"""
    club_id = session.get('club_id')
    if not club_id:
        return redirect(url_for('main.index'))
    
    from app.services import get_event_service, get_player_service
    event_service = get_event_service()
    player_service = get_player_service()
    
    upcoming_events = event_service.get_upcoming(club_id, limit=10)
    players = player_service.get_by_club(club_id)
    
    return render_template('coach/attendance.html', 
        events=upcoming_events, 
        players=players
    )

@coach_bp.route('/tactics')
@login_required
@role_required('coach', 'admin')
def tactics():
    """Tactical board"""
    club_id = session.get('club_id')
    if not club_id:
        return redirect(url_for('main.index'))
    
    from app.services import get_player_service
    player_service = get_player_service()
    
    lineup = player_service.get_lineup_by_formation(club_id)
    
    return render_template('coach/tactics.html', lineup=lineup)

@coach_bp.route('/create-event', methods=['GET', 'POST'])
@login_required
@role_required('coach', 'admin')
def create_event():
    """Create new event"""
    if request.method == 'POST':
        club_id = session.get('club_id')
        user_id = session.get('user_id')
        
        from app.services import get_event_service
        from datetime import datetime
        
        event_service = get_event_service()
        
        date_str = request.form.get('date')
        time_str = request.form.get('time', '18:00')
        event_date = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        
        event_service.create(
            club_id=club_id,
            title=request.form.get('title'),
            event_type=request.form.get('type'),
            date=event_date,
            location=request.form.get('location', ''),
            description=request.form.get('description', ''),
            created_by=user_id
        )
        
        flash('Evenement cree.', 'success')
        return redirect(url_for('main.calendar'))
    
    return render_template('coach/create_event.html')

@coach_bp.route('/match-center')
@login_required
@role_required('coach', 'admin')
def match_center():
    """Match center"""
    club_id = session.get('club_id')
    if not club_id:
        return redirect(url_for('main.index'))
    
    from app.services import get_match_service
    match_service = get_match_service()
    
    upcoming = match_service.get_upcoming(club_id)
    completed = match_service.get_completed(club_id)
    
    return render_template('coach/match_center.html',
        upcoming_matches=upcoming,
        completed_matches=completed
    )
