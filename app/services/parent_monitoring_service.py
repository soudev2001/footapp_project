from datetime import datetime
from bson import ObjectId


class ParentMonitoringService:
    def __init__(self, db):
        self.db = db

    def get_child_progress(self, player_id):
        player = self.db.players.find_one({'_id': ObjectId(player_id)})
        if not player:
            return None
        stats = player.get('stats', {})
        ratings = player.get('technical_ratings', {})
        physical = player.get('physical_records', [])
        matches_played = stats.get('matches_played', 0)
        goals = stats.get('goals', 0)
        assists = stats.get('assists', 0)
        attendance_records = list(self.db.events.find(
            {'attendance': {'$elemMatch': {'player_id': str(player['_id'])}}},
            {'attendance.$': 1, 'type': 1, 'date': 1}
        ).sort('date', -1).limit(20))
        total_events = len(attendance_records)
        present = sum(1 for e in attendance_records
                      for a in e.get('attendance', [])
                      if a.get('player_id') == str(player['_id']) and a.get('status') == 'present')
        attendance_rate = round((present / total_events * 100) if total_events else 0, 1)
        injuries = list(self.db.injuries.find(
            {'player_id': ObjectId(player_id)},
            {'_id': 1, 'injury_type': 1, 'body_part': 1, 'severity': 1, 'status': 1, 'injury_date': 1}
        ).sort('injury_date', -1).limit(5))
        return {
            'player': {
                'name': player.get('name', ''),
                'position': player.get('position', ''),
                'jersey_number': player.get('jersey_number'),
            },
            'stats': {'matches_played': matches_played, 'goals': goals, 'assists': assists},
            'ratings': ratings,
            'physical_records': physical[-5:] if physical else [],
            'attendance_rate': attendance_rate,
            'injuries': [{
                'id': str(i['_id']),
                'type': i.get('injury_type', ''),
                'body_part': i.get('body_part', ''),
                'severity': i.get('severity', ''),
                'status': i.get('status', ''),
                'date': i.get('injury_date'),
            } for i in injuries],
        }

    def get_coach_feedback(self, player_id):
        player = self.db.players.find_one({'_id': ObjectId(player_id)})
        if not player:
            return []
        evaluations = player.get('evaluations', [])
        return [{
            'date': e.get('date'),
            'coach_id': str(e.get('coach_id', '')),
            'rating': e.get('rating'),
            'comment': e.get('comment', ''),
        } for e in evaluations[-10:]]

    def get_achievements(self, player_id):
        player = self.db.players.find_one({'_id': ObjectId(player_id)})
        if not player:
            return []
        achievements = []
        stats = player.get('stats', {})
        if stats.get('goals', 0) > 0:
            achievements.append({'type': 'goals', 'label': f"{stats['goals']} buts marqués", 'value': stats['goals']})
        if stats.get('assists', 0) > 0:
            achievements.append({'type': 'assists', 'label': f"{stats['assists']} passes décisives", 'value': stats['assists']})
        if stats.get('matches_played', 0) >= 10:
            achievements.append({'type': 'matches', 'label': f"{stats['matches_played']} matchs joués", 'value': stats['matches_played']})
        return achievements
