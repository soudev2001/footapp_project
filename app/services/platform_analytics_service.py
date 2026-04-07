from datetime import datetime, timedelta
from bson import ObjectId


class PlatformAnalyticsService:
    def __init__(self, db):
        self.db = db

    def get_platform_metrics(self):
        total_clubs = self.db.clubs.count_documents({})
        active_clubs = self.db.clubs.count_documents({'status': {'$ne': 'suspended'}})
        total_users = self.db.users.count_documents({})
        total_players = self.db.players.count_documents({})
        threshold_30 = datetime.utcnow() - timedelta(days=30)
        threshold_1 = datetime.utcnow() - timedelta(days=1)
        mau = self.db.users.count_documents({'last_login': {'$gte': threshold_30}})
        dau = self.db.users.count_documents({'last_login': {'$gte': threshold_1}})
        roles = {}
        pipeline = [{'$group': {'_id': '$role', 'count': {'$sum': 1}}}]
        for r in self.db.users.aggregate(pipeline):
            roles[r['_id'] or 'unknown'] = r['count']
        mrr = 0.0
        for club in self.db.clubs.find({'subscription.status': 'active'}):
            billing = club.get('subscription', {}).get('billing', {})
            mrr += float(billing.get('total_monthly', 0))
        return {
            'total_clubs': total_clubs,
            'active_clubs': active_clubs,
            'total_users': total_users,
            'total_players': total_players,
            'mau': mau,
            'dau': dau,
            'roles': roles,
            'mrr': round(mrr, 2),
            'arr': round(mrr * 12, 2),
        }

    def get_growth_charts(self, days=90):
        since = datetime.utcnow() - timedelta(days=days)
        club_pipeline = [
            {'$match': {'created_at': {'$gte': since}}},
            {'$group': {
                '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}},
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        user_pipeline = [
            {'$match': {'created_at': {'$gte': since}}},
            {'$group': {
                '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}},
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        clubs_raw = list(self.db.clubs.aggregate(club_pipeline))
        users_raw = list(self.db.users.aggregate(user_pipeline))
        return {
            'clubs': {'labels': [r['_id'] for r in clubs_raw], 'data': [r['count'] for r in clubs_raw]},
            'users': {'labels': [r['_id'] for r in users_raw], 'data': [r['count'] for r in users_raw]},
        }

    def get_revenue_breakdown(self):
        plans = {}
        for club in self.db.clubs.find():
            sub = club.get('subscription', {})
            plan = sub.get('plan_id', 'free')
            billing = sub.get('billing', {})
            monthly = float(billing.get('total_monthly', 0))
            if plan not in plans:
                plans[plan] = {'count': 0, 'mrr': 0.0}
            plans[plan]['count'] += 1
            plans[plan]['mrr'] += monthly
        return plans

    def get_cohort_analysis(self, months=6):
        cohorts = []
        now = datetime.utcnow()
        for i in range(months):
            start = datetime(now.year, now.month, 1) - timedelta(days=30 * i)
            end = start + timedelta(days=30)
            signed_up = self.db.users.count_documents({'created_at': {'$gte': start, '$lt': end}})
            still_active = self.db.users.count_documents({
                'created_at': {'$gte': start, '$lt': end},
                'last_login': {'$gte': datetime.utcnow() - timedelta(days=30)}
            })
            cohorts.append({
                'month': start.strftime('%Y-%m'),
                'signed_up': signed_up,
                'still_active': still_active,
                'retention': round((still_active / signed_up * 100) if signed_up else 0, 1)
            })
        return cohorts
