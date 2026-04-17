# FootLogic V2 - Admin Routes

import io
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, send_file, jsonify
from app.routes.auth import login_required, role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# ============================================================
# ADMIN ROUTES
# ============================================================

@admin_bp.route('/')
@admin_bp.route('/dashboard')
@login_required
@role_required('admin')
def dashboard():
    """Mega Dashboard Centralisé (Club + Platform)"""
    from app.services import get_club_service, get_user_service, get_project_service
    user_service = get_user_service()
    club_service = get_club_service()
    project_service = get_project_service()
    user_service = get_user_service()
    club_service = get_club_service()

    user = user_service.get_by_id(session.get('user_id'))
    club_id = user.get('club_id')

    club = None
    members = []
    teams = []
    if club_id:
        from app.services import get_team_service
        club = club_service.get_by_id(club_id)
        members = user_service.get_members_by_club(club_id)
        team_service = get_team_service()
        teams = team_service.get_by_club(club_id)

    from app.services import get_subscription_service
    subscription_service = get_subscription_service()
    subscription = subscription_service.get_subscription_status(club_id) if club_id else None

    # Mock specific stats
    stats = {
        'total_members': len(members),
        'total_teams': len(teams),
        'coaches': len([m for m in members if m.get('role') == 'coach']),
        'players': len([m for m in members if m.get('role') == 'player']),
        'mrr': subscription['billing']['total_monthly'] if subscription and subscription.get('billing') else "0.00"
    }

    # --- Platform Stats (SuperAdmin) ---
    projects = project_service.get_all_projects()
    active_tickets_count = project_service.tickets_collection.count_documents({'status': {'$ne': 'done'}})
    superadmin_count = user_service.collection.count_documents({'role': 'admin', 'club_id': None})

    return render_template('admin/panel.html',
        club=club,
        members=members,
        teams=teams,
        stats=stats,
        subscription=subscription,
        plans=subscription_service.get_plans(),
        projects=projects,
        total_projects=len(projects),
        active_tickets=active_tickets_count,
        superadmin_count=superadmin_count
    )

@admin_bp.route('/add-member', methods=['POST'])
@login_required
@role_required('admin')
def add_member():
    """Add a new member to the club"""
    from app.services import get_user_service
    user_service = get_user_service()

    email = request.form.get('email')
    role = request.form.get('role', 'player')
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    team_id = request.form.get('team_id')

    # Use current admin's club_id
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')

    if user_service.get_by_email(email):
        flash('Cet email est deja utilise.', 'error')
    else:
        profile = {
            'first_name': first_name,
            'last_name': last_name,
            'avatar': '',
            'phone': ''
        }
        # Create a pending user (no password yet)
        new_user = user_service.create_pending_user(email, role=role, club_id=club_id, profile=profile)

        # If the member is a player, create their player profile too
        if role == 'player':
            from app.services import get_player_service
            player_service = get_player_service()
            player_service.create(
                club_id=club_id,
                user_id=new_user['_id'],
                team_id=team_id if team_id else None,
                name=f"{first_name} {last_name}",
                position="À définir",
                jersey_number=None
            )

        # Automatically send invitation
        from app.services import get_notification_service
        notification_service = get_notification_service()
        notification_service.send_invitation(new_user)

        flash(f'Membre {first_name} ajouté en attente. Une invitation a été envoyée à {email}.', 'success')

    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/invite-member', methods=['POST'])
@login_required
@role_required('admin')
def invite_member():
    """Send or Resend an invitation email"""
    from app.services import get_user_service, get_notification_service
    user_service = get_user_service()
    notification_service = get_notification_service()

    email = request.form.get('email')
    user = user_service.get_by_email(email)

    if user:
        if user.get('account_status') == 'active':
            flash(f'L\'utilisateur {email} est déjà actif.', 'info')
        else:
            # Re-generate token if missing
            if not user.get('invitation_token'):
                import secrets
                from bson import ObjectId
                token = secrets.token_urlsafe(32)
                user_service.collection.update_one(
                    {'_id': user['_id']},
                    {'$set': {'invitation_token': token}}
                )
                user['invitation_token'] = token

            notification_service.send_invitation(user)
            flash(f'Invitation renvoyée avec succès à {email}!', 'success')
    else:
        flash(f'Utilisateur avec l\'email {email} non trouvé.', 'error')

    return redirect(url_for('admin.dashboard'))

# ============================================================
# MEMBER ONBOARDING ROUTES
# ============================================================

@admin_bp.route('/onboarding', methods=['GET'])
@login_required
@role_required('admin')
def onboarding():
    from app.services import get_member_onboarding_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')

    onboarding_service = get_member_onboarding_service()
    status_filter = request.args.get('status')
    invitations = onboarding_service.get_invitation_dashboard(club_id, status_filter)

    return render_template('admin/onboarding_dashboard.html', invitations=invitations, status_filter=status_filter)

@admin_bp.route('/onboarding/import', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def bulk_import():
    from app.services import get_member_onboarding_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')

    if request.method == 'POST':
        if 'csv_file' not in request.files:
            flash('Aucun fichier sélectionné', 'error')
            return redirect(url_for('admin.bulk_import'))

        file = request.files['csv_file']
        if file.filename == '':
            flash('Aucun fichier sélectionné', 'error')
            return redirect(url_for('admin.bulk_import'))

        if not file.filename.endswith('.csv'):
            flash('Le fichier doit être au format CSV', 'error')
            return redirect(url_for('admin.bulk_import'))

        onboarding_service = get_member_onboarding_service()
        file_content = file.read()

        valid_rows, errors = onboarding_service.validate_csv(file_content, club_id)

        # Store valid rows in session temporarily for confirmation step
        session['onboarding_valid_rows'] = valid_rows

        return render_template('admin/onboarding_import_preview.html',
                               valid_rows=valid_rows,
                               errors=errors)

    return render_template('admin/onboarding_import.html')

@admin_bp.route('/onboarding/import/confirm', methods=['POST'])
@login_required
@role_required('admin')
def confirm_import():
    from app.services import get_member_onboarding_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')

    valid_rows = session.get('onboarding_valid_rows')
    if not valid_rows:
        flash('Session expirée ou données invalides. Veuillez recommencer.', 'error')
        return redirect(url_for('admin.bulk_import'))

    custom_message = request.form.get('custom_message')

    onboarding_service = get_member_onboarding_service()
    result = onboarding_service.bulk_import_members(club_id, valid_rows, custom_message)

    # Clear session data
    session.pop('onboarding_valid_rows', None)

    flash(f"{result['created_count']} membre(s) importé(s) avec succès. Les invitations ont été envoyées.", 'success')
    return redirect(url_for('admin.onboarding'))

@admin_bp.route('/onboarding/resend', methods=['POST'])
@login_required
@role_required('admin')
def bulk_resend():
    from app.services import get_member_onboarding_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')

    member_ids = request.form.getlist('member_ids')
    if not member_ids:
        flash('Aucun membre sélectionné.', 'error')
        return redirect(url_for('admin.onboarding'))

    onboarding_service = get_member_onboarding_service()
    success_count = onboarding_service.resend_invitations(club_id, member_ids)

    flash(f'{success_count} invitation(s) renvoyée(s) avec succès.', 'success')
    return redirect(url_for('admin.onboarding'))


@admin_bp.route('/update-subscription', methods=['POST'])
@login_required
@role_required('admin')
def update_subscription():
    """Update club subscription plan"""
    from app.services import get_subscription_service, get_user_service
    subscription_service = get_subscription_service()
    user_service = get_user_service()

    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')

    plan_id = request.form.get('plan_id')

    if not club_id:
        flash('Erreur: Aucun club associe.', 'error')
        return redirect(url_for('admin.dashboard'))

    subscription_service.update_subscription(club_id, plan_id)

    flash(f'Plan mis a jour vers {plan_id.replace("_", " ").title()}!', 'success')
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/update-club', methods=['POST'])
@login_required
@role_required('admin')
def update_club():
    """Update club configuration"""
    from app.services import get_club_service, get_user_service
    user_service = get_user_service()
    club_service = get_club_service()

    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')

    if not club_id:
        flash('Erreur: Aucun club associe.', 'error')
        return redirect(url_for('admin.dashboard'))

    name = request.form.get('name')
    city = request.form.get('city')
    founded_year = request.form.get('founded_year')
    description = request.form.get('description')

    logo = request.form.get('logo')
    primary_color = request.form.get('primary_color')
    secondary_color = request.form.get('secondary_color')
    accent_color = request.form.get('accent_color')

    update_data = {
        'name': name,
        'city': city,
        'founded_year': int(founded_year) if founded_year else 1985,
        'description': description
    }

    if logo:
        update_data['logo'] = logo
    if primary_color and secondary_color:
        update_data['colors'] = {
            'primary': primary_color,
            'secondary': secondary_color,
            'accent': accent_color or '#8b5cf6'
        }

    club_service.update(club_id, update_data)

    flash(f'Configuration du club mise à jour !', 'success')
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/users')
@login_required
@role_required('admin')
def users():
    """User management"""
    from app.services import get_user_service
    user_service = get_user_service()

    users = user_service.collection.find().limit(100)
    return render_template('admin/users.html', users=list(users))

@admin_bp.route('/users/<user_id>/edit', methods=['POST'])
@login_required
@role_required('admin')
def edit_member(user_id):
    """Edit Member (Role, Name, Team)"""
    from bson import ObjectId
    from app.services import get_user_service
    user_service = get_user_service()

    admin_user = user_service.get_by_id(session.get('user_id'))

    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    role = request.form.get('role')

    update_data = {}
    if role in ['admin', 'coach', 'player', 'parent', 'fan']:
        update_data['role'] = role
    if first_name or last_name:
        user = user_service.get_by_id(user_id)
        profile = user.get('profile', {})
        if first_name: profile['first_name'] = first_name
        if last_name: profile['last_name'] = last_name
        update_data['profile'] = profile

    if update_data:
        user_service.collection.update_one(
            {'_id': ObjectId(user_id), 'club_id': admin_user.get('club_id')},
            {'$set': update_data}
        )
        flash(f'Membre mis à jour avec succès.', 'success')

    return redirect(url_for('admin.dashboard') + '#members')

@admin_bp.route('/users/<user_id>/delete', methods=['POST'])
@login_required
@role_required('admin')
def delete_member(user_id):
    """Delete a Member"""
    from bson import ObjectId
    from app.services import get_user_service, get_player_service
    user_service = get_user_service()
    player_service = get_player_service()

    # Simple hard-delete or status change, for this version we do hard-delete
    user = user_service.get_by_id(user_id)
    if user:
        if user.get('role') == 'player':
            player = player_service.collection.find_one({'user_id': ObjectId(user_id)})
            if player:
                player_service.delete(player['_id'])
        user_service.collection.delete_one({'_id': ObjectId(user_id)})
        flash('Membre supprimé définitivement.', 'success')

    return redirect(url_for('admin.dashboard') + '#members')

@admin_bp.route('/clubs')
@login_required
@role_required('admin')
def clubs():
    """Club management"""
    from app.services import get_club_service
    club_service = get_club_service()

    clubs = club_service.get_all()
    return render_template('admin/clubs.html', clubs=clubs)

@admin_bp.route('/clubs/create', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def create_club():
    """Create new club and invite its admin"""
    if request.method == 'POST':
        from app.services import get_club_service, get_user_service, get_notification_service
        club_service = get_club_service()
        user_service = get_user_service()
        notification_service = get_notification_service()

        name = request.form.get('name')
        admin_email = request.form.get('admin_email', '').lower()

        # 1. Verification
        if not admin_email:
            flash("L'email de l'administrateur est requis.", 'error')
            return redirect(url_for('admin.create_club'))

        if user_service.get_by_email(admin_email):
            flash(f"L'email {admin_email} est déjà utilisé par un autre compte.", 'error')
            return redirect(url_for('admin.create_club'))

        # 2. Add Club
        club = club_service.create(
            name=name,
            city=request.form.get('city'),
            colors={
                'primary': request.form.get('primary_color', '#1e40af'),
                'secondary': request.form.get('secondary_color', '#ffffff')
            },
            stadium=request.form.get('stadium', ''),
            description=request.form.get('description', '')
        )

        # 3. Add Pending Admin User
        profile = {
            'first_name': 'Admin',
            'last_name': name,
            'avatar': '',
            'phone': ''
        }
        new_admin = user_service.create_pending_user(admin_email, role='admin', club_id=club['_id'], profile=profile)

        # 4. Send Invitation Email
        notification_service.send_invitation(new_admin)

        flash(f'Club {name} créé avec succès. Une invitation a été envoyée à {admin_email}.', 'success')
        return redirect(url_for('admin.clubs'))

    return render_template('admin/create_club.html')

@admin_bp.route('/seed')
@login_required
@role_required('admin')
def seed_page():
    """Seed confirmation page"""
    return render_template('admin/seed.html')

@admin_bp.route('/seed-demo', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def seed_demo():
    """Seed demo data (admin only)"""
    from app.services.seed_data import seed_all
    try:
        seed_all()
        flash('Donnees de demo injectees avec succes!', 'success')
    except Exception as e:
        flash(f'Erreur: {str(e)}', 'error')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/seed-players', methods=['POST'])
@login_required
@role_required('admin')
def seed_players():
    """Seed 18 demo players with French names for the current club"""
    from app.services.seed_data import seed_18_players
    from app.services import get_user_service

    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')

    if not club_id:
        flash('Erreur: Aucun club associé.', 'error')
        return redirect(url_for('coach.roster'))

    team_id = request.form.get('team_id') or None

    try:
        players = seed_18_players(club_id, team_id)
        flash(f'{len(players)} joueurs créés avec succès!', 'success')
    except Exception as e:
        flash(f'Erreur: {str(e)}', 'error')

    return redirect(url_for('coach.roster', team_id=team_id) if team_id else url_for('coach.roster'))

@admin_bp.route('/architecture')
@login_required
@role_required('admin')
def architecture():
    """System architecture view"""
    return render_template('admin/architecture.html')

# --- TEAMS MANAGEMENT ---

@admin_bp.route('/teams/add', methods=['POST'])
@login_required
@role_required('admin')
def add_team():
    """Add a new team to the club"""
    from app.services import get_team_service, get_user_service
    user_service = get_user_service()
    team_service = get_team_service()

    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')

    name = request.form.get('name')
    category = request.form.get('category', 'Senior')
    description = request.form.get('description', '')
    colors = {
        'primary': request.form.get('primary_color', '#10b981'),
        'secondary': request.form.get('secondary_color', '#0f172a')
    }

    team_service.create(club_id, name, category, description=description, colors=colors)
    flash(f'Équipe {name} créée avec succès !', 'success')
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/teams/<team_id>/update-colors', methods=['POST'])
@login_required
@role_required('admin')
def update_team_colors(team_id):
    """Update team primary and secondary colors"""
    from app.services import get_team_service
    team_service = get_team_service()

    colors = {
        'primary': request.form.get('primary_color'),
        'secondary': request.form.get('secondary_color')
    }

    team_service.update(team_id, {'colors': colors})
    flash('Couleurs de l\'équipe mises à jour !', 'success')
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/teams/<team_id>/edit', methods=['POST'])
@login_required
@role_required('admin')
def edit_team(team_id):
    """Edit team details (name, category, description)"""
    from app.services import get_team_service
    team_service = get_team_service()

    name = request.form.get('name')
    category = request.form.get('category')
    description = request.form.get('description')

    update_data = {}
    if name: update_data['name'] = name
    if category: update_data['category'] = category
    if description is not None: update_data['description'] = description

    if update_data:
        team_service.update(team_id, update_data)
        flash('Détails de l\'équipe mis à jour !', 'success')

    return redirect(url_for('admin.dashboard') + '#teams')

@admin_bp.route('/teams/<team_id>/delete', methods=['POST'])
@login_required
@role_required('admin')
def delete_team(team_id):
    """Delete a team"""
    from app.services import get_team_service
    team_service = get_team_service()
    team_service.delete(team_id)
    flash('Équipe supprimée avec succès.', 'success')
    return redirect(url_for('admin.dashboard'))

# --- PLATFORM / PROJECT MANAGEMENT (SuperAdmin) ---

@admin_bp.route('/projects')
@login_required
@role_required('admin')
def project_list():
    from app.services import get_project_service
    project_service = get_project_service()
    projects = project_service.get_all_projects()
    return render_template('superadmin/projects.html', projects=projects)

@admin_bp.route('/projects/create', methods=['POST'])
@login_required
@role_required('admin')
def create_project():
    name = request.form.get('name')
    description = request.form.get('description')
    owner_id = session.get('user_id')

    from app.services import get_project_service
    project_service = get_project_service()
    project_service.create_project(name, description, owner_id)

    flash('Projet créé avec succès.', 'success')
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/projects/<project_id>')
@login_required
@role_required('admin')
def project_detail(project_id):
    from app.services import get_project_service
    project_service = get_project_service()
    project = project_service.get_project(project_id)
    tickets = project_service.get_project_tickets(project_id)
    return render_template('superadmin/project_detail.html', project=project, tickets=tickets)

@admin_bp.route('/projects/<project_id>/tickets/create', methods=['POST'])
@login_required
@role_required('admin')
def create_ticket(project_id):
    title = request.form.get('title')
    description = request.form.get('description')
    ticket_type = request.form.get('type', 'task')
    priority = request.form.get('priority', 'medium')
    reporter_id = session.get('user_id')

    from app.services import get_project_service
    project_service = get_project_service()
    project_service.create_ticket(project_id, title, description, reporter_id, ticket_type, priority)

    flash('Ticket créé avec succès.', 'success')
    return redirect(url_for('admin.project_detail', project_id=project_id))

@admin_bp.route('/tickets/<ticket_id>/update-status', methods=['POST'])
@login_required
@role_required('admin')
def update_ticket_status(ticket_id):
    new_status = request.form.get('status')
    project_id = request.form.get('project_id')

    from app.services import get_project_service
    project_service = get_project_service()
    project_service.update_ticket(ticket_id, {'status': new_status})

    flash('Statut du ticket mis à jour.', 'success')
    return redirect(url_for('admin.project_detail', project_id=project_id))


# ============================================================
# ANALYTICS DASHBOARD
# ============================================================

@admin_bp.route('/analytics')
@login_required
@role_required('admin')
def analytics():
    """Full analytics dashboard."""
    from app.services import get_analytics_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé à ce compte.', 'error')
        return redirect(url_for('admin.dashboard'))
    analytics_service = get_analytics_service()
    summary = analytics_service.get_dashboard_summary(club_id)
    return render_template('admin/analytics.html', summary=summary)


@admin_bp.route('/analytics/data')
@login_required
@role_required('admin')
def analytics_data():
    """JSON endpoint for Chart.js — returns full summary."""
    from flask import jsonify
    from app.services import get_analytics_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        return jsonify({'error': 'No club'}), 400
    from app.models import serialize_doc
    analytics_service = get_analytics_service()
    summary = analytics_service.get_dashboard_summary(club_id)
    return jsonify(serialize_doc(summary))


@admin_bp.route('/analytics/export')
@login_required
@role_required('admin')
def analytics_export():
    """Export analytics as PDF or Excel."""
    from flask import send_file
    from app.services import get_analytics_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.analytics'))

    fmt = request.args.get('format', 'pdf')
    analytics_service = get_analytics_service()

    if fmt == 'excel':
        data = analytics_service.export_excel(club_id)
        if data is None:
            flash('openpyxl non installé. Lancez : pip install openpyxl', 'error')
            return redirect(url_for('admin.analytics'))
        return send_file(
            io.BytesIO(data),
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f"rapport_club_{datetime.utcnow().strftime('%Y%m%d')}.xlsx"
        )
    else:
        data = analytics_service.export_pdf(club_id)
        if data is None:
            flash('reportlab non installé. Lancez : pip install reportlab', 'error')
            return redirect(url_for('admin.analytics'))
        return send_file(
            io.BytesIO(data),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"rapport_club_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
        )


# ============================================================
# MEMBER DIRECTORY
# ============================================================

@admin_bp.route('/members')
@login_required
@role_required('admin')
def members_directory():
    """Searchable member directory with filters and pagination."""
    from app.services import get_user_service, get_team_service
    user_service = get_user_service()
    team_service = get_team_service()

    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))

    search    = request.args.get('search', '').strip()
    role      = request.args.get('role', '')
    team_id   = request.args.get('team_id', '')
    status    = request.args.get('status', '')
    page      = max(1, int(request.args.get('page', 1)))
    per_page  = 25

    all_members = user_service.search_members(club_id, search, role, team_id, status)
    total = len(all_members)

    # Pagination slice
    members = all_members[(page - 1) * per_page: page * per_page]

    # Enrich with team names
    teams = list(team_service.get_by_club(club_id))
    team_map = {str(t['_id']): t.get('name', '') for t in teams}

    for m in members:
        # Try to get team name from player record or direct team_id field
        m['team_name'] = team_map.get(str(m.get('team_id', '')), '')

    return render_template('admin/members_directory.html',
                           members=members, teams=teams,
                           search=search, role=role,
                           team_id=team_id, status=status,
                           total=total, page=page, per_page=per_page)


# ============================================================
# ANNOUNCEMENTS
# ============================================================

@admin_bp.route('/announcements')
@login_required
@role_required('admin')
def announcements():
    """Announcement history + send form."""
    from app.services import get_announcement_service, get_user_service, get_team_service
    user_service = get_user_service()
    team_service = get_team_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))
    announcement_service = get_announcement_service()
    history = announcement_service.get_announcements(club_id)
    teams = team_service.get_by_club(club_id)
    return render_template('admin/announcements.html', history=history, teams=teams)


@admin_bp.route('/announcements/preview')
@login_required
@role_required('admin')
def announcements_preview():
    """Return JSON preview of recipients before sending."""
    from flask import jsonify
    from app.services import get_announcement_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        return jsonify({'count': 0, 'recipients': []})
    target_type = request.args.get('target_type', 'all')
    target_id = request.args.get('target_id', '')
    announcement_service = get_announcement_service()
    recipients = announcement_service.get_announcement_recipients(club_id, target_type, target_id)
    return jsonify({'count': len(recipients), 'recipients': [
        {'name': f"{r.get('profile', {}).get('first_name', '')} {r.get('profile', {}).get('last_name', '')}".strip(),
         'email': r.get('email', ''), 'role': r.get('role', '')}
        for r in recipients
    ]})


@admin_bp.route('/announcements/send', methods=['POST'])
@login_required
@role_required('admin')
def send_announcement():
    """Send an announcement to a target audience."""
    from app.services import get_announcement_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.announcements'))

    subject     = request.form.get('subject', '').strip()
    body        = request.form.get('body', '').strip()
    target_type = request.form.get('target_type', 'all')
    # The template submits target_id_role or target_id_team depending on selection
    if target_type == 'role':
        target_id = request.form.get('target_id_role', '')
    elif target_type == 'team':
        target_id = request.form.get('target_id_team', '')
    else:
        target_id = request.form.get('target_id', '')

    if not subject or not body:
        flash('Le sujet et le corps du message sont obligatoires.', 'error')
        return redirect(url_for('admin.announcements'))

    announcement_service = get_announcement_service()
    result = announcement_service.send_announcement(
        club_id, subject, body, target_type, target_id, str(admin_user['_id'])
    )
    flash(f"Annonce envoyée à {result['recipient_count']} membre(s).", 'success')
    return redirect(url_for('admin.announcements'))


# ── Billing / Stripe ──────────────────────────────────────────────────────────

@admin_bp.route('/billing')
@login_required
def billing():
    """Billing dashboard: invoice history + Stripe checkout button."""
    from app.services import get_billing_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))
    billing_service = get_billing_service()
    data = billing_service.get_billing_dashboard(str(club_id))
    return render_template('admin/billing.html', **data)


@admin_bp.route('/billing/checkout', methods=['POST'])
@login_required
def billing_checkout():
    """Create a Stripe Checkout Session and redirect."""
    from app.services import get_billing_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.billing'))

    plan_name    = request.form.get('plan_name', 'Abonnement FootLogic')
    amount_cents = int(request.form.get('amount_cents', 2900))
    billing_service = get_billing_service()
    try:
        result = billing_service.create_checkout_session(
            club_id=str(club_id),
            plan_name=plan_name,
            amount_cents=amount_cents,
            success_url=url_for('admin.billing', _external=True, status='success'),
            cancel_url=url_for('admin.billing', _external=True, status='cancel'),
        )
        return redirect(result['url'])
    except RuntimeError as exc:
        flash(str(exc), 'error')
        return redirect(url_for('admin.billing'))


@admin_bp.route('/billing/webhook', methods=['POST'])
def billing_webhook():
    """Stripe webhook — must NOT be behind @login_required."""
    from app.services import get_billing_service
    billing_service = get_billing_service()
    payload    = request.get_data()
    sig_header = request.headers.get('Stripe-Signature', '')
    message, status = billing_service.handle_webhook(payload, sig_header)
    from flask import make_response
    return make_response(message, status)


@admin_bp.route('/billing/invoice/<invoice_id>/pdf')
@login_required
def billing_invoice_pdf(invoice_id):
    """Download a PDF invoice."""
    from app.services import get_billing_service
    billing_service = get_billing_service()
    pdf_bytes = billing_service.generate_invoice_pdf(invoice_id)
    if not pdf_bytes:
        flash('Facture introuvable ou génération PDF indisponible.', 'error')
        return redirect(url_for('admin.billing'))
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'facture_{invoice_id[-8:].upper()}.pdf',
    )


# ============================================================
# COMPETITIONS
# ============================================================

@admin_bp.route('/competitions')
@login_required
@role_required('admin')
def competitions_api():
    """Return competitions JSON for the admin panel tab"""
    from app.services import get_competition_service, get_user_service, get_team_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        return jsonify([])
    competition_service = get_competition_service()
    team_service = get_team_service()
    comps = competition_service.get_all(club_id)
    teams = team_service.get_by_club(club_id)
    from app.models import serialize_docs
    return jsonify({'competitions': serialize_docs(comps), 'teams': serialize_docs(teams)})


@admin_bp.route('/competitions/add', methods=['POST'])
@login_required
@role_required('admin')
def add_competition():
    from app.services import get_competition_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))

    competition_service = get_competition_service()

    start_date = None
    end_date = None
    if request.form.get('start_date'):
        try:
            start_date = datetime.strptime(request.form['start_date'], '%Y-%m-%d')
        except ValueError:
            pass
    if request.form.get('end_date'):
        try:
            end_date = datetime.strptime(request.form['end_date'], '%Y-%m-%d')
        except ValueError:
            pass

    data = {
        'name': request.form.get('name', '').strip(),
        'type': request.form.get('type', 'league'),
        'season': request.form.get('season', '').strip(),
        'category': request.form.get('category', '').strip(),
        'organizer': request.form.get('organizer', '').strip(),
        'start_date': start_date,
        'end_date': end_date,
        'status': request.form.get('status', 'active'),
        'notes': request.form.get('notes', '').strip(),
    }
    if not data['name']:
        flash('Le nom est obligatoire.', 'error')
        return redirect(url_for('admin.dashboard'))

    competition_service.create(club_id, data)
    flash(f"Compétition « {data['name']} » créée.", 'success')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/competitions/<comp_id>/edit', methods=['POST'])
@login_required
@role_required('admin')
def edit_competition(comp_id):
    from app.services import get_competition_service
    competition_service = get_competition_service()

    start_date = None
    end_date = None
    if request.form.get('start_date'):
        try:
            start_date = datetime.strptime(request.form['start_date'], '%Y-%m-%d')
        except ValueError:
            pass
    if request.form.get('end_date'):
        try:
            end_date = datetime.strptime(request.form['end_date'], '%Y-%m-%d')
        except ValueError:
            pass

    data = {
        'name': request.form.get('name', '').strip(),
        'type': request.form.get('type', 'league'),
        'season': request.form.get('season', '').strip(),
        'category': request.form.get('category', '').strip(),
        'organizer': request.form.get('organizer', '').strip(),
        'start_date': start_date,
        'end_date': end_date,
        'status': request.form.get('status', 'active'),
        'notes': request.form.get('notes', '').strip(),
    }
    competition_service.update(comp_id, data)
    flash('Compétition mise à jour.', 'success')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/competitions/<comp_id>/delete', methods=['POST'])
@login_required
@role_required('admin')
def delete_competition(comp_id):
    from app.services import get_competition_service
    competition_service = get_competition_service()
    competition_service.delete(comp_id)
    flash('Compétition supprimée.', 'success')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/competitions/export')
@login_required
@role_required('admin')
def export_competitions():
    from app.services import get_competition_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))
    competition_service = get_competition_service()
    data = competition_service.export_excel(club_id)
    return send_file(
        io.BytesIO(data),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f"competitions_{datetime.utcnow().strftime('%Y%m%d')}.xlsx"
    )


@admin_bp.route('/competitions/import', methods=['POST'])
@login_required
@role_required('admin')
def import_competitions():
    from app.services import get_competition_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))

    if 'file' not in request.files or request.files['file'].filename == '':
        flash('Aucun fichier sélectionné.', 'error')
        return redirect(url_for('admin.dashboard'))

    f = request.files['file']
    if not f.filename.lower().endswith('.xlsx'):
        flash('Le fichier doit être au format .xlsx', 'error')
        return redirect(url_for('admin.dashboard'))

    competition_service = get_competition_service()
    created, errors = competition_service.import_excel(club_id, f.read())
    if errors:
        flash(f"{created} compétition(s) importée(s). {len(errors)} erreur(s).", 'warning')
    else:
        flash(f"{created} compétition(s) importée(s) avec succès.", 'success')
    return redirect(url_for('admin.dashboard'))


# ============================================================
# MATCHES (Admin Calendar)
# ============================================================

@admin_bp.route('/matches')
@login_required
@role_required('admin')
def matches_api():
    """Return matches JSON for the admin panel tab"""
    from app.services import get_match_service, get_user_service, get_team_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        return jsonify([])
    match_service = get_match_service()
    team_service = get_team_service()
    matches = match_service.get_by_club(club_id)
    teams = team_service.get_by_club(club_id)
    from app.models import serialize_docs
    return jsonify({'matches': serialize_docs(matches), 'teams': serialize_docs(teams)})


@admin_bp.route('/matches/add', methods=['POST'])
@login_required
@role_required('admin')
def add_match():
    from app.services import get_match_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))

    match_service = get_match_service()

    opponent = request.form.get('opponent', '').strip()
    if not opponent:
        flash("L'adversaire est obligatoire.", 'error')
        return redirect(url_for('admin.dashboard'))

    date_str = request.form.get('date', '')
    time_str = request.form.get('time', '15:00')
    match_date = None
    if date_str:
        try:
            match_date = datetime.strptime(f"{date_str} {time_str}", '%Y-%m-%d %H:%M')
        except ValueError:
            try:
                match_date = datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                pass
    if not match_date:
        flash('Date invalide.', 'error')
        return redirect(url_for('admin.dashboard'))

    is_home = request.form.get('is_home') in ('1', 'true', 'on', 'yes')
    location = request.form.get('location', '').strip()
    competition = request.form.get('competition', '').strip()

    match = match_service.create(club_id, opponent, match_date, is_home=is_home, location=location)

    # Set team_id and competition
    updates = {}
    team_id = request.form.get('team_id', '').strip()
    if team_id:
        from bson import ObjectId as _ObjId
        updates['team_id'] = _ObjId(team_id)
    if competition:
        updates['competition'] = competition
    if updates:
        match_service.update(str(match['_id']), updates)

    flash(f"Match vs {opponent} créé.", 'success')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/matches/<match_id>/edit', methods=['POST'])
@login_required
@role_required('admin')
def edit_match(match_id):
    from app.services import get_match_service
    match_service = get_match_service()

    opponent = request.form.get('opponent', '').strip()
    date_str = request.form.get('date', '')
    time_str = request.form.get('time', '15:00')
    match_date = None
    if date_str:
        try:
            match_date = datetime.strptime(f"{date_str} {time_str}", '%Y-%m-%d %H:%M')
        except ValueError:
            try:
                match_date = datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                pass

    is_home = request.form.get('is_home') in ('1', 'true', 'on', 'yes')
    location = request.form.get('location', '').strip()
    status = request.form.get('status', 'scheduled')
    competition = request.form.get('competition', '').strip()

    data = {}
    if opponent:
        data['opponent'] = opponent
    if match_date:
        data['date'] = match_date
    data['is_home'] = is_home
    data['location'] = location
    data['status'] = status
    if competition:
        data['competition'] = competition

    team_id = request.form.get('team_id', '').strip()
    if team_id:
        from bson import ObjectId as _ObjId
        data['team_id'] = _ObjId(team_id)

    score_home = request.form.get('score_home')
    score_away = request.form.get('score_away')
    if score_home is not None and score_away is not None:
        try:
            data['score'] = {'home': int(score_home), 'away': int(score_away)}
        except ValueError:
            pass

    match_service.update(match_id, data)
    flash('Match mis à jour.', 'success')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/matches/<match_id>/delete', methods=['POST'])
@login_required
@role_required('admin')
def delete_match(match_id):
    from app.services import get_match_service
    match_service = get_match_service()
    match_service.delete(match_id)
    flash('Match supprimé.', 'success')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/matches/export')
@login_required
@role_required('admin')
def export_matches():
    from app.services import get_match_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))
    match_service = get_match_service()
    data = match_service.export_excel(club_id)
    return send_file(
        io.BytesIO(data),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f"matchs_{datetime.utcnow().strftime('%Y%m%d')}.xlsx"
    )


@admin_bp.route('/matches/import', methods=['POST'])
@login_required
@role_required('admin')
def import_matches():
    from app.services import get_match_service, get_user_service, get_team_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))

    if 'file' not in request.files or request.files['file'].filename == '':
        flash('Aucun fichier sélectionné.', 'error')
        return redirect(url_for('admin.dashboard'))

    f = request.files['file']
    if not f.filename.lower().endswith('.xlsx'):
        flash('Le fichier doit être au format .xlsx', 'error')
        return redirect(url_for('admin.dashboard'))

    # Build team name → id map for resolution
    team_service = get_team_service()
    teams = team_service.get_by_club(club_id)
    team_map = {t['name'].lower(): str(t['_id']) for t in teams if t.get('name')}

    match_service = get_match_service()
    created, errors = match_service.import_excel(club_id, f.read(), team_map=team_map)
    if errors:
        flash(f"{created} match(s) importé(s). {len(errors)} erreur(s).", 'warning')
    else:
        flash(f"{created} match(s) importé(s) avec succès.", 'success')
    return redirect(url_for('admin.dashboard'))


# ============================================================
# EVENT ROUTES
# ============================================================

@admin_bp.route('/events')
@login_required
@role_required('admin')
def events_api():
    """Return events JSON for the admin panel"""
    from app.services import get_event_service, get_user_service, get_team_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        return jsonify([])
    event_service = get_event_service()
    team_service = get_team_service()
    events = event_service.get_by_club(club_id)
    teams = team_service.get_by_club(club_id)
    from app.models import serialize_docs
    return jsonify({'events': serialize_docs(events), 'teams': serialize_docs(teams)})


@admin_bp.route('/events/add', methods=['POST'])
@login_required
@role_required('admin')
def add_event():
    from app.services import get_event_service, get_user_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        flash('Aucun club associé.', 'error')
        return redirect(url_for('admin.dashboard'))

    event_service = get_event_service()

    date_val = None
    if request.form.get('date'):
        try:
            time_str = request.form.get('time', '00:00')
            date_val = datetime.strptime(f"{request.form['date']} {time_str}", '%Y-%m-%d %H:%M')
        except ValueError:
            date_val = datetime.strptime(request.form['date'], '%Y-%m-%d')

    event_service.create(
        club_id=club_id,
        title=request.form['title'],
        event_type=request.form.get('type', 'training'),
        date=date_val,
        location=request.form.get('location', ''),
        description=request.form.get('description', ''),
        created_by=session.get('user_id'),
        category=request.form.get('category', ''),
        team_id=request.form.get('team_id', '')
    )
    flash('Événement créé avec succès.', 'success')
    return redirect(url_for('admin.dashboard') + '#events')


@admin_bp.route('/events/<event_id>/edit', methods=['POST'])
@login_required
@role_required('admin')
def edit_event(event_id):
    from app.services import get_event_service
    event_service = get_event_service()

    data = {}
    if request.form.get('title'):
        data['title'] = request.form['title']
    if request.form.get('type'):
        data['type'] = request.form['type']
    if request.form.get('location'):
        data['location'] = request.form['location']
    if request.form.get('description'):
        data['description'] = request.form['description']
    if request.form.get('category'):
        data['category'] = request.form['category']
    if request.form.get('team_id'):
        data['team_id'] = request.form['team_id']
    if request.form.get('date'):
        try:
            time_str = request.form.get('time', '00:00')
            data['date'] = datetime.strptime(f"{request.form['date']} {time_str}", '%Y-%m-%d %H:%M')
        except ValueError:
            pass

    event_service.update(event_id, data)
    flash('Événement mis à jour.', 'success')
    return redirect(url_for('admin.dashboard') + '#events')


@admin_bp.route('/events/<event_id>/delete', methods=['POST'])
@login_required
@role_required('admin')
def delete_event(event_id):
    from app.services import get_event_service
    event_service = get_event_service()
    event_service.delete(event_id)
    flash('Événement supprimé.', 'success')
    return redirect(url_for('admin.dashboard') + '#events')


@admin_bp.route('/calendar/data')
@login_required
@role_required('admin')
def calendar_data():
    """Return unified calendar data: competitions + matches + events"""
    from app.services import get_competition_service, get_match_service, get_event_service, get_user_service, get_team_service
    user_service = get_user_service()
    admin_user = user_service.get_by_id(session.get('user_id'))
    club_id = admin_user.get('club_id')
    if not club_id:
        return jsonify([])

    competition_service = get_competition_service()
    match_service = get_match_service()
    event_service = get_event_service()
    team_service = get_team_service()

    teams = team_service.get_by_club(club_id)
    team_map = {str(t['_id']): t.get('name', '') for t in teams}

    items = []

    # Competitions → calendar items (use start_date)
    for c in competition_service.get_all(club_id):
        if c.get('start_date'):
            items.append({
                'id': str(c['_id']),
                'title': c.get('name', ''),
                'date': c['start_date'].isoformat() if hasattr(c['start_date'], 'isoformat') else str(c['start_date']),
                'end_date': c['end_date'].isoformat() if c.get('end_date') and hasattr(c['end_date'], 'isoformat') else '',
                'type': 'competition',
                'subtype': c.get('type', ''),
                'status': c.get('status', ''),
                'category': c.get('category', ''),
                'location': '',
            })

    # Matches → calendar items
    for m in match_service.get_by_club(club_id):
        if m.get('date'):
            items.append({
                'id': str(m['_id']),
                'title': f"vs {m.get('opponent', '?')}",
                'date': m['date'].isoformat() if hasattr(m['date'], 'isoformat') else str(m['date']),
                'type': 'match',
                'subtype': 'home' if m.get('is_home') else 'away',
                'status': m.get('status', 'scheduled'),
                'category': '',
                'location': m.get('location', ''),
                'team': team_map.get(str(m.get('team_id', '')), ''),
                'score': m.get('score'),
                'competition': m.get('competition', ''),
            })

    # Events → calendar items
    for e in event_service.get_by_club(club_id):
        if e.get('date'):
            items.append({
                'id': str(e['_id']),
                'title': e.get('title', ''),
                'date': e['date'].isoformat() if hasattr(e['date'], 'isoformat') else str(e['date']),
                'type': 'event',
                'subtype': e.get('type', 'other'),
                'status': e.get('status', 'scheduled'),
                'category': e.get('category', ''),
                'location': e.get('location', ''),
                'description': e.get('description', ''),
            })

    from app.models import serialize_docs
    return jsonify(items)
