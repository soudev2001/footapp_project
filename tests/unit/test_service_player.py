"""Tests for PlayerService — CRUD, tactics, lineups, presets."""
from bson import ObjectId


def get_service(app):
    with app.app_context():
        from app.services import get_player_service
        return get_player_service()


# ============================================================
# PLAYER CRUD
# ============================================================

def test_create_player(app, seed_club, seed_team):
    """create should insert a player document."""
    with app.app_context():
        svc = get_service(app)
        player = svc.create(
            club_id=str(seed_club['_id']),
            jersey_number=7,
            position='Attaquant',
            name='Joueur Test',
            team_id=str(seed_team['_id'])
        )
        assert player is not None
        assert player['jersey_number'] == 7
        assert player['position'] == 'Attaquant'


def test_get_by_id(app, seed_player):
    """get_by_id should return player."""
    with app.app_context():
        svc = get_service(app)
        found = svc.get_by_id(str(seed_player['_id']))
        assert found is not None
        assert found['name'] == 'Player User'


def test_get_by_club(app, seed_club, seed_player):
    """get_by_club should return players for a club."""
    with app.app_context():
        svc = get_service(app)
        players = svc.get_by_club(str(seed_club['_id']))
        assert len(players) >= 1


def test_get_by_club_with_team_filter(app, seed_club, seed_team, seed_player):
    """get_by_club with team_id should filter."""
    with app.app_context():
        svc = get_service(app)
        players = svc.get_by_club(str(seed_club['_id']), team_id=str(seed_team['_id']))
        assert len(players) >= 1


def test_get_by_user(app, seed_player, seed_player_user):
    """get_by_user should return player linked to user."""
    with app.app_context():
        svc = get_service(app)
        player = svc.get_by_user(str(seed_player_user['_id']))
        assert player is not None


def test_update_player(app, seed_player):
    """update should modify player fields."""
    with app.app_context():
        svc = get_service(app)
        svc.update(str(seed_player['_id']), {'jersey_number': 99})
        updated = svc.get_by_id(str(seed_player['_id']))
        assert updated['jersey_number'] == 99


def test_delete_player(app, seed_club, seed_team):
    """delete should remove player from DB."""
    with app.app_context():
        svc = get_service(app)
        player = svc.create(str(seed_club['_id']), 11, 'DEF', 'ToDelete', team_id=str(seed_team['_id']))
        svc.delete(str(player['_id']))
        assert svc.get_by_id(str(player['_id'])) is None


def test_set_status(app, seed_player):
    """set_status should update player status."""
    with app.app_context():
        svc = get_service(app)
        svc.set_status(str(seed_player['_id']), 'injured')
        updated = svc.get_by_id(str(seed_player['_id']))
        assert updated['status'] == 'injured'


# ============================================================
# STATS & RATINGS
# ============================================================

def test_update_stats(app, seed_player):
    """update_stats should modify performance stats."""
    with app.app_context():
        svc = get_service(app)
        svc.update_stats(str(seed_player['_id']), {'goals': 10, 'assists': 5})
        updated = svc.get_by_id(str(seed_player['_id']))
        assert updated['stats']['goals'] == 10


def test_update_technical_ratings(app, seed_player):
    """update_technical_ratings should set FIFA-style ratings."""
    with app.app_context():
        svc = get_service(app)
        svc.update_technical_ratings(str(seed_player['_id']), {'VIT': 90, 'TIR': 85})
        updated = svc.get_by_id(str(seed_player['_id']))
        assert updated['technical_ratings']['VIT'] == 90


def test_add_evaluation(app, seed_player):
    """add_evaluation should push an evaluation entry."""
    with app.app_context():
        svc = get_service(app)
        svc.add_evaluation(str(seed_player['_id']), {'type': 'match', 'comment': 'Bon match'})
        updated = svc.get_by_id(str(seed_player['_id']))
        evals = updated.get('evaluations', [])
        assert len(evals) == 1
        assert evals[0]['comment'] == 'Bon match'


def test_add_physical_record(app, seed_player):
    """add_physical_record should push a physical history entry."""
    with app.app_context():
        svc = get_service(app)
        svc.add_physical_record(str(seed_player['_id']), {'weight': 76, 'vma': 16.5, 'note': 'Forme'})
        updated = svc.get_by_id(str(seed_player['_id']))
        records = updated.get('physical_history', [])
        assert len(records) == 1


def test_get_top_scorers(app, seed_club, seed_team):
    """get_top_scorers should sort by goals desc."""
    with app.app_context():
        svc = get_service(app)
        svc.create(str(seed_club['_id']), 9, 'ATT', 'Scorer1', team_id=str(seed_team['_id']),
                    stats={'goals': 15, 'assists': 2})
        svc.create(str(seed_club['_id']), 10, 'ATT', 'Scorer2', team_id=str(seed_team['_id']),
                    stats={'goals': 20, 'assists': 5})
        top = svc.get_top_scorers(str(seed_club['_id']), limit=2)
        assert len(top) == 2
        assert top[0]['stats']['goals'] >= top[1]['stats']['goals']


# ============================================================
# LINEUP & TACTICS
# ============================================================

def test_save_and_get_lineup(app, seed_club, seed_team):
    """save_lineup + get_active_lineup should persist and retrieve."""
    with app.app_context():
        svc = get_service(app)
        svc.save_lineup(
            club_id=str(seed_club['_id']),
            formation='4-4-2',
            starters={'GK': 'player1', 'DEF1': 'player2'},
            team_id=str(seed_team['_id']),
            substitutes=['sub1', 'sub2']
        )
        lineup = svc.get_active_lineup(str(seed_club['_id']), team_id=str(seed_team['_id']))
        assert lineup is not None
        assert lineup['formation'] == '4-4-2'


def test_save_tactical_config(app, seed_club, seed_team):
    """save_tactical_config should persist config."""
    with app.app_context():
        svc = get_service(app)
        svc.save_tactical_config(
            club_id=str(seed_club['_id']),
            team_id=str(seed_team['_id']),
            config={'pressing': 'high', 'width': 'wide'}
        )
        lineup = svc.get_active_lineup(str(seed_club['_id']), team_id=str(seed_team['_id']))
        assert lineup.get('tactical_config') is not None


def test_save_and_get_preset(app, seed_club, seed_team):
    """save_tactic_preset + get_tactic_preset should persist and retrieve."""
    with app.app_context():
        svc = get_service(app)
        preset_id = svc.save_tactic_preset(
            club_id=str(seed_club['_id']),
            team_id=str(seed_team['_id']),
            name='Test Preset',
            formation='3-5-2',
            starters=[],
            substitutes=[]
        )
        assert preset_id is not None
        preset = svc.get_tactic_preset(preset_id)
        assert preset['name'] == 'Test Preset'
        assert preset['formation'] == '3-5-2'


def test_get_tactic_presets_list(app, seed_club, seed_team):
    """get_tactic_presets should return all presets for club/team."""
    with app.app_context():
        svc = get_service(app)
        svc.save_tactic_preset(str(seed_club['_id']), str(seed_team['_id']),
                               'Preset A', '4-3-3', [], [])
        svc.save_tactic_preset(str(seed_club['_id']), str(seed_team['_id']),
                               'Preset B', '4-4-2', [], [])
        presets = svc.get_tactic_presets(str(seed_club['_id']), str(seed_team['_id']))
        assert len(presets) == 2


def test_delete_tactic_preset(app, seed_club, seed_team):
    """delete_tactic_preset should remove the preset."""
    with app.app_context():
        svc = get_service(app)
        pid = svc.save_tactic_preset(str(seed_club['_id']), str(seed_team['_id']),
                                     'ToDelete', '4-3-3', [], [])
        svc.delete_tactic_preset(pid)
        assert svc.get_tactic_preset(pid) is None
