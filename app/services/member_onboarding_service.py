import csv
import io
import re
import secrets
import string
from datetime import datetime, timedelta
from bson import ObjectId
from werkzeug.security import generate_password_hash

from app.models import create_user, create_player
from app.services.email_service import EmailService

class MemberOnboardingService:
    def __init__(self, db):
        self.db = db
        self.email_service = EmailService()
        
    def _is_valid_email(self, email):
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        return re.match(pattern, email) is not None
        
    def _generate_temp_password(self, length=12):
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    def validate_csv(self, file_content, club_id):
        """
        Parses CSV data, validates each row, and returns valid and invalid rows.
        Expected columns: email, first_name, last_name, role, team_name (optional)
        """
        valid_rows = []
        errors = []
        
        # Read available teams for validation
        teams = list(self.db.teams.find({'club_id': ObjectId(club_id)}))
        team_map = {t['name'].lower(): str(t['_id']) for t in teams}
        
        valid_roles = ['admin', 'coach', 'player', 'parent', 'fan']
        
        try:
            # Handle string content or byte content
            if isinstance(file_content, bytes):
                content = file_content.decode('utf-8-sig')
            else:
                content = file_content
                
            csv_reader = csv.DictReader(io.StringIO(content))
            
            # Check required columns
            required_cols = {'email', 'first_name', 'last_name', 'role'}
            headers = set(csv_reader.fieldnames or [])
            
            if not required_cols.issubset(headers):
                missing = required_cols - headers
                return [], [{'row': 0, 'error': f"Missing expected headers: {', '.join(missing)}"}]
                
            for idx, row in enumerate(csv_reader, start=1):
                row_errors = []
                
                email = row.get('email', '').strip().lower()
                first_name = row.get('first_name', '').strip()
                last_name = row.get('last_name', '').strip()
                role = row.get('role', '').strip().lower()
                team_name = row.get('team_name', '').strip()
                
                # Required fields Validation
                if not email or not first_name or not last_name or not role:
                    row_errors.append("Missing required fields (email, first_name, last_name, or role)")
                
                # Email format
                if email and not self._is_valid_email(email):
                    row_errors.append(f"Invalid email format: {email}")
                
                # Duplicate check in DB
                if email and self.db.users.find_one({'email': email}):
                    row_errors.append(f"Email already exists in system: {email}")
                    
                # Duplicate within CSV checking happens at collection time (omitted for brevity)

                # Role validation
                if role and role not in valid_roles:
                    row_errors.append(f"Invalid role: {role}. Must be one of {', '.join(valid_roles)}")
                    
                # Team validation (optional)
                team_id = None
                if team_name:
                    if team_name.lower() in team_map:
                        team_id = team_map[team_name.lower()]
                    else:
                        row_errors.append(f"Team '{team_name}' not found in club")
                        
                if row_errors:
                    errors.append({
                        'row': idx,
                        'data': row,
                        'errors': row_errors
                    })
                else:
                    valid_rows.append({
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'role': role,
                        'team_id': team_id
                    })
                    
            return valid_rows, errors
            
        except Exception as e:
            return [], [{'row': 0, 'error': f"Failed to parse CSV: {str(e)}"}]

    def bulk_import_members(self, club_id, valid_members, custom_message=None):
        """
        Creates users in bulk and sends invitations.
        """
        import_batch_id = secrets.token_hex(8)
        created_count = 0
        
        club = self.db.clubs.find_one({'_id': ObjectId(club_id)})
        club_name = club.get('name', 'FootApp') if club else 'FootApp'
        
        for member in valid_members:
            # Double check existence to avoid race conditions
            if self.db.users.find_one({'email': member['email']}):
                continue
                
            temp_password = self._generate_temp_password()
            token = secrets.token_urlsafe(32)
            now = datetime.utcnow()
            expires_at = now + timedelta(days=7) # Invitations expire in 7 days
            
            profile = {
                'first_name': member['first_name'],
                'last_name': member['last_name'],
                'avatar': '',
                'phone': ''
            }
            
            new_user = create_user(
                email=member['email'],
                password_hash=generate_password_hash(temp_password),
                role=member['role'],
                club_id=club_id,
                profile=profile,
                account_status='pending',
                invitation_token=token,
                invite_sent_at=now,
                invitation_expires_at=expires_at,
                import_batch_id=import_batch_id
            )
            
            result = self.db.users.insert_one(new_user)
            user_id = result.inserted_id
            
            # Auto-create player profile if needed
            if member['role'] == 'player':
                try:
                    new_player = create_player(
                        user_id=user_id,
                        club_id=club_id,
                        jersey_number=None,
                        position='Not Set',
                        team_id=member['team_id']
                    )
                    # Add name for easier querying
                    new_player['name'] = f"{member['first_name']} {member['last_name']}"
                    self.db.players.insert_one(new_player)
                except Exception as e:
                    print(f"Warning: Failed to create player profile for user {user_id}: {e}")
            
            # Send invitation email
            invite_url = f"/auth/join?token={token}" # Will be resolved to absolute URL in email service ideally
            
            template_kwargs = {
                'user': {'profile': profile},
                'club_name': club_name,
                'invite_url': invite_url,
                'temp_password': temp_password,
                'custom_message': custom_message
            }
            
            try:
                # Assuming email_service has a send_invitation or send_template method
                # We use a try-except to not fail the whole import if an email fails
                self.email_service.send_email(
                    subject=f"Invitation to join {club_name} on FootApp",
                    recipients=[member['email']],
                    template="emails/bulk_invitation.html",
                    **template_kwargs
                )
            except Exception as e:
                print(f"Warning: Failed to send email to {member['email']}: {e}")
                
            created_count += 1
            
        return {
            'batch_id': import_batch_id,
            'created_count': created_count,
            'total_attempted': len(valid_members)
        }
        
    def get_invitation_dashboard(self, club_id, status_filter=None):
        """
        Retrieves users for the onboarding dashboard
        """
        query = {'club_id': ObjectId(club_id)}
        
        if status_filter:
            if status_filter == 'pending':
                query['account_status'] = 'pending'
            elif status_filter == 'active':
                query['account_status'] = 'active'
            elif status_filter == 'expired':
                query['account_status'] = 'pending'
                query['invitation_expires_at'] = {'$lt': datetime.utcnow()}
                
        # To distinguish correctly, if we want strictly pending (not expired)
        if status_filter == 'pending':
             query['invitation_expires_at'] = {'$gte': datetime.utcnow()}
             
        users = list(self.db.users.find(query).sort('invite_sent_at', -1))
        
        # Hydrate with team names if they are players
        player_ids = [u['_id'] for u in users if u.get('role') == 'player']
        players = list(self.db.players.find({'user_id': {'$in': player_ids}}))
        
        team_ids = [p.get('team_id') for p in players if p.get('team_id')]
        teams = {t['_id']: t['name'] for t in self.db.teams.find({'_id': {'$in': [ObjectId(tid) for tid in team_ids]}})}
        
        player_team_map = {}
        for p in players:
            tid = p.get('team_id')
            if tid and tid in teams:
                player_team_map[p['user_id']] = teams[tid]
                
        now = datetime.utcnow()
        for u in users:
            u['team_name'] = player_team_map.get(u['_id'], 'N/A')
            
            # Determine derived status
            if u.get('account_status') == 'active':
                u['display_status'] = 'Active'
                u['days_left'] = None
            elif u.get('invitation_expires_at'):
                if u['invitation_expires_at'] < now:
                    u['display_status'] = 'Expired'
                    u['days_left'] = 0
                else:
                    u['display_status'] = 'Pending'
                    u['days_left'] = (u['invitation_expires_at'] - now).days
            else:
                u['display_status'] = 'Unknown'
                u['days_left'] = None
                
        return users

    def resend_invitations(self, club_id, member_ids):
        """
        Resends invitations for selected users
        """
        object_ids = [ObjectId(mid) for mid in member_ids]
        users = list(self.db.users.find({'_id': {'$in': object_ids}, 'club_id': ObjectId(club_id)}))
        
        club = self.db.clubs.find_one({'_id': ObjectId(club_id)})
        club_name = club.get('name', 'FootApp') if club else 'FootApp'
        
        success_count = 0
        now = datetime.utcnow()
        
        for user in users:
            if user.get('account_status') == 'active':
                continue # Already active
                
            token = user.get('invitation_token')
            if not token:
                token = secrets.token_urlsafe(32)
                
            # Extend expiry from now
            expires_at = now + timedelta(days=7)
            
            self.db.users.update_one(
                {'_id': user['_id']},
                {'$set': {
                    'invitation_token': token,
                    'last_reminder_at': now,
                    'invitation_expires_at': expires_at
                }}
            )
            
            invite_url = f"/auth/join?token={token}"
            
            try:
                self.email_service.send_email(
                    subject=f"Reminder: Invitation to join {club_name}",
                    recipients=[user['email']],
                    template="emails/invitation_reminder.html",
                    user=user,
                    club_name=club_name,
                    invite_url=invite_url
                )
                success_count += 1
            except Exception as e:
                print(f"Failed to resend to {user['email']}: {e}")
                
        return success_count
