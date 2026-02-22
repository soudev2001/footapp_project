"""Tests for MatchService."""
from datetime import datetime, timedelta


def get_service(app):
    with app.app_context():
        from app.services import get_match_service
        return get_match_service()


def test_create_match(app, seed_club):
    """create should insert a match document."""
    with app.app_context():
        svc = get_service(app)
        match = svc.create(
            club_id=str(seed_club['_id']),
            opponent='FC Rival',
            date=datetime.utcnow() + timedelta(days=7),
            is_home=True
        )
        assert match['opponent'] == 'FC Rival'
        assert match['is_home'] is True
        assert match['status'] == 'scheduled'


def test_get_by_id(app, seed_club):
    """get_by_id should return match."""
    with app.app_context():
        svc = get_service(app)
        match = svc.create(str(seed_club['_id']), 'Opponent', datetime.utcnow())
        found = svc.get_by_id(str(match['_id']))
        assert found['opponent'] == 'Opponent'


def test_get_upcoming(app, seed_club):
    """get_upcoming should return only scheduled future matches."""
    with app.app_context():
        svc = get_service(app)
        svc.create(str(seed_club['_id']), 'Future', datetime.utcnow() + timedelta(days=7))
        upcoming = svc.get_upcoming(str(seed_club['_id']))
        assert len(upcoming) >= 1


def test_start_match(app, seed_club):
    """start_match should set status to live."""
    with app.app_context():
        svc = get_service(app)
        match = svc.create(str(seed_club['_id']), 'LiveTest', datetime.utcnow())
        svc.start_match(str(match['_id']))
        updated = svc.get_by_id(str(match['_id']))
        assert updated['status'] == 'live'


def test_finish_match(app, seed_club):
    """finish_match should set status to completed."""
    with app.app_context():
        svc = get_service(app)
        match = svc.create(str(seed_club['_id']), 'FinishTest', datetime.utcnow())
        svc.start_match(str(match['_id']))
        svc.finish_match(str(match['_id']))
        updated = svc.get_by_id(str(match['_id']))
        assert updated['status'] == 'completed'


def test_set_score(app, seed_club):
    """set_score should update match score."""
    with app.app_context():
        svc = get_service(app)
        match = svc.create(str(seed_club['_id']), 'ScoreTest', datetime.utcnow())
        svc.set_score(str(match['_id']), 3, 1)
        updated = svc.get_by_id(str(match['_id']))
        assert updated['score']['home'] == 3
        assert updated['score']['away'] == 1


def test_add_event(app, seed_club, seed_player):
    """add_event should push a match event (goal, card)."""
    with app.app_context():
        svc = get_service(app)
        match = svc.create(str(seed_club['_id']), 'EventTest', datetime.utcnow())
        svc.add_event(str(match['_id']), 'goal', str(seed_player['_id']), 45)
        updated = svc.get_by_id(str(match['_id']))
        events = updated.get('events', [])
        assert len(events) == 1
        assert events[0]['type'] == 'goal'
        assert events[0]['minute'] == 45


def test_get_completed(app, seed_club):
    """get_completed should return finished matches."""
    with app.app_context():
        svc = get_service(app)
        match = svc.create(str(seed_club['_id']), 'Done', datetime.utcnow() - timedelta(days=3))
        svc.finish_match(str(match['_id']))
        completed = svc.get_completed(str(seed_club['_id']))
        assert len(completed) >= 1


def test_get_season_stats(app, seed_club):
    """get_season_stats should calculate W/D/L and points."""
    with app.app_context():
        svc = get_service(app)
        # Win
        m1 = svc.create(str(seed_club['_id']), 'W', datetime.utcnow() - timedelta(days=10))
        svc.set_score(str(m1['_id']), 3, 1, status='completed')
        svc.finish_match(str(m1['_id']))
        # Draw
        m2 = svc.create(str(seed_club['_id']), 'D', datetime.utcnow() - timedelta(days=5))
        svc.set_score(str(m2['_id']), 1, 1, status='completed')
        svc.finish_match(str(m2['_id']))

        stats = svc.get_season_stats(str(seed_club['_id']))
        assert stats['played'] >= 2
        assert 'wins' in stats
        assert 'points' in stats


def test_delete_match(app, seed_club):
    """delete should remove match."""
    with app.app_context():
        svc = get_service(app)
        match = svc.create(str(seed_club['_id']), 'Del', datetime.utcnow())
        svc.delete(str(match['_id']))
        assert svc.get_by_id(str(match['_id'])) is None
