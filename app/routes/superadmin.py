# FootLogic V2 - Superadmin Routes

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.routes.auth import login_required, role_required
from app.services import get_project_service, get_user_service

superadmin_bp = Blueprint('superadmin', __name__, url_prefix='/superadmin')

@superadmin_bp.route('/')
@superadmin_bp.route('/dashboard')
@login_required
@role_required('admin')
def dashboard():
    project_service = get_project_service()
    projects = project_service.get_all_projects()
    
    # Calculate some stats for the dashboard
    total_projects = len(projects)
    
    return render_template('superadmin/dashboard.html', 
                         projects=projects,
                         total_projects=total_projects)

@superadmin_bp.route('/projects')
@login_required
@role_required('admin')
def project_list():
    project_service = get_project_service()
    projects = project_service.get_all_projects()
    return render_template('superadmin/projects.html', projects=projects)

@superadmin_bp.route('/projects/create', methods=['POST'])
@login_required
@role_required('admin')
def create_project():
    name = request.form.get('name')
    description = request.form.get('description')
    owner_id = session.get('user_id')
    
    project_service = get_project_service()
    project_service.create_project(name, description, owner_id)
    
    flash('Projet créé avec succès.', 'success')
    return redirect(url_for('superadmin.dashboard'))

@superadmin_bp.route('/projects/<project_id>')
@login_required
@role_required('admin')
def project_detail(project_id):
    project_service = get_project_service()
    project = project_service.get_project(project_id)
    tickets = project_service.get_project_tickets(project_id)
    return render_template('superadmin/project_detail.html', project=project, tickets=tickets)

@superadmin_bp.route('/projects/<project_id>/tickets/create', methods=['POST'])
@login_required
@role_required('admin')
def create_ticket(project_id):
    title = request.form.get('title')
    description = request.form.get('description')
    ticket_type = request.form.get('type', 'task')
    priority = request.form.get('priority', 'medium')
    reporter_id = session.get('user_id')
    
    project_service = get_project_service()
    project_service.create_ticket(project_id, title, description, reporter_id, ticket_type, priority)
    
    flash('Ticket créé avec succès.', 'success')
    return redirect(url_for('superadmin.project_detail', project_id=project_id))

@superadmin_bp.route('/tickets/<ticket_id>/update-status', methods=['POST'])
@login_required
@role_required('admin')
def update_ticket_status(ticket_id):
    new_status = request.form.get('status')
    project_id = request.form.get('project_id')
    
    project_service = get_project_service()
    project_service.update_ticket(ticket_id, {'status': new_status})
    
    flash('Statut du ticket mis à jour.', 'success')
    return redirect(url_for('superadmin.project_detail', project_id=project_id))
