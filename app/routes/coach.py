# FootLogic V2 - Coach Routes

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
    
@coach_bp.route('/player/add', methods=['GET', 'POST'])
@login_required
@role_required('coach', 'admin')
def add_player():
    """Add new player"""
    club_id = session.get('club_id')
    if not club_id:
        return redirect(url_for('main.index'))
        
    if request.method == 'POST':
        from app.services import get_player_service
        player_service = get_player_service()
        
        data = {
            'name': request.form.get('name'),
            'jersey_number': int(request.form.get('jersey_number', 0)),
            'position': request.form.get('position'),
            'status': 'active',
            'height': int(request.form.get('height', 175)),
            'weight': int(request.form.get('weight', 70))
        }
        
        player_service.create(club_id=club_id, **data)
        flash('Nouveau joueur ajoute a l\'effectif.', 'success')
        return redirect(url_for('coach.roster'))
        
    return render_template('coach/add_player.html')

@coach_bp.route('/player/<player_id>/delete', methods=['POST'])
@login_required
@role_required('coach', 'admin')
def delete_player(player_id):
    """Delete player"""
    from app.services import get_player_service
    player_service = get_player_service()
    
    player_service.delete(player_id)
    flash('Joueur supprime de l\'effectif.', 'success')
    return redirect(url_for('coach.roster'))

@coach_bp.route('/player/<player_id>/update-ratings', methods=['POST'])
@login_required
@role_required('coach', 'admin')
def update_player_ratings(player_id):
    """Update technical ratings"""
    from app.services import get_player_service
    player_service = get_player_service()
    
    ratings = {
        'VIT': int(request.form.get('VIT', 50)),
        'TIR': int(request.form.get('TIR', 50)),
        'PAS': int(request.form.get('PAS', 50)),
        'DRI': int(request.form.get('DRI', 50)),
        'DEF': int(request.form.get('DEF', 50)),
        'PHY': int(request.form.get('PHY', 50))
    }
    
    player_service.update_technical_ratings(player_id, ratings)
    flash('Notes techniques mises a jour.', 'success')
    return redirect(url_for('coach.player_detail', player_id=player_id))

@coach_bp.route('/player/<player_id>/add-evaluation', methods=['POST'])
@login_required
@role_required('coach', 'admin')
def add_player_evaluation(player_id):
    """Add coach evaluation"""
    from app.services import get_player_service
    player_service = get_player_service()
    
    evaluation = {
        'type': request.form.get('type', 'Match'),
        'comment': request.form.get('comment'),
        'coach_name': session.get('user_profile', {}).get('first_name', 'Coach')
    }
    
    player_service.add_evaluation(player_id, evaluation)
    flash('Evaluation ajoutee.', 'success')
    return redirect(url_for('coach.player_detail', player_id=player_id))

@coach_bp.route('/player/<player_id>/add-physical', methods=['POST'])
@login_required
@role_required('coach', 'admin')
def add_player_physical(player_id):
    """Add physical record"""
    from app.services import get_player_service
    player_service = get_player_service()
    
    record = {
        'weight': int(request.form.get('weight', 0)),
        'vma': float(request.form.get('vma', 0)),
        'note': request.form.get('note', '')
    }
    
    player_service.add_physical_record(player_id, record)
    flash('Donnees physiques enregistrees.', 'success')
    return redirect(url_for('coach.player_detail', player_id=player_id))

@coach_bp.route('/attendance')
@coach_bp.route('/attendance/<event_id>')
@login_required
@role_required('coach', 'admin')
def attendance(event_id=None):
    """Attendance management"""
    club_id = session.get('club_id')
    if not club_id:
        return redirect(url_for('main.index'))
    
    from app.services import get_event_service, get_player_service
    event_service = get_event_service()
    player_service = get_player_service()
    
    players = player_service.get_by_club(club_id)
    upcoming_events = event_service.get_upcoming(club_id, limit=20)
    
    selected_event = None
    if event_id:
        selected_event = event_service.get_by_id(event_id)
    elif upcoming_events:
        selected_event = upcoming_events[0]
        
    attendance_data = {}
    if selected_event:
        attendance_data = event_service.get_attendance(selected_event['_id'])
    
    return render_template('coach/attendance.html', 
        events=upcoming_events, 
        players=players,
        selected_event=selected_event,
        attendance_data=attendance_data
    )

@coach_bp.route('/attendance/update', methods=['POST'])
@login_required
@role_required('coach', 'admin')
def update_attendance():
    """Update bulk attendance for an event"""
    data = request.json
    event_id = data.get('event_id')
    attendance = data.get('attendance', {})
    
    if not event_id:
        return {"error": "Missing event_id"}, 400
        
    from app.services import get_event_service
    event_service = get_event_service()
    
    event_service.set_bulk_attendance(event_id, attendance)
        
    return {"status": "success"}

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
    
    active_lineup = player_service.get_active_lineup(club_id)
    players = player_service.get_by_club(club_id)
    
    return render_template('coach/tactics.html', 
        lineup=active_lineup,
        players=players
    )

@coach_bp.route('/tactics/save', methods=['POST'])
@login_required
@role_required('coach', 'admin')
def save_tactics():
    """Save club tactical lineup"""
    data = request.json
    club_id = session.get('club_id')
    
    from app.services import get_player_service
    player_service = get_player_service()
    
    player_service.save_lineup(
        club_id=club_id,
        formation=data.get('formation'),
        starters=data.get('starters')
    )
    
    return {"status": "success"}

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
@coach_bp.route('/match-center/<match_id>')
@login_required
@role_required('coach', 'admin')
def match_center(match_id=None):
    """Match center"""
    club_id = session.get('club_id')
    if not club_id:
        return redirect(url_for('main.index'))
    
    from app.services import get_match_service, get_player_service
    match_service = get_match_service()
    player_service = get_player_service()
    
    upcoming = match_service.get_upcoming(club_id)
    completed = match_service.get_completed(club_id)
    
    selected_match = None
    if match_id:
        selected_match = match_service.get_by_id(match_id)
    elif upcoming:
        selected_match = upcoming[0]
    elif completed:
        selected_match = completed[0]
        
    players = player_service.get_by_club(club_id)
    
    return render_template('coach/match_center.html',
        upcoming_matches=upcoming,
        completed_matches=completed,
        selected_match=selected_match,
        players=players
    )

@coach_bp.route('/match-center/update-score', methods=['POST'])
@login_required
@role_required('coach', 'admin')
def update_score():
    """Update match score"""
    data = request.json
    match_id = data.get('match_id')
    home_score = int(data.get('home_score', 0))
    away_score = int(data.get('away_score', 0))
    
    from app.services import get_match_service
    match_service = get_match_service()
    
    match_service.set_score(match_id, home_score, away_score)
    return {"status": "success"}

@coach_bp.route('/match-center/add-event', methods=['POST'])
@login_required
@role_required('coach', 'admin')
def add_match_event():
    """Add event to match"""
    data = request.json
    match_id = data.get('match_id')
    event_type = data.get('type')
    player_id = data.get('player_id')
    minute = int(data.get('minute', 0))
    
    from app.services import get_match_service
    match_service = get_match_service()
    
    match_service.add_event(match_id, event_type, player_id, minute)
    return {"status": "success"}

