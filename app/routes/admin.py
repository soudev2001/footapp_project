# FootLogic V2 - Admin Routes

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.routes.auth import login_required, role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# ============================================================
# ADMIN ROUTES
# ============================================================

@admin_bp.route('/dashboard')
@login_required
@role_required('admin')
def dashboard():
    """Alias for admin_panel to prevent BuildError"""
    return redirect(url_for('admin.admin_panel'))

@admin_bp.route('/')
@admin_bp.route('/panel')
@login_required
@role_required('admin')
def admin_panel():
    """Club Admin Dashboard (SaaS)"""
    from app.services import get_club_service, get_user_service
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
    
    return render_template('admin/panel.html', 
        club=club, 
        members=members, 
        teams=teams, 
        stats=stats,
        subscription=subscription,
        plans=subscription_service.get_plans()
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
        
    return redirect(url_for('admin.admin_panel'))

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
        
    return redirect(url_for('admin.admin_panel'))

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
        return redirect(url_for('admin.admin_panel'))
        
    subscription_service.update_subscription(club_id, plan_id)
    
    flash(f'Plan mis a jour vers {plan_id.replace("_", " ").title()}!', 'success')
    return redirect(url_for('admin.admin_panel'))

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
        return redirect(url_for('admin.admin_panel'))
        
    name = request.form.get('name')
    city = request.form.get('city')
    founded_year = request.form.get('founded_year')
    description = request.form.get('description')
    
    logo = request.form.get('logo')
    primary_color = request.form.get('primary_color')
    secondary_color = request.form.get('secondary_color')
    
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
            'secondary': secondary_color
        }
    
    club_service.update(club_id, update_data)
    
    flash(f'Configuration du club mise à jour ! (Couleur : {primary_color})', 'success')
    return redirect(url_for('admin.admin_panel'))

@admin_bp.route('/users')
@login_required
@role_required('admin')
def users():
    """User management"""
    from app.services import get_user_service
    user_service = get_user_service()
    
    users = user_service.collection.find().limit(100)
    return render_template('admin/users.html', users=list(users))

@admin_bp.route('/users/<user_id>/role', methods=['POST'])
@login_required
@role_required('admin')
def change_role(user_id):
    """Change user role"""
    from bson import ObjectId
    new_role = request.form.get('role')
    if new_role in ['admin', 'coach', 'player', 'fan']:
        from app.services import get_user_service
        user_service = get_user_service()
        user_service.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'role': new_role}}
        )
        flash(f'Role modifie en {new_role}.', 'success')
    return redirect(url_for('admin.users'))

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
    """Create new club"""
    if request.method == 'POST':
        from app.services import get_club_service
        club_service = get_club_service()
        
        club = club_service.create(
            name=request.form.get('name'),
            city=request.form.get('city'),
            colors={
                'primary': request.form.get('primary_color', '#1e40af'),
                'secondary': request.form.get('secondary_color', '#ffffff')
            },
            stadium=request.form.get('stadium', ''),
            description=request.form.get('description', '')
        )
        flash('Club cree avec succes.', 'success')
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
    return redirect(url_for('admin.admin_panel'))

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
    return redirect(url_for('admin.admin_panel'))

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
    return redirect(url_for('admin.admin_panel'))

@admin_bp.route('/teams/<team_id>/delete', methods=['POST'])
@login_required
@role_required('admin')
def delete_team(team_id):
    """Delete a team"""
    from app.services import get_team_service
    team_service = get_team_service()
    team_service.delete(team_id)
    flash('Équipe supprimée avec succès.', 'success')
    return redirect(url_for('admin.admin_panel'))

