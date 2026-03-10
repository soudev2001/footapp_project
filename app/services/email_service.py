from flask import current_app, url_for
from flask_mail import Message

def send_invitation_email(to_email, token, role, club_name):
    """
    Envoie un e-mail d'invitation avec un lien contenant un token unique.
    """
    try:
        # Construction du lien d'inscription (qui injectera automatiquement le token)
        registration_link = url_for('auth.register', token=token, _external=True)
        
        # Mapping du rôle pour l'affichage conditionnel ou l'objet
        role_display = {
            'player': 'Joueur',
            'coach': 'Coach',
            'parent': 'Parent',
            'fan': 'Supporter'
        }.get(role, 'Membre')
        
        subject = f"Invitation à rejoindre {club_name} sur FootLogic"
        
        # Corps de l'e-mail (HTML basique pour l'instant)
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #10b981; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">FootLogic V2</h2>
            </div>
            
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                <h3>Bonjour,</h3>
                <p>Vous avez été invité(e) en tant que <strong>{role_display}</strong> à rejoindre le club <strong>{club_name}</strong> sur FootLogic.</p>
                <p>Pour finaliser la création de votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{registration_link}" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Créer mon compte
                    </a>
                </div>
                
                <p style="color: #666; font-size: 0.9em;"><em>Ce lien d'invitation expirera dans 48 heures.</em></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 0.8em; text-align: center;">L'équipe FootLogic</p>
            </div>
        </div>
        """
        
        # Création et envoi du message via flask_mail
        msg = Message(
            subject=subject,
            recipients=[to_email],
            html=html_body
        )
        
        # On récupère l'instance globale de Mail chargée dans `app.extensions['mail']`
        mail = current_app.extensions.get('mail')
        if not mail:
            current_app.logger.error("Flask-Mail n'est pas initialisé (mail manquant dans les extensions).")
            return False
            
        mail.send(msg)
        return True
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'envoi de l'invitation à {to_email}: {str(e)}")
        return False

def send_reset_password_email(to_email, reset_link):
    """
    Envoie un e-mail de réinitialisation de mot de passe.
    """
    try:
        subject = "Réinitialisation de votre mot de passe FootLogic"
        
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #facc15; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="color: #333; margin: 0;">FootLogic V2</h2>
            </div>
            
            <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                <h3>Bonjour,</h3>
                <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
                <p>Pour définir un nouveau mot de passe, veuillez cliquer sur le bouton ci-dessous :</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #facc15; color: #333; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Réinitialiser mon mot de passe
                    </a>
                </div>
                
                <p style="color: #666; font-size: 0.9em;"><em>Ce lien expirera dans une heure. Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</em></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 0.8em; text-align: center;">L'équipe FootLogic</p>
            </div>
        </div>
        """
        
        msg = Message(
            subject=subject,
            recipients=[to_email],
            html=html_body
        )
        
        mail = current_app.extensions.get('mail')
        if not mail:
            current_app.logger.error("Flask-Mail n'est pas initialisé (mail manquant dans les extensions).")
            return False
            
        mail.send(msg)
        return True
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'envoi de l'e-mail de réinitialisation à {to_email}: {str(e)}")
        return False
