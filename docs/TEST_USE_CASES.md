# FootApp — Documentation des Cas de Test

> **Mise à jour :** 18 avril 2026  
> Suite de tests : **Pytest** | E2E : **Playwright**  
> Config : `pytest.ini` — tests dans `tests/`, E2E exclus par défaut (`-m "not e2e"`)

---

## Sommaire

1. [Lancer les tests](#1-lancer-les-tests)
2. [Architecture des tests](#2-architecture-des-tests)
3. [Fixtures & données de test](#3-fixtures--données-de-test)
4. [UC-AUTH — Authentification](#4-uc-auth--authentification)
5. [UC-REG — Inscription](#5-uc-reg--inscription)
6. [UC-PUBLIC — Pages publiques](#6-uc-public--pages-publiques)
7. [UC-COACH — Interface Coach](#7-uc-coach--interface-coach)
8. [UC-PLAYER — Interface Joueur](#8-uc-player--interface-joueur)
9. [UC-ADMIN — Interface Admin](#9-uc-admin--interface-admin)
10. [SVC-PLAYER — Service Joueur (unitaire)](#10-svc-player--service-joueur-unitaire)
11. [SVC-MATCH — Service Match (unitaire)](#11-svc-match--service-match-unitaire)
12. [SVC-EVENT — Service Événement (unitaire)](#12-svc-event--service-événement-unitaire)
13. [E2E — Tests navigateur (Playwright)](#13-e2e--tests-navigateur-playwright)
14. [Matrice de couverture](#14-matrice-de-couverture)
15. [Ajouter un nouveau cas de test](#15-ajouter-un-nouveau-cas-de-test)

---

## 1. Lancer les tests

```bash
# Tous les tests unitaires (E2E exclus)
pytest

# Avec rapport détaillé
pytest -v

# Un fichier spécifique
pytest tests/unit/test_auth.py

# Un test précis
pytest tests/unit/test_auth.py::test_login_with_valid_credentials

# Uniquement les tests E2E (Playwright requis)
pytest -m e2e

# Avec couverture de code
pytest --cov=app --cov-report=html
```

---

## 2. Architecture des tests

```
tests/
├── conftest.py              # Fixtures globales (app, client, DB, seeds)
├── test_auth.py             # Tests d'authentification (legacy)
├── test_login.py            # Tests de login (legacy)
├── test_email.py            # Tests du service email
├── unit/
│   ├── test_auth.py         # Auth : login, logout, register, club
│   ├── test_coach.py        # Routes coach : dashboard, joueurs, tactiques
│   ├── test_player.py       # Routes joueur : profil, calendrier, contrats
│   ├── test_admin.py        # Routes admin : panel, membres, équipes
│   ├── test_public.py       # Routes publiques sans auth
│   ├── test_service_player.py   # Service PlayerService (CRUD)
│   ├── test_service_match.py    # Service MatchService (lifecycle)
│   ├── test_service_event.py    # Service EventService (présences)
│   ├── test_service_club.py     # Service ClubService
│   ├── test_service_user.py     # Service UserService
│   └── test_service_others.py   # Autres services
└── e2e/
    ├── conftest.py          # Fixtures Playwright (live_server, page)
    └── test_login_flow.py   # Flux de connexion dans le navigateur
```

---

## 3. Fixtures & données de test

Définies dans `tests/conftest.py`. La base MongoDB de test est **vidée avant et après chaque test** (`autouse=True`).

| Fixture | Description | Données créées |
|---|---|---|
| `app` | Application Flask en mode `testing` | — |
| `client` | Client HTTP Flask | — |
| `db` | Accès direct MongoDB | — |
| `seed_club` | Club de test | `FC Test`, ville : `TestVille` |
| `seed_team` | Équipe liée au club | `Equipe A`, catégorie : `Senior` |
| `seed_admin` | Utilisateur admin | `admin@test.com` / `admin123` |
| `seed_coach` | Utilisateur coach | `coach@test.com` / `coach123` |
| `seed_player` | Document joueur | #10, Milieu |
| `seed_player_user` | Utilisateur joueur | `player@test.com` / `player123` |
| `admin_client` | Client HTTP connecté en admin | Session initialisée |
| `coach_client` | Client HTTP connecté en coach | Session initialisée |
| `player_client` | Client HTTP connecté en joueur | Session initialisée |

---

## 4. UC-AUTH — Authentification

**Fichier :** `tests/unit/test_auth.py`

| ID | Nom du test | Précondition | Action | Résultat attendu |
|---|---|---|---|---|
| AUTH-01 | `test_login_page_loads` | Aucune | `GET /login` | HTTP 200, contient `"Connexion"` |
| AUTH-02 | `test_login_with_invalid_credentials` | Aucune | `POST /login` — mauvais email/mdp | HTTP 200, message `"Email ou mot de passe incorrect"` |
| AUTH-03 | `test_login_with_valid_credentials` | `seed_coach` | `POST /login` — `coach@test.com` | HTTP 302 (redirection) |
| AUTH-04 | `test_login_sets_session` | `seed_admin` | `POST /login` — admin | Session contient `user_id`, `user_role=admin`, `user_email` |
| AUTH-05 | `test_logout_clears_session` | Admin connecté | `GET /logout` | HTTP 302, session vidée (`user_id` absent) |

---

## 5. UC-REG — Inscription

**Fichier :** `tests/unit/test_auth.py`

| ID | Nom du test | Précondition | Action | Résultat attendu |
|---|---|---|---|---|
| REG-01 | `test_register_page_loads` | Aucune | `GET /register` | HTTP 200 |
| REG-02 | `test_register_new_user` | Email non utilisé | `POST /register` — données valides | HTTP 302 → `/login`, utilisateur en DB |
| REG-03 | `test_register_duplicate_email` | `seed_admin` | `POST /register` — email existant | HTTP 200, message `"email est deja utilise"` |
| REG-04 | `test_register_password_mismatch` | Aucune | `POST /register` — mdp ≠ confirmation | HTTP 200, message `"mots de passe ne correspondent pas"` |

---

## 6. UC-PUBLIC — Pages publiques

**Fichier :** `tests/unit/test_public.py`

| ID | Nom du test | Auth | Route | Résultat attendu |
|---|---|---|---|---|
| PUB-01 | `test_homepage_loads` | Non | `GET /` | HTTP 200, contient `"FootLogic"` |
| PUB-02 | `test_homepage_redirects_when_logged_in` | Admin | `GET /` | HTTP 302 → `/app-home` |
| PUB-03 | `test_ranking_page_loads` | Non | `GET /ranking` | HTTP 200 |
| PUB-04 | `test_terms_page_loads` | Non | `GET /terms` | HTTP 200 |
| PUB-05 | `test_help_page_loads` | Non | `GET /help` | HTTP 200 |
| PUB-06 | `test_404_page` | Non | `GET /route-inexistante` | HTTP 404 |
| PUB-07 | `test_public_club_page` | Non | `GET /public-club?club_id=<id>` | HTTP 200 avec infos club |

---

## 7. UC-COACH — Interface Coach

**Fichier :** `tests/unit/test_coach.py`

### Contrôle d'accès

| ID | Nom du test | Rôle | Route | Résultat attendu |
|---|---|---|---|---|
| COACH-01 | `test_coach_dashboard_requires_login` | Non connecté | `GET /coach/dashboard` | HTTP 302 → `/login` |
| COACH-02 | `test_coach_dashboard_forbidden_for_player` | Joueur | `GET /coach/dashboard` | HTTP 302 ou 403 |

### Dashboard & Effectif

| ID | Nom du test | Précondition | Résultat attendu |
|---|---|---|---|
| COACH-03 | `test_coach_dashboard_loads` | Coach + équipe | HTTP 200 |
| COACH-04 | `test_coach_roster_loads` | Coach + équipe | HTTP 200 |

### Gestion des joueurs

| ID | Nom du test | Action | Résultat attendu |
|---|---|---|---|
| COACH-05 | `test_coach_add_player` | `POST /coach/player/add` — données complètes | HTTP 302, joueur et utilisateur créés en DB |
| COACH-06 | `test_coach_view_player_detail` | `GET /coach/player/<id>` | HTTP 200 |

### Tactiques & Lineup

| ID | Nom du test | Action | Résultat attendu |
|---|---|---|---|
| COACH-07 | `test_coach_tactics_page_loads` | `GET /coach/tactics` | HTTP 200 |
| COACH-08 | `test_coach_save_lineup` | `POST /coach/tactics/save` (JSON) | HTTP 200, `status: "success"` |
| COACH-09 | `test_coach_save_and_load_preset` | Save + Load preset (JSON) | Preset sauvé, `preset_id` retourné, rechargement OK |

---

## 8. UC-PLAYER — Interface Joueur

**Fichier :** `tests/unit/test_player.py`

### Contrôle d'accès

| ID | Nom du test | Rôle | Route | Résultat attendu |
|---|---|---|---|---|
| PLAY-01 | `test_player_home_requires_login` | Non connecté | `GET /player/home` | HTTP 302 → `/login` |

### Pages joueur

| ID | Nom du test | Route | Résultat attendu |
|---|---|---|---|
| PLAY-02 | `test_player_home_loads` | `GET /player/home` | HTTP 200 |
| PLAY-03 | `test_player_profile_loads` | `GET /player/profile` | HTTP 200 |
| PLAY-04 | `test_player_calendar_loads` | `GET /player/calendar` | HTTP 200 |
| PLAY-05 | `test_player_contracts_loads` | `GET /player/contracts` | HTTP 200 |

### Modification de profil

| ID | Nom du test | Action | Résultat attendu |
|---|---|---|---|
| PLAY-06 | `test_player_edit_profile` | `POST /player/profile/edit` — nouveau prénom/nom/téléphone | HTTP 302 → `/player/profile` |

---

## 9. UC-ADMIN — Interface Admin

**Fichier :** `tests/unit/test_admin.py`

### Contrôle d'accès

| ID | Nom du test | Rôle | Route | Résultat attendu |
|---|---|---|---|---|
| ADM-01 | `test_admin_panel_requires_login` | Non connecté | `GET /admin/` | HTTP 302 → `/login` |
| ADM-02 | `test_admin_panel_forbidden_for_player` | Joueur | `GET /admin/` | HTTP 302 ou 403 |
| ADM-03 | `test_admin_panel_accessible_for_admin` | Admin | `GET /admin/` | HTTP 200 |

### Panel admin

| ID | Nom du test | Route | Résultat attendu |
|---|---|---|---|
| ADM-04 | `test_admin_panel_shows_club_info` | `GET /admin/panel` | HTTP 200, contient `"FC Test"` |
| ADM-05 | `test_admin_seed_page` | `GET /admin/seed` | HTTP 200 |

### Gestion des membres

| ID | Nom du test | Action | Résultat attendu |
|---|---|---|---|
| ADM-06 | `test_admin_add_member` | `POST /admin/add-member` — email + rôle coach | HTTP 302, utilisateur créé en DB |

### Gestion des équipes

| ID | Nom du test | Action | Résultat attendu |
|---|---|---|---|
| ADM-07 | `test_admin_add_team` | `POST /admin/teams/add` — nom + catégorie | HTTP 302, équipe créée en DB |

---

## 10. SVC-PLAYER — Service Joueur (unitaire)

**Fichier :** `tests/unit/test_service_player.py`

| ID | Nom du test | Ce qui est testé |
|---|---|---|
| SVC-P-01 | `test_create_player` | Insertion d'un joueur en DB avec `jersey_number` et `position` |
| SVC-P-02 | `test_get_by_id` | Récupération par ObjectId |
| SVC-P-03 | `test_get_by_club` | Liste des joueurs par club |
| SVC-P-04 | `test_get_by_club_with_team_filter` | Filtre par équipe |
| SVC-P-05 | `test_get_by_user` | Liaison joueur ↔ utilisateur |
| SVC-P-06 | `test_update_player` | Modification (`jersey_number` → 99) |
| SVC-P-07 | `test_delete_player` | Suppression + vérification `None` |

---

## 11. SVC-MATCH — Service Match (unitaire)

**Fichier :** `tests/unit/test_service_match.py`

| ID | Nom du test | Ce qui est testé |
|---|---|---|
| SVC-M-01 | `test_create_match` | Création avec `opponent`, `is_home`, statut initial `scheduled` |
| SVC-M-02 | `test_get_by_id` | Récupération par ID |
| SVC-M-03 | `test_get_upcoming` | Seuls les matchs futurs avec statut `scheduled` retournés |
| SVC-M-04 | `test_start_match` | Transition `scheduled` → `live` |
| SVC-M-05 | `test_finish_match` | Transition `live` → `completed` |
| SVC-M-06 | `test_set_score` | Mise à jour `score.home = 3`, `score.away = 1` |
| SVC-M-07 | `test_add_event` | Ajout d'un événement de match (but, carton) |

---

## 12. SVC-EVENT — Service Événement (unitaire)

**Fichier :** `tests/unit/test_service_event.py`

| ID | Nom du test | Ce qui est testé |
|---|---|---|
| SVC-E-01 | `test_create_event` | Création avec `title`, `type`, `date` |
| SVC-E-02 | `test_get_by_id` | Récupération par ID |
| SVC-E-03 | `test_get_upcoming` | Filtre : `Future` présent, `Past` absent |
| SVC-E-04 | `test_get_past` | Événements passés uniquement |
| SVC-E-05 | `test_get_by_type` | Filtre par type `training` |
| SVC-E-06 | `test_set_attendance` | Présence d'un joueur → `present` |
| SVC-E-07 | `test_set_bulk_attendance` | Présences multiples en un appel |

---

## 13. E2E — Tests navigateur (Playwright)

**Fichier :** `tests/e2e/test_login_flow.py`  
**Marqueur pytest :** `e2e` — **exclus par défaut**, lancer avec `-m e2e`

**Prérequis :**
```bash
pip install playwright
playwright install chromium
```

| ID | Nom du test | Scénario |
|---|---|---|
| E2E-01 | `test_homepage_has_title_and_login_link` | Ouvre `/`, vérifie le titre `"FootLogic"`, clique `Connexion`, URL contient `login` |
| E2E-02 | `test_login_page_shows_form` | Ouvre `/login`, vérifie que les champs `email` et `password` sont visibles |
| E2E-03 | `test_login_with_invalid_credentials` | Remplit mauvais email/mdp, soumet, vérifie message d'erreur `"Email ou mot de passe incorrect"` |

**Lancement :**
```bash
pytest -m e2e -v --headed        # avec navigateur visible
pytest -m e2e -v                 # headless
pytest -m e2e --browser firefox  # Firefox
```

---

## 14. Matrice de couverture

| Module / Fonctionnalité | Tests unitaires | Tests E2E | Couverture estimée |
|---|---|---|---|
| Login / Logout | ✅ AUTH-01 à 05 | ✅ E2E-01 à 03 | 🟢 Bonne |
| Inscription | ✅ REG-01 à 04 | — | 🟡 Partielle |
| Pages publiques | ✅ PUB-01 à 07 | — | 🟢 Bonne |
| Coach dashboard | ✅ COACH-01 à 09 | — | 🟡 Partielle |
| Gestion joueurs (coach) | ✅ COACH-05, 06 | — | 🟡 Partielle |
| Tactiques / Lineup | ✅ COACH-07 à 09 | — | 🟡 Partielle |
| Interface joueur | ✅ PLAY-01 à 06 | — | 🟡 Partielle |
| Interface admin | ✅ ADM-01 à 07 | — | 🟡 Partielle |
| Service PlayerService | ✅ SVC-P-01 à 07 | — | 🟢 Bonne |
| Service MatchService | ✅ SVC-M-01 à 07 | — | 🟢 Bonne |
| Service EventService | ✅ SVC-E-01 à 07 | — | 🟢 Bonne |
| Interface parent | ❌ Manquant | — | 🔴 Absent |
| Interface ISY | ❌ Manquant | — | 🔴 Absent |
| Interface superadmin | ❌ Manquant | — | 🔴 Absent |
| Boutique / Shop | ❌ Manquant | — | 🔴 Absent |
| API REST (endpoints) | ❌ Manquant | — | 🔴 Absent |
| Mot de passe oublié | ❌ Manquant | — | 🔴 Absent |
| Messagerie | ❌ Manquant | — | 🔴 Absent |

---

## 15. Ajouter un nouveau cas de test

### Test unitaire (route HTTP)

```python
# tests/unit/test_ma_fonctionnalite.py
def test_ma_route_loads(client_avec_role, fixture_donnees):
    """Description claire de l'intention du test."""
    response = client_avec_role.get('/ma-route')
    assert response.status_code == 200
    assert b"Texte attendu" in response.data
```

### Test de service

```python
def test_mon_service(app, seed_club):
    """create devrait insérer un document."""
    with app.app_context():
        from app.services import get_mon_service
        svc = get_mon_service()
        result = svc.create(str(seed_club['_id']), param='valeur')
        assert result['param'] == 'valeur'
```

### Test E2E (Playwright)

```python
# tests/e2e/test_mon_flux.py
import pytest
from playwright.sync_api import Page, expect

pytestmark = pytest.mark.e2e

def test_mon_flux(page: Page, live_server: str):
    """Description du flux utilisateur."""
    page.goto(live_server + '/ma-page')
    page.fill('input[name="champ"]', 'valeur')
    page.click('button[type="submit"]')
    expect(page.locator('.success-message')).to_be_visible()
```

### Convention de nommage

```
test_<sujet>_<action>_<condition>
  ↑          ↑        ↑
  entité     verbe    contexte (optionnel)

Exemples :
  test_login_with_valid_credentials
  test_player_edit_profile
  test_admin_add_team
  test_create_match_sets_scheduled_status
```

---

> **Note :** Les tests utilisent une base MongoDB dédiée au testing, isolée de la base de développement. Le nom de la base est configuré dans `app/config.py` sous la clé `TESTING`.
