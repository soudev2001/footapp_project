# FootLogic V2 - Player Performance Analytics Service

from bson import ObjectId
from datetime import datetime, timedelta


class PlayerAnalyticsService:
    """Service for player dashboards, comparisons, trend analysis, and rankings."""

    def __init__(self, db):
        self.db = db
        self.players = db.players
        self.matches = db.matches
        self.injuries = db.injuries
        self.training_sessions = db.training_sessions

    # ── Player Dashboard ────────────────────────────────────

    def get_player_dashboard(self, player_id):
        player = self.players.find_one({'_id': ObjectId(player_id)})
        if not player:
            return None

        stats = player.get('stats', {})
        ratings = player.get('technical_ratings', {})
        evaluations = player.get('evaluations', [])
        physical_history = player.get('physical_history', [])

        # Match details
        club_id = player.get('club_id')
        team_id = player.get('team_id')
        match_query = {'club_id': club_id, 'status': 'completed'}
        if team_id:
            match_query['team_id'] = team_id
        matches = list(self.matches.find(match_query).sort('date', -1).limit(50))

        # Goals over time from match events
        goals_timeline = []
        assists_timeline = []
        for m in matches:
            for evt in m.get('events', []):
                if str(evt.get('player_id')) == str(player_id):
                    if evt.get('type') == 'goal':
                        goals_timeline.append({'date': m.get('date'), 'opponent': m.get('opponent', '')})
                    elif evt.get('type') == 'assist':
                        assists_timeline.append({'date': m.get('date'), 'opponent': m.get('opponent', '')})

        # Training attendance
        sess_query = {'attendance.player_id': ObjectId(player_id), 'status': 'completed'}
        if team_id:
            sess_query['team_id'] = team_id
        total_sessions = self.training_sessions.count_documents(
            {'team_id': team_id, 'status': 'completed'} if team_id else {'status': 'completed'}
        )
        attended = self.training_sessions.count_documents(sess_query)
        attendance_rate = round((attended / total_sessions * 100), 1) if total_sessions else 100.0

        # Injury summary
        injury_list = list(self.injuries.find({'player_id': ObjectId(player_id)}).sort('injury_date', -1).limit(5))
        active_injury = next((i for i in injury_list if i.get('status') == 'active'), None)

        return {
            'player_id': str(player_id),
            'name': player.get('name', ''),
            'position': player.get('position', ''),
            'jersey_number': player.get('jersey_number'),
            'stats': stats,
            'technical_ratings': ratings,
            'evaluations': [{'comment': e.get('comment', ''), 'rating': e.get('rating'),
                             'date': e.get('date', '')} for e in evaluations[-5:]],
            'physical_history': physical_history[-10:],
            'goals_timeline': goals_timeline,
            'assists_timeline': assists_timeline,
            'training_attendance': {
                'total_sessions': total_sessions,
                'attended': attended,
                'rate': attendance_rate,
            },
            'injury_summary': {
                'total': len(injury_list),
                'active': {
                    'injury_type': active_injury.get('injury_type'),
                    'body_part': active_injury.get('body_part'),
                    'expected_return': active_injury.get('expected_return'),
                } if active_injury else None,
            },
            'matches_played': stats.get('matches_played', 0),
        }

    # ── Player Comparison ───────────────────────────────────

    def compare_players(self, player_ids):
        results = []
        for pid in player_ids[:5]:  # max 5
            player = self.players.find_one({'_id': ObjectId(pid)})
            if not player:
                continue
            stats = player.get('stats', {})
            ratings = player.get('technical_ratings', {})
            results.append({
                'player_id': str(pid),
                'name': player.get('name', ''),
                'position': player.get('position', ''),
                'jersey_number': player.get('jersey_number'),
                'stats': stats,
                'technical_ratings': ratings,
                'status': player.get('status', 'active'),
            })
        return results

    # ── Trend Analysis ──────────────────────────────────────

    def get_trend_analysis(self, player_id):
        player = self.players.find_one({'_id': ObjectId(player_id)})
        if not player:
            return None

        ratings = player.get('technical_ratings', {})
        physical = player.get('physical_history', [])
        evaluations = player.get('evaluations', [])

        # Rating trend: current vs. initial (if history available)
        ratings_history = player.get('ratings_history', [])
        rating_trend = {}
        if ratings_history:
            first = ratings_history[0]
            for key in ('VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY'):
                current = ratings.get(key, 50)
                initial = first.get(key, 50)
                rating_trend[key] = current - initial
        else:
            rating_trend = {k: 0 for k in ('VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY')}

        # Recent form from evaluations
        recent_evals = evaluations[-5:] if evaluations else []
        avg_rating = 0
        if recent_evals:
            ratings_vals = [e.get('rating', 5) for e in recent_evals if e.get('rating')]
            avg_rating = round(sum(ratings_vals) / len(ratings_vals), 1) if ratings_vals else 0

        # Physical trend
        physical_trend = None
        if len(physical) >= 2:
            latest = physical[-1]
            previous = physical[-2]
            physical_trend = {
                'weight': (latest.get('weight', 0) or 0) - (previous.get('weight', 0) or 0),
                'vma': (latest.get('vma', 0) or 0) - (previous.get('vma', 0) or 0),
            }

        return {
            'rating_trend': rating_trend,
            'recent_form': avg_rating,
            'physical_trend': physical_trend,
            'evaluations_count': len(evaluations),
        }

    # ── Team Rankings ───────────────────────────────────────

    def get_team_rankings(self, team_id):
        players = list(self.players.find({'team_id': ObjectId(team_id), 'status': {'$ne': 'deleted'}}))
        rankings = []
        for p in players:
            stats = p.get('stats', {})
            ratings = p.get('technical_ratings', {})
            avg_rating = round(sum(ratings.values()) / len(ratings), 1) if ratings else 0
            rankings.append({
                'player_id': str(p['_id']),
                'name': p.get('name', ''),
                'position': p.get('position', ''),
                'jersey_number': p.get('jersey_number'),
                'goals': stats.get('goals', 0),
                'assists': stats.get('assists', 0),
                'matches_played': stats.get('matches_played', 0),
                'avg_rating': avg_rating,
                'status': p.get('status', 'active'),
            })
        rankings.sort(key=lambda x: x['avg_rating'], reverse=True)
        return rankings
