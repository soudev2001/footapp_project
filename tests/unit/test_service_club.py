"""Tests for ClubService."""


def get_service(app):
    with app.app_context():
        from app.services import get_club_service
        return get_club_service()


def test_create_club(app):
    """create should insert a club document."""
    with app.app_context():
        svc = get_service(app)
        club = svc.create('FC Nouveau', city='Paris', colors={'primary': '#ff0000', 'secondary': '#0000ff'})
        assert club['name'] == 'FC Nouveau'
        assert club['city'] == 'Paris'
        assert '_id' in club


def test_get_all(app):
    """get_all should return all clubs."""
    with app.app_context():
        svc = get_service(app)
        svc.create('Club A', city='A', colors={})
        svc.create('Club B', city='B', colors={})
        assert len(svc.get_all()) == 2


def test_get_by_id(app):
    """get_by_id should find club."""
    with app.app_context():
        svc = get_service(app)
        club = svc.create('FC Find', city='Find', colors={})
        found = svc.get_by_id(str(club['_id']))
        assert found['name'] == 'FC Find'


def test_update_club(app):
    """update should modify club fields."""
    with app.app_context():
        svc = get_service(app)
        club = svc.create('FC Old', city='Old', colors={})
        svc.update(str(club['_id']), {'name': 'FC New', 'city': 'New'})
        updated = svc.get_by_id(str(club['_id']))
        assert updated['name'] == 'FC New'


def test_delete_club(app):
    """delete should remove club."""
    with app.app_context():
        svc = get_service(app)
        club = svc.create('FC Delete', city='Del', colors={})
        svc.delete(str(club['_id']))
        assert svc.get_by_id(str(club['_id'])) is None


def test_get_stats(app, seed_club):
    """get_stats should return counts for club collections."""
    with app.app_context():
        svc = get_service(app)
        stats = svc.get_stats(str(seed_club['_id']))
        assert 'players' in stats
        assert 'events' in stats
        assert 'matches' in stats
