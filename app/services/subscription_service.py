# FootLogic V2 - Subscription Service

from bson import ObjectId
from datetime import datetime

class SubscriptionService:
    """Service for managing club subscriptions and licenses"""
    
    # Subscription Plans Definition
    PLANS = {
        'pack_pro': {
            'name': 'Pack Pro',
            'base_price': 49.00, # Base monthly fee
            'coach_license': 5.00,
            'player_license': 1.50,
            'features': ['match_center', 'tactics_board', 'roster_management', 'attendance']
        },
        'pass_elite': {
            'name': 'Pass Elite',
            'base_price': 99.00,
            'coach_license': 0.00, # Included
            'player_license': 1.00,
            'features': ['all', 'live_match', 'scouting', 'analytics', 'advanced_tactics']
        },
        'club_standard': {
            'name': 'Club Standard',
            'base_price': 29.00,
            'coach_license': 10.00,
            'player_license': 2.00,
            'features': ['basic_roster', 'attendance', 'calendar']
        }
    }

    def __init__(self, db):
        self.db = db
        self.collection = db.clubs # Or a separate subscriptions collection

    def get_plans(self):
        return self.PLANS

    def update_subscription(self, club_id, plan_id):
        """Update a club's subscription plan"""
        if plan_id not in self.PLANS:
            raise ValueError("Invalid plan selected")
            
        return self.db.clubs.update_one(
            {'_id': ObjectId(club_id)},
            {
                '$set': {
                    'subscription': {
                        'plan_id': plan_id,
                        'status': 'active',
                        'start_date': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    }
                }
            }
        )

    def calculate_monthly_bill(self, club_id):
        """Calculate the monthly bill based on current user counts"""
        club = self.db.clubs.find_one({'_id': ObjectId(club_id)})
        if not club or 'subscription' not in club:
            return None
            
        plan_id = club['subscription']['plan_id']
        plan = self.PLANS.get(plan_id)
        
        # Count users by role
        coach_count = self.db.users.count_documents({
            'club_id': ObjectId(club_id),
            'role': 'coach'
        })
        player_count = self.db.players.count_documents({
            'club_id': ObjectId(club_id)
        })
        
        # Calculation
        base = plan['base_price']
        coaches_cost = coach_count * plan['coach_license']
        players_cost = player_count * plan['player_license']
        
        total = base + coaches_cost + players_cost
        
        return {
            'plan_name': plan['name'],
            'base_price': base,
            'coach_count': coach_count,
            'coach_cost_total': coaches_cost,
            'player_count': player_count,
            'player_cost_total': players_cost,
            'total_monthly': total
        }

    def get_subscription_status(self, club_id):
        """Get summarized subscription status for a club"""
        club = self.db.clubs.find_one({'_id': ObjectId(club_id)})
        if not club: return None
        
        sub = club.get('subscription', {
            'plan_id': None,
            'status': 'inactive'
        })
        
        if sub['plan_id']:
            sub['details'] = self.PLANS.get(sub['plan_id'])
            sub['billing'] = self.calculate_monthly_bill(club_id)
            
        return sub
