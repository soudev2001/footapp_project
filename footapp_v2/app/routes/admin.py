# FootApp V2 - Admin Routes

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.routes.auth import login_required, role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# ============================================================
# ADMIN ROUTES
# ============================================================

@admin_bp.route('/')
@admin_bp.route('/panel')
@login_required
@role_required('admin')
def admin_panel():
    """Admin dashboard panel"""
    from app.services import get_club_service, get_user_service, get_player_service
    from app.services.db import get_stats
    
    stats = get_stats()
    
    return render_template('admin/panel.html', stats=stats)

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
    new_role = request.form.get('role')
    if new_role in ['admin', 'coach', 'player', 'fan']:
        from app.services import get_user_service
        user_service = get_user_service()
        user_service.collection.update_one(
            {'_id': user_id},
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
