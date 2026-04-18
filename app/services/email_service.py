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


def send_convocation_email(to_email, player_name, event_info, position=None, role_info=None, set_piece_duties=None):
    """
    Envoie un e-mail de convocation avec les instructions tactiques du joueur.
    event_info: dict with keys: title, date, location, opponent (optional)
    role_info: dict with keys: role, duty, freedom, specific_tasks (optional)
    set_piece_duties: list of strings describing set piece roles (optional)
    """
    try:
        event_title = event_info.get('title', 'Événement')
        event_date = event_info.get('date', '')
        event_location = event_info.get('location', '')
        opponent = event_info.get('opponent', '')

        subject = f"Convocation: {event_title}"

        # Build role section
        role_html = ''
        if role_info and role_info.get('role'):
            ROLE_LABELS = {
                'sweeper_keeper': 'Libéro', 'traditional': 'Traditionnel',
                'ball_playing_defender': 'Défenseur qui joue', 'stopper': 'Défenseur agressif',
                'cover': 'Défenseur de couverture', 'wingback': 'Piston', 'fullback': 'Arrière',
                'deep_playmaker': 'Créateur profond', 'ball_winner': 'Récupérateur',
                'box_to_box': 'Milieu complet', 'advanced_playmaker': 'Créateur avancé',
                'attacking_midfielder': 'Milieu offensif', 'inverted_winger': 'Ailier inversé',
                'traditional_winger': 'Ailier traditionnel', 'inside_forward': 'Avant intérieur',
                'wide_midfielder': 'Milieu large', 'target_man': 'Pivot',
                'poacher': 'Renard des surfaces', 'false_nine': 'Faux 9',
                'advanced_forward': 'Avant avancé', 'complete_forward': 'Attaquant complet',
            }
            DUTY_LABELS = {'defend': 'Défendre', 'support': 'Soutenir', 'attack': 'Attaquer'}
            FREEDOM_LABELS = {'stay_position': 'Strictement positionnée', 'roam': 'Peut se décaler', 'free': 'Liberté totale'}
            TASK_LABELS = {
                'run_channels': 'Courses en profondeur', 'take_long_shots': 'Tirs de loin',
                'dribble_more': 'Dribbler plus', 'stay_wide': 'Rester large',
                'get_forward': 'Monter en attaque', 'mark_specific': 'Marquer spécifique',
                'play_simple': 'Jeu simple', 'crosses_often': 'Centrer souvent', 'sit_narrow': 'Se rapprocher',
            }

            role_label = ROLE_LABELS.get(role_info['role'], role_info['role'])
            duty_label = DUTY_LABELS.get(role_info.get('duty', ''), role_info.get('duty', ''))
            freedom_label = FREEDOM_LABELS.get(role_info.get('freedom', ''), role_info.get('freedom', ''))
            tasks = role_info.get('specific_tasks', [])
            tasks_html = ''.join(f'<li>{TASK_LABELS.get(t, t)}</li>' for t in tasks) if tasks else ''

            role_html = f'''
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h3 style="color: #166534; margin: 0 0 12px 0; font-size: 16px;">🎯 Vos Instructions Tactiques</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 4px 8px; color: #666; width: 120px;">Rôle</td><td style="padding: 4px 8px; font-weight: bold; color: #333;">{role_label}</td></tr>
                    <tr><td style="padding: 4px 8px; color: #666;">Devoir</td><td style="padding: 4px 8px; font-weight: bold; color: #333;">{duty_label}</td></tr>
                    <tr><td style="padding: 4px 8px; color: #666;">Liberté</td><td style="padding: 4px 8px; color: #333;">{freedom_label}</td></tr>
                </table>
                {'<div style="margin-top: 10px;"><strong style="color: #166534;">Tâches spécifiques:</strong><ul style="margin: 4px 0; padding-left: 20px; color: #333;">' + tasks_html + '</ul></div>' if tasks_html else ''}
            </div>
            '''

        # Build set pieces section
        set_pieces_html = ''
        if set_piece_duties:
            items = ''.join(f'<li style="padding: 4px 0;">{d}</li>' for d in set_piece_duties)
            set_pieces_html = f'''
            <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h3 style="color: #854d0e; margin: 0 0 8px 0; font-size: 16px;">⚽ Coups de pied arrêtés</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333;">{items}</ul>
            </div>
            '''

        # Position info
        position_html = ''
        if position:
            position_html = f'<p style="font-size: 14px; color: #333; margin: 8px 0;"><strong>Position:</strong> {position}</p>'

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #10b981; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">FootLogic V2</h2>
                <p style="color: #d1fae5; margin: 4px 0 0 0; font-size: 14px;">Convocation</p>
            </div>

            <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                <h3 style="margin: 0 0 16px 0;">Bonjour {player_name},</h3>
                <p>Vous êtes convoqué(e) pour :</p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <h3 style="color: #10b981; margin: 0 0 8px 0;">{event_title}</h3>
                    {'<p style="margin: 4px 0; color: #333;"><strong>📅 Date:</strong> ' + str(event_date) + '</p>' if event_date else ''}
                    {'<p style="margin: 4px 0; color: #333;"><strong>📍 Lieu:</strong> ' + event_location + '</p>' if event_location else ''}
                    {'<p style="margin: 4px 0; color: #333;"><strong>⚔️ Adversaire:</strong> ' + opponent + '</p>' if opponent else ''}
                </div>

                {position_html}
                {role_html}
                {set_pieces_html}

                <p style="color: #666; font-size: 13px; margin-top: 20px;">La composition complète sera visible dans l'application 24h avant le match.</p>

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
            current_app.logger.error("Flask-Mail n'est pas initialisé.")
            return False

        mail.send(msg)
        return True

    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'envoi de la convocation à {to_email}: {str(e)}")
        return False
