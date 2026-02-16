# FootLogic V2 - Auth Routes (Onboarding)

from flask import Blueprint, render_template, request, redirect, url_for, flash
from werkzeug.security import generate_password_hash
from app.services import get_user_service

auth_extra_bp = Blueprint('auth_extra', __name__)

@auth_extra_bp.route('/complete-profile/<token>', methods=['GET', 'POST'])
def complete_profile(token):
    """Page for new users to complete their profile and set their password"""
    user_service = get_user_service()
    
    # Find user by token
    user = user_service.collection.find_one({'invitation_token': token})
    
    if not user:
        flash('Lien d\'invitation invalide ou expiré.', 'error')
        return redirect(url_for('auth.login'))
        
    if user.get('account_status') == 'active':
        flash('Ce compte est déjà activé. Veuillez vous connecter.', 'info')
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        phone = request.form.get('phone')
        
        if password != confirm_password:
            flash('Les mots de passe ne correspondent pas.', 'error')
        else:
            # Update user
            user_service.collection.update_one(
                {'_id': user['_id']},
                {'$set': {
                    'password_hash': generate_password_hash(password),
                    'account_status': 'active',
                    'invitation_token': None, # Clear token
                    'profile.first_name': first_name,
                    'profile.last_name': last_name,
                    'profile.phone': phone
                }}
            )
            flash('Votre compte a été activé avec succès ! Vous pouvez maintenant vous connecter.', 'success')
            return redirect(url_for('auth.login'))
            
    return render_template('auth/complete_profile.html', user=user, token=token)
