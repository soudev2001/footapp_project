# FootLogic V2 - App Factory

from flask import Flask, session, render_template

def create_app(config_name='default'):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    from app.config import config
    app.config.from_object(config[config_name])
    
    # Initialize MongoDB
    from app.services.db import init_db
    init_db(app)
    
    # Register all blueprints
    from app.routes import main_bp, api_bp, auth_bp, admin_bp, coach_bp, player_bp, isy_bp, superadmin_bp
    from app.routes.auth_extra import auth_extra_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(coach_bp)
    app.register_blueprint(player_bp)
    app.register_blueprint(isy_bp)
    app.register_blueprint(superadmin_bp)
    app.register_blueprint(auth_extra_bp)
    
    # Context processor for templates
    @app.context_processor
    def inject_globals():
        from app.services import get_nav_for_role
        
        user_role = session.get('user_role', 'fan')
        user_profile = session.get('user_profile', {})
        
        return {
            'current_user': {
                'id': session.get('user_id'),
                'email': session.get('user_email'),
                'role': user_role,
                'profile': user_profile,
                'club_id': session.get('club_id'),
                'is_authenticated': 'user_id' in session
            },
            'nav_items': get_nav_for_role(user_role),
            'roles': {
                'is_admin': user_role == 'admin',
                'is_coach': user_role in ['admin', 'coach'],
                'is_player': user_role in ['admin', 'coach', 'player'],
                'is_fan': True  # Everyone can see fan content
            }
        }
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(403)
    def forbidden(e):
        return render_template('errors/403.html'), 403
    
    @app.errorhandler(500)
    def server_error(e):
        return render_template('errors/500.html', error=e), 500
    
    return app

