# FootLogic V2 - Announcement Service
# Allows admins to send bulk announcements to role/team/all members

from datetime import datetime
from bson import ObjectId


class AnnouncementService:
    def __init__(self, db):
        self.db = db
        self.collection = db['announcements']
        self.users = db['users']

    def get_announcement_recipients(self, club_id, target_type='all', target_id=''):
        """Return the list of users who would receive an announcement.

        target_type: 'all' | 'role' | 'team'
        target_id  : role name (e.g. 'player') or team ObjectId string
        """
        cid = ObjectId(club_id) if isinstance(club_id, str) else club_id
        query = {'club_id': cid, 'account_status': 'active'}

        if target_type == 'role' and target_id:
            query['role'] = target_id
        elif target_type == 'team' and target_id:
            try:
                player_user_ids = [
                    p['user_id']
                    for p in self.db['players'].find(
                        {'team_id': ObjectId(target_id)}, {'user_id': 1}
                    )
                ]
                query['_id'] = {'$in': player_user_ids}
            except Exception:
                return []

        return list(self.users.find(query, {'email': 1, 'profile': 1, 'role': 1}))

    def send_announcement(self, club_id, subject, body, target_type, target_id, sender_id):
        """Send an announcement email to all matching recipients and persist it.

        Returns a dict with 'recipient_count' and '_id'.
        """
        from flask import current_app
        from flask_mail import Message as MailMessage

        recipients = self.get_announcement_recipients(club_id, target_type, target_id)

        success_count = 0
        failed_emails = []
        recipient_emails = []

        mail = current_app.extensions.get('mail')

        # Build target label for storage
        target_label = _build_target_label(target_type, target_id, self.db)

        for user in recipients:
            email = user.get('email')
            if not email:
                continue
            recipient_emails.append(email)
            first_name = user.get('profile', {}).get('first_name', '')
            personalized_body = body.replace('{name}', first_name) if first_name else body

            html_body = _build_html(subject, personalized_body)
            try:
                if mail:
                    msg = MailMessage(subject=subject, recipients=[email], html=html_body)
                    mail.send(msg)
                success_count += 1
            except Exception as exc:
                current_app.logger.warning(f"Announcement email failed for {email}: {exc}")
                failed_emails.append(email)

        # Persist announcement
        doc = {
            'club_id': ObjectId(club_id) if isinstance(club_id, str) else club_id,
            'subject': subject,
            'body': body,
            'target_type': target_type,
            'target_id': target_id,
            'target_label': target_label,
            'sent_by': ObjectId(sender_id) if sender_id else None,
            'recipient_count': success_count,
            'failed_count': len(failed_emails),
            'sent_at': datetime.utcnow()
        }
        result = self.collection.insert_one(doc)
        doc['_id'] = result.inserted_id
        doc['recipient_count'] = success_count
        doc['failed_emails'] = failed_emails
        doc['recipient_emails'] = recipient_emails
        return doc

    def get_announcements(self, club_id, limit=50):
        """Return announcement history for a club, most recent first."""
        cid = ObjectId(club_id) if isinstance(club_id, str) else club_id
        docs = list(
            self.collection.find({'club_id': cid})
            .sort('sent_at', -1)
            .limit(limit)
        )
        # Resolve sender names
        for doc in docs:
            sender = None
            if doc.get('sent_by'):
                sender = self.users.find_one({'_id': doc['sent_by']}, {'profile': 1})
            doc['sender_name'] = (
                f"{sender['profile'].get('first_name', '')} {sender['profile'].get('last_name', '')}".strip()
                if sender else 'Admin'
            )
        return docs


# ----------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------

def _build_target_label(target_type, target_id, db):
    if target_type == 'all':
        return 'Tous les membres'
    if target_type == 'role':
        labels = {
            'admin': 'Administrateurs', 'coach': 'Entraîneurs',
            'player': 'Joueurs', 'parent': 'Parents', 'fan': 'Supporters'
        }
        return labels.get(target_id, target_id.capitalize())
    if target_type == 'team' and target_id:
        try:
            team = db['teams'].find_one({'_id': ObjectId(target_id)}, {'name': 1})
            return team['name'] if team else 'Équipe'
        except Exception:
            return 'Équipe'
    return 'Inconnu'


def _build_html(subject, body):
    escaped = body.replace('\n', '<br>')
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#1e40af;padding:20px;text-align:center;border-radius:8px 8px 0 0">
            <h2 style="color:white;margin:0">FootLogic</h2>
        </div>
        <div style="padding:30px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
            <h3 style="color:#1e40af">{subject}</h3>
            <p>{escaped}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
            <p style="color:#999;font-size:.8em;text-align:center">
                Ce message a été envoyé depuis FootLogic. Vous le recevez car vous êtes membre du club.
            </p>
        </div>
    </div>"""
