"""Tests for EventService."""
from datetime import datetime, timedelta


def get_service(app):
    with app.app_context():
        from app.services import get_event_service
        return get_event_service()


def test_create_event(app, seed_club):
    """create should insert an event."""
    with app.app_context():
        svc = get_service(app)
        event = svc.create(
            club_id=str(seed_club['_id']),
            title='Entrainement',
            event_type='training',
            date=datetime.utcnow() + timedelta(days=1)
        )
        assert event['title'] == 'Entrainement'
        assert event['type'] == 'training'


def test_get_by_id(app, seed_club):
    """get_by_id should return event."""
    with app.app_context():
        svc = get_service(app)
        event = svc.create(str(seed_club['_id']), 'Test', 'training', datetime.utcnow())
        found = svc.get_by_id(str(event['_id']))
        assert found['title'] == 'Test'


def test_get_upcoming(app, seed_club):
    """get_upcoming should return only future events."""
    with app.app_context():
        svc = get_service(app)
        svc.create(str(seed_club['_id']), 'Past', 'training', datetime.utcnow() - timedelta(days=5))
        svc.create(str(seed_club['_id']), 'Future', 'training', datetime.utcnow() + timedelta(days=5))
        upcoming = svc.get_upcoming(str(seed_club['_id']))
        titles = [e['title'] for e in upcoming]
        assert 'Future' in titles
        assert 'Past' not in titles


def test_get_past(app, seed_club):
    """get_past should return past events."""
    with app.app_context():
        svc = get_service(app)
        svc.create(str(seed_club['_id']), 'Past', 'match', datetime.utcnow() - timedelta(days=5))
        past = svc.get_past(str(seed_club['_id']))
        assert len(past) >= 1


def test_get_by_type(app, seed_club):
    """get_by_type should filter events."""
    with app.app_context():
        svc = get_service(app)
        svc.create(str(seed_club['_id']), 'Train', 'training', datetime.utcnow())
        svc.create(str(seed_club['_id']), 'Meet', 'meeting', datetime.utcnow())
        trainings = svc.get_by_type(str(seed_club['_id']), 'training')
        assert all(e['type'] == 'training' for e in trainings)


def test_set_attendance(app, seed_club, seed_player):
    """set_attendance should set player status on event."""
    with app.app_context():
        svc = get_service(app)
        event = svc.create(str(seed_club['_id']), 'Attendance Test', 'training', datetime.utcnow())
        svc.set_attendance(str(event['_id']), str(seed_player['_id']), 'present')
        att = svc.get_attendance(str(event['_id']))
        assert str(seed_player['_id']) in att
        assert att[str(seed_player['_id'])] == 'present'


def test_set_bulk_attendance(app, seed_club, seed_player):
    """set_bulk_attendance should set multiple player statuses."""
    with app.app_context():
        svc = get_service(app)
        event = svc.create(str(seed_club['_id']), 'Bulk Test', 'training', datetime.utcnow())
        attendance_map = {str(seed_player['_id']): 'absent'}
        svc.set_bulk_attendance(str(event['_id']), attendance_map)
        att = svc.get_attendance(str(event['_id']))
        assert att[str(seed_player['_id'])] == 'absent'


def test_update_event(app, seed_club):
    """update should modify event fields."""
    with app.app_context():
        svc = get_service(app)
        event = svc.create(str(seed_club['_id']), 'Old Title', 'training', datetime.utcnow())
        svc.update(str(event['_id']), {'title': 'New Title'})
        updated = svc.get_by_id(str(event['_id']))
        assert updated['title'] == 'New Title'


def test_delete_event(app, seed_club):
    """delete should remove event."""
    with app.app_context():
        svc = get_service(app)
        event = svc.create(str(seed_club['_id']), 'ToDelete', 'training', datetime.utcnow())
        svc.delete(str(event['_id']))
        assert svc.get_by_id(str(event['_id'])) is None
