from datetime import datetime, timedelta
from bson import ObjectId


class PlatformManagementService:
    def __init__(self, db):
        self.db = db

    def get_all_clubs(self, filters=None):
        query = {}
        if filters:
            if filters.get('status'):
                query['status'] = filters['status']
            if filters.get('search'):
                query['name'] = {'$regex': filters['search'], '$options': 'i'}
        clubs = list(self.db.clubs.find(query).sort('created_at', -1))
        result = []
        for club in clubs:
            member_count = self.db.users.count_documents({'club_id': club['_id']})
            team_count = self.db.teams.count_documents({'club_id': club['_id']})
            health = self._compute_health(club, member_count)
            c = {
                '_id': str(club['_id']),
                'name': club.get('name', ''),
                'city': club.get('city', ''),
                'status': club.get('status', 'active'),
                'created_at': club.get('created_at'),
                'member_count': member_count,
                'team_count': team_count,
                'health_score': health,
                'subscription': club.get('subscription', {}),
            }
            result.append(c)
        return result

    def _compute_health(self, club, member_count):
        score = 0
        if member_count >= 10:
            score += 30
        elif member_count >= 5:
            score += 15
        threshold = datetime.utcnow() - timedelta(days=7)
        active = self.db.users.count_documents({
            'club_id': club['_id'],
            'last_login': {'$gte': threshold}
        })
        if member_count > 0:
            engagement = active / member_count
            score += int(engagement * 40)
        sub = club.get('subscription', {})
        if sub.get('status') == 'active':
            score += 20
        if sub.get('plan_id') and sub['plan_id'] != 'free':
            score += 10
        return min(score, 100)

    def get_club_details(self, club_id):
        club = self.db.clubs.find_one({'_id': ObjectId(club_id)})
        if not club:
            return None
        members = list(self.db.users.find({'club_id': ObjectId(club_id)}, {'password_hash': 0}))
        teams = list(self.db.teams.find({'club_id': ObjectId(club_id)}))
        matches = self.db.matches.count_documents({'club_id': ObjectId(club_id)})
        events = self.db.events.count_documents({'club_id': ObjectId(club_id)})
        roles = {}
        for m in members:
            r = m.get('role', 'unknown')
            roles[r] = roles.get(r, 0) + 1
        return {
            'club': club,
            'member_count': len(members),
            'team_count': len(teams),
            'match_count': matches,
            'event_count': events,
            'roles': roles,
            'teams': teams,
            'health_score': self._compute_health(club, len(members)),
        }

    def suspend_club(self, club_id, reason=''):
        self.db.clubs.update_one(
            {'_id': ObjectId(club_id)},
            {'$set': {'status': 'suspended', 'suspension_reason': reason, 'suspended_at': datetime.utcnow()}}
        )
        return True

    def activate_club(self, club_id):
        self.db.clubs.update_one(
            {'_id': ObjectId(club_id)},
            {'$set': {'status': 'active'}, '$unset': {'suspension_reason': '', 'suspended_at': ''}}
        )
        return True
