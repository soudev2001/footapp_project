# FootLogic V2 - Injury Tracking & Management Service

from bson import ObjectId
from datetime import datetime, timedelta


# Severity → estimated recovery days
SEVERITY_DAYS = {
    'minor': 21,       # 1-3 weeks
    'moderate': 56,    # 3-8 weeks
    'severe': 120,     # 8+ weeks
}


class InjuryService:
    """Service for injury logging, recovery tracking, and statistics."""

    def __init__(self, db):
        self.db = db
        self.collection = db.injuries
        self.players = db.players

    # ── Injury Logging ──────────────────────────────────────

    def log_injury(self, player_id, coach_id, team_id, data):
        severity = data.get('severity', 'minor')
        injury_date = data.get('injury_date', datetime.utcnow().isoformat())
        expected_days = SEVERITY_DAYS.get(severity, 21)

        injury = {
            'player_id': ObjectId(player_id),
            'team_id': ObjectId(team_id),
            'coach_id': ObjectId(coach_id),
            'injury_type': data.get('injury_type', 'other'),   # muscle | ligament | bone | concussion | other
            'body_part': data.get('body_part', ''),             # ankle | knee | hamstring | shoulder | head ...
            'severity': severity,
            'description': data.get('description', ''),
            'injury_date': injury_date,
            'expected_return': data.get('expected_return') or self._calc_return(injury_date, expected_days),
            'actual_return': None,
            'status': 'active',              # active | recovering | resolved
            'medical_clearance': False,
            'cleared_by': None,
            'cleared_date': None,
            'recovery_notes': [],
            'logged_by': ObjectId(coach_id),
            'created_at': datetime.utcnow(),
        }
        result = self.collection.insert_one(injury)
        # Update player status
        self.players.update_one(
            {'_id': ObjectId(player_id)},
            {'$set': {'status': 'injured', 'injury_id': result.inserted_id}}
        )
        return str(result.inserted_id)

    def _calc_return(self, injury_date, days):
        try:
            dt = datetime.fromisoformat(injury_date) if isinstance(injury_date, str) else injury_date
        except (ValueError, TypeError):
            dt = datetime.utcnow()
        return (dt + timedelta(days=days)).isoformat()

    # ── Recovery Tracking ───────────────────────────────────

    def update_recovery(self, injury_id, coach_id, data):
        note = {
            'date': datetime.utcnow().isoformat(),
            'update': data.get('notes', ''),
            'status': data.get('status'),
            'updated_by': ObjectId(coach_id),
        }
        update_fields = {'updated_at': datetime.utcnow()}
        if data.get('status'):
            update_fields['status'] = data['status']
        if data.get('expected_return'):
            update_fields['expected_return'] = data['expected_return']

        self.collection.update_one(
            {'_id': ObjectId(injury_id)},
            {
                '$push': {'recovery_notes': note},
                '$set': update_fields,
            }
        )
        return True

    def clear_for_play(self, injury_id, cleared_by, date=None):
        now = (date or datetime.utcnow().isoformat())
        injury = self.collection.find_one({'_id': ObjectId(injury_id)})
        if not injury:
            return False

        self.collection.update_one(
            {'_id': ObjectId(injury_id)},
            {'$set': {
                'status': 'resolved',
                'medical_clearance': True,
                'cleared_by': cleared_by,
                'cleared_date': now,
                'actual_return': now,
                'updated_at': datetime.utcnow(),
            }}
        )
        # Restore player status
        self.players.update_one(
            {'_id': injury['player_id']},
            {'$set': {'status': 'active'}, '$unset': {'injury_id': ''}}
        )
        return True

    # ── Queries ─────────────────────────────────────────────

    def get_injuries(self, team_id, status=None):
        query = {'team_id': ObjectId(team_id)}
        if status:
            query['status'] = status
        return list(self.collection.find(query).sort('created_at', -1))

    def get_injury(self, injury_id):
        return self.collection.find_one({'_id': ObjectId(injury_id)})

    def get_player_injuries(self, player_id):
        return list(self.collection.find({'player_id': ObjectId(player_id)}).sort('injury_date', -1))

    # ── Statistics ──────────────────────────────────────────

    def get_injury_stats(self, team_id):
        injuries = list(self.collection.find({'team_id': ObjectId(team_id)}))
        active = [i for i in injuries if i.get('status') == 'active']
        recovering = [i for i in injuries if i.get('status') == 'recovering']
        resolved = [i for i in injuries if i.get('status') == 'resolved']

        # Most common injury types
        type_counts = {}
        body_counts = {}
        for i in injuries:
            t = i.get('injury_type', 'other')
            b = i.get('body_part', 'unknown')
            type_counts[t] = type_counts.get(t, 0) + 1
            body_counts[b] = body_counts.get(b, 0) + 1

        # Avg recovery days for resolved
        recovery_days = []
        for i in resolved:
            try:
                start = datetime.fromisoformat(i['injury_date']) if isinstance(i['injury_date'], str) else i['injury_date']
                end = datetime.fromisoformat(i['actual_return']) if isinstance(i['actual_return'], str) else i['actual_return']
                recovery_days.append((end - start).days)
            except (TypeError, ValueError, KeyError):
                pass

        return {
            'total': len(injuries),
            'active': len(active),
            'recovering': len(recovering),
            'resolved': len(resolved),
            'active_injuries': [{
                'player_id': str(i['player_id']),
                'injury_type': i.get('injury_type'),
                'body_part': i.get('body_part'),
                'severity': i.get('severity'),
                'injury_date': i.get('injury_date'),
                'expected_return': i.get('expected_return'),
            } for i in active],
            'by_type': type_counts,
            'by_body_part': body_counts,
            'avg_recovery_days': round(sum(recovery_days) / len(recovery_days), 1) if recovery_days else 0,
        }
