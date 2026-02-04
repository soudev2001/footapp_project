# FootLogic Elite - Isy Club Routes
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from datetime import datetime
from app.routes.auth import login_required, role_required
from app.services import get_isy_service, get_user_service, get_club_service, get_player_service

isy_bp = Blueprint('isy', __name__, url_prefix='/isy')

@isy_bp.route('/hub')
@login_required
@role_required('admin', 'coach')
def hub():
    isy_service = get_isy_service()
    user_service = get_user_service()
    
    user = user_service.get_by_id(session.get('user_id'))
    club_id = user.get('club_id')
    
    if not club_id:
        flash("Veuillez d'abord rejoindre ou créer un club.", "warning")
        return redirect(url_for('main.index'))
        
    sponsors = isy_service.get_sponsors(club_id)
    payments = isy_service.get_payments(club_id)
    events = isy_service.get_community_events(club_id)
    
    # Summary stats
    stats = {
        'total_sponsors': len(sponsors),
        'pending_payments': len([p for p in payments if p.get('status') == 'pending']),
        'total_revenue': sum([p.get('amount', 0) for p in payments if p.get('status') == 'confirmed']),
        'upcoming_events': len([e for e in events if e.get('date', datetime.utcnow()) > datetime.utcnow()])
    }
    
    return render_template('isy/hub.html', sponsors=sponsors, payments=payments, events=events, stats=stats)

@isy_bp.route('/payments', methods=['GET', 'POST'])
@login_required
@role_required('admin', 'coach')
def payments():
    isy_service = get_isy_service()
    user_service = get_user_service()
    
    user = user_service.get_by_id(session.get('user_id'))
    club_id = user.get('club_id')
    
    if request.method == 'POST':
        user_email = request.form.get('user_email')
        amount = request.form.get('amount')
        description = request.form.get('description')
        
        target_user = user_service.get_by_email(user_email)
        if target_user:
            isy_service.add_payment(club_id, target_user['_id'], amount, description)
            flash("Paiement enregistré avec succès.", "success")
        else:
            flash("Utilisateur non trouvé.", "error")
            
    payments = isy_service.get_payments(club_id)
    # Join with user names for display
    for p in payments:
        u = user_service.get_by_id(p['user_id'])
        p['user_name'] = f"{u['profile']['first_name']} {u['profile']['last_name']}" if u else "Inconnu"
        
    return render_template('isy/payments.html', payments=payments)

@isy_bp.route('/payments/<payment_id>/confirm', methods=['POST'])
@login_required
@role_required('admin', 'coach')
def confirm_payment(payment_id):
    isy_service = get_isy_service()
    isy_service.update_payment_status(payment_id, 'confirmed')
    flash("Paiement confirmé.", "success")
    return redirect(url_for('isy.payments'))

@isy_bp.route('/sponsors', methods=['GET', 'POST'])
@login_required
@role_required('admin', 'coach')
def sponsors():
    isy_service = get_isy_service()
    user_service = get_user_service()
    
    user = user_service.get_by_id(session.get('user_id'))
    club_id = user.get('club_id')
    
    if request.method == 'POST':
        name = request.form.get('name')
        level = request.form.get('level')
        contribution = request.form.get('contribution')
        website = request.form.get('website', '')
        
        isy_service.add_sponsor(club_id, {
            'name': name,
            'level': level,
            'contribution': float(contribution) if contribution else 0,
            'website': website,
            'logo_url': f"https://logo.clearbit.com/{website}" if website else ""
        })
        flash("Sponsor ajouté avec succès.", "success")
        
    sponsors = isy_service.get_sponsors(club_id)
    return render_template('isy/sponsors.html', sponsors=sponsors)

@isy_bp.route('/events/add', methods=['POST'])
@login_required
@role_required('admin', 'coach')
def add_event():
    isy_service = get_isy_service()
    user_service = get_user_service()
    
    user = user_service.get_by_id(session.get('user_id'))
    club_id = user.get('club_id')
    
    title = request.form.get('title')
    date = request.form.get('date')
    type = request.form.get('type')
    description = request.form.get('description')
    
    isy_service.add_community_event(club_id, {
        'title': title,
        'date': date,
        'type': type,
        'description': description
    })
    
    flash("Événement communautaire ajouté !", "success")
    return redirect(url_for('isy.hub'))
@isy_bp.route('/about')
@login_required
def about():
    return render_template('isy/about.html')
@isy_bp.route('/members')
@login_required
@role_required('admin', 'coach')
def members():
    isy_service = get_isy_service()
    player_service = get_player_service()
    # Assume club_id is in session or fixed for demo
    club_id = session.get('club_id')
    members_list = player_service.get_by_club(club_id) if club_id else []
    return render_template('isy/members.html', members=members_list)
@isy_bp.route('/broadcast', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def broadcast():
    isy_service = get_isy_service()
    club_id = session.get('club_id')
    
    if request.method == 'POST':
        data = {
            'title': request.form.get('title'),
            'content': request.form.get('content'),
            'targets': request.form.getlist('targets'),
        }
        isy_service.send_broadcast(club_id, session.get('user_id'), data)
        flash("Message officiel envoyé !", "success")
        return redirect(url_for('isy.broadcast'))

    broadcasts = isy_service.get_broadcasts(club_id) if club_id else []
    return render_template('isy/broadcast.html', broadcasts=broadcasts)
@isy_bp.route('/event/<event_id>/manage')
@login_required
@role_required('admin', 'coach')
def manage_event(event_id):
    isy_service = get_isy_service()
    player_service = get_player_service()
    club_id = session.get('club_id')
    
    event = isy_service.db.community_events.find_one({'_id': ObjectId(event_id)})
    if not event:
        flash("Événement introuvable", "error")
        return redirect(url_for('isy.hub'))
        
    players = player_service.get_by_club(club_id) if club_id else []
    
    return render_template('isy/manage_event.html', event=event, players=players)

@isy_bp.route('/event/<event_id>/invite', methods=['POST'])
@login_required
@role_required('admin', 'coach')
def invite_players(event_id):
    isy_service = get_isy_service()
    player_ids = request.form.getlist('player_ids')
    isy_service.invite_to_event(event_id, player_ids)
    flash(f"{len(player_ids)} joueurs convoqués !", "success")
    return redirect(url_for('isy.manage_event', event_id=event_id))

@isy_bp.route('/event/<event_id>/performance', methods=['POST'])
@login_required
@role_required('admin', 'coach')
def save_performance(event_id):
    isy_service = get_isy_service()
    
    performance_data = {
        'score_us': request.form.get('score_us'),
        'score_them': request.form.get('score_them'),
        'scorers': request.form.getlist('scorers'),
        'assists': request.form.getlist('assists'),
        'man_of_the_match': request.form.get('motm'),
        'notes': request.form.get('notes'),
        'recorded_at': datetime.utcnow()
    }
    
    isy_service.save_match_performance(event_id, performance_data)
    flash("Statistiques du match enregistrées !", "success")
    return redirect(url_for('isy.manage_event', event_id=event_id))

@isy_bp.route('/partners')
@login_required
def partners():
    isy_service = get_isy_service()
    club_id = session.get('club_id')
    sponsors = isy_service.get_sponsors(club_id) if club_id else []
    return render_template('isy/partners.html', sponsors=sponsors)

@isy_bp.route('/guide')
@login_required
def guide():
    return render_template('isy/guide.html')
