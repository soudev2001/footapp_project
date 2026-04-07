# FootLogic V2 - Training Plan Management Service

from bson import ObjectId
from datetime import datetime, timedelta


class TrainingService:
    """Service for training plans, sessions, drills, and training load."""

    def __init__(self, db):
        self.db = db
        self.plans = db.training_plans
        self.sessions = db.training_sessions
        self.drills = db.drills

    # ── Training Plans ──────────────────────────────────────

    def create_plan(self, club_id, team_id, coach_id, data):
        plan = {
            'club_id': ObjectId(club_id),
            'team_id': ObjectId(team_id),
            'coach_id': ObjectId(coach_id),
            'name': data['name'],
            'type': data.get('type', 'weekly'),          # weekly | monthly | seasonal
            'start_date': data.get('start_date'),
            'end_date': data.get('end_date'),
            'focus_area': data.get('focus_area', 'mixed'),  # technical | tactical | physical | mixed
            'description': data.get('description', ''),
            'status': 'active',
            'created_at': datetime.utcnow(),
        }
        result = self.plans.insert_one(plan)
        return str(result.inserted_id)

    def get_plans(self, team_id, status=None):
        query = {'team_id': ObjectId(team_id)}
        if status:
            query['status'] = status
        return list(self.plans.find(query).sort('created_at', -1))

    def get_plan(self, plan_id):
        return self.plans.find_one({'_id': ObjectId(plan_id)})

    def update_plan(self, plan_id, data):
        allowed = {'name', 'type', 'start_date', 'end_date', 'focus_area', 'description', 'status'}
        update = {k: v for k, v in data.items() if k in allowed}
        if update:
            update['updated_at'] = datetime.utcnow()
            self.plans.update_one({'_id': ObjectId(plan_id)}, {'$set': update})
        return True

    def delete_plan(self, plan_id):
        self.sessions.delete_many({'plan_id': ObjectId(plan_id)})
        self.plans.delete_one({'_id': ObjectId(plan_id)})
        return True

    # ── Training Sessions ───────────────────────────────────

    def create_session(self, plan_id, coach_id, data):
        plan = self.get_plan(plan_id)
        if not plan:
            return None
        session = {
            'plan_id': ObjectId(plan_id),
            'team_id': plan['team_id'],
            'club_id': plan['club_id'],
            'coach_id': ObjectId(coach_id),
            'date': data.get('date'),
            'duration': data.get('duration', 90),        # minutes
            'location': data.get('location', ''),
            'focus': data.get('focus', 'mixed'),
            'drills': data.get('drills', []),             # [{drill_id, order, duration, notes}]
            'attendance': [],                             # [{player_id, status, reason, rating}]
            'coach_notes': data.get('coach_notes', ''),
            'training_load': data.get('training_load', 'medium'),  # low | medium | high
            'status': 'planned',                          # planned | completed | cancelled
            'created_at': datetime.utcnow(),
        }
        result = self.sessions.insert_one(session)
        return str(result.inserted_id)

    def get_sessions(self, plan_id=None, team_id=None, limit=20):
        query = {}
        if plan_id:
            query['plan_id'] = ObjectId(plan_id)
        if team_id:
            query['team_id'] = ObjectId(team_id)
        return list(self.sessions.find(query).sort('date', -1).limit(limit))

    def get_session(self, session_id):
        return self.sessions.find_one({'_id': ObjectId(session_id)})

    def update_session(self, session_id, data):
        allowed = {'date', 'duration', 'location', 'focus', 'drills',
                    'coach_notes', 'training_load', 'status'}
        update = {k: v for k, v in data.items() if k in allowed}
        if update:
            update['updated_at'] = datetime.utcnow()
            self.sessions.update_one({'_id': ObjectId(session_id)}, {'$set': update})
        return True

    def mark_attendance(self, session_id, player_id, status, reason=None, rating=None):
        session = self.get_session(session_id)
        if not session:
            return False
        attendance = session.get('attendance', [])
        # Update existing or append
        found = False
        for a in attendance:
            if str(a.get('player_id')) == str(player_id):
                a['status'] = status
                a['reason'] = reason
                a['rating'] = rating
                found = True
                break
        if not found:
            attendance.append({
                'player_id': ObjectId(player_id),
                'status': status,
                'reason': reason,
                'rating': rating,
            })
        self.sessions.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': {'attendance': attendance, 'updated_at': datetime.utcnow()}}
        )
        return True

    def bulk_attendance(self, session_id, records):
        """records = [{player_id, status, reason?, rating?}]"""
        for rec in records:
            self.mark_attendance(
                session_id,
                rec['player_id'],
                rec['status'],
                rec.get('reason'),
                rec.get('rating'),
            )
        return True

    # ── Drill Library ───────────────────────────────────────

    def get_drills(self, club_id=None, category=None, difficulty=None):
        query = {'$or': [{'is_public': True}]}
        if club_id:
            query['$or'].append({'club_id': ObjectId(club_id)})
        if category:
            query['category'] = category
        if difficulty:
            query['difficulty'] = difficulty
        return list(self.drills.find(query).sort('name', 1))

    def get_drill(self, drill_id):
        return self.drills.find_one({'_id': ObjectId(drill_id)})

    def create_drill(self, club_id, coach_id, data):
        drill = {
            'club_id': ObjectId(club_id) if club_id else None,
            'name': data['name'],
            'description': data.get('description', ''),
            'category': data.get('category', 'technical'),
            'sub_category': data.get('sub_category', ''),
            'duration': data.get('duration', 15),
            'players_needed': data.get('players_needed', 0),
            'equipment': data.get('equipment', []),
            'difficulty': data.get('difficulty', 'intermediate'),
            'coaching_points': data.get('coaching_points', []),
            'diagram_image': data.get('diagram_image', ''),
            'video_link': data.get('video_link', ''),
            'is_public': data.get('is_public', False),
            'created_by': ObjectId(coach_id),
            'created_at': datetime.utcnow(),
        }
        result = self.drills.insert_one(drill)
        return str(result.inserted_id)

    def update_drill(self, drill_id, data):
        allowed = {'name', 'description', 'category', 'sub_category', 'duration',
                    'players_needed', 'equipment', 'difficulty', 'coaching_points',
                    'diagram_image', 'video_link'}
        update = {k: v for k, v in data.items() if k in allowed}
        if update:
            update['updated_at'] = datetime.utcnow()
            self.drills.update_one({'_id': ObjectId(drill_id)}, {'$set': update})
        return True

    # ── Training Load ───────────────────────────────────────

    def get_training_load(self, player_id, weeks=1):
        """Calculate training load for a player over N weeks."""
        cutoff = datetime.utcnow() - timedelta(weeks=weeks)
        pipeline = [
            {'$match': {
                'date': {'$gte': cutoff.isoformat()},
                'attendance.player_id': ObjectId(player_id),
                'status': 'completed',
            }},
            {'$project': {
                'duration': 1,
                'training_load': 1,
                'date': 1,
            }}
        ]
        sessions = list(self.sessions.aggregate(pipeline))
        load_values = {'low': 1, 'medium': 2, 'high': 3}
        total_minutes = 0
        total_load = 0
        for s in sessions:
            total_minutes += s.get('duration', 0)
            total_load += load_values.get(s.get('training_load', 'medium'), 2)

        count = len(sessions)
        warning = None
        if weeks == 1 and total_load >= 12:
            warning = 'overload'
        elif weeks == 1 and total_load >= 9:
            warning = 'high'

        return {
            'sessions_count': count,
            'total_minutes': total_minutes,
            'total_load': total_load,
            'avg_load': round(total_load / count, 1) if count else 0,
            'warning': warning,
        }
