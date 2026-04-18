# Rapport d'exécution des Tests — FootApp

**Date d'exécution :** 18 avril 2026
**Environnement :** Python 3.13.3 — pytest 9.0.2 — Windows (MINGW64)
**Durée totale :** 181,97 secondes (3 min 01 sec)
**Commande :** `PYTHONPATH=. pytest --tb=short -q`

---

## Résultat Global

| Indicateur | Valeur |
|---|---|
| Tests collectés | 118 |
| Tests E2E exclus (marqueur `e2e`) | 3 |
| Tests exécutés | 115 |
| ✅ Réussis | **111** |
| ❌ Échoués | **3** |
| 💥 Erreurs de collecte | **1** |
| ⚠️ Avertissements | 393 |
| **Taux de réussite** | **96,5 %** |

---

## Résultats par Fichier

| Fichier | Résultat | Réussis | Échoués | Erreurs |
|---|---|---|---|---|
| `tests/test_email.py` | 💥 ERREUR | — | — | 1 |
| `tests/unit/test_admin.py` | ⚠️ PARTIEL | 6 | 1 | — |
| `tests/unit/test_auth.py` | ✅ OK | 13 | 0 | — |
| `tests/unit/test_coach.py` | ⚠️ PARTIEL | 9 | 1 | — |
| `tests/unit/test_player.py` | ✅ OK | 6 | 0 | — |
| `tests/unit/test_public.py` | ✅ OK | 7 | 0 | — |
| `tests/unit/test_service_club.py` | ✅ OK | 6 | 0 | — |
| `tests/unit/test_service_event.py` | ✅ OK | 9 | 0 | — |
| `tests/unit/test_service_match.py` | ✅ OK | 10 | 0 | — |
| `tests/unit/test_service_others.py` | ✅ OK | 17 | 0 | — |
| `tests/unit/test_service_player.py` | ⚠️ PARTIEL | 17 | 1 | — |
| `tests/unit/test_service_user.py` | ✅ OK | 10 | 0 | — |

---

## Détail des Échecs

### ❌ ÉCHEC 1 — `test_admin_panel_shows_club_info`

**Fichier :** `tests/unit/test_admin.py`
**Erreur :** `AssertionError: assert 404 == 200`

**Description :**
Le test envoie une requête `GET /admin/panel` et attend un code HTTP 200 avec le contenu `"FC Test"`. La route `/admin/panel` n'existe pas dans l'application — seule la route `/admin/` (tableau de bord principal) est enregistrée.

**Extrait du test ayant échoué :**
```python
def test_admin_panel_shows_club_info(admin_client):
    response = admin_client.get('/admin/panel')
    assert response.status_code == 200    # ← ÉCHEC, reçoit 404
    assert b"FC Test" in response.data
```

**Cause racine :** La route `/admin/panel` a été renommée ou fusionnée avec `/admin/` lors du développement, mais le test n'a pas été mis à jour.

**Correction recommandée :**
Mettre à jour le test pour utiliser la route existante `/admin/` :
```python
def test_admin_panel_shows_club_info(admin_client):
    response = admin_client.get('/admin/')
    assert response.status_code == 200
    assert b"FC Test" in response.data
```

---

### ❌ ÉCHEC 2 — `test_coach_save_lineup`

**Fichier :** `tests/unit/test_coach.py`
**Erreur :** `TypeError: id must be an instance of (bytes, str, ObjectId), not <class 'dict'>`

**Description :**
Le test envoie un payload JSON contenant les titulaires sous forme de liste de dictionnaires `[{"player_id": "...", "position": "MC"}]`. Le service traite ces entrées et tente de convertir directement chaque entrée en `ObjectId` au lieu d'en extraire le champ `player_id` d'abord.

**Extrait du payload envoyé :**
```python
coach_client.post('/coach/tactics/save',
    data=json.dumps({
        'team_id': str(seed_team['_id']),
        'formation': '4-3-3',
        'starters': [{'player_id': str(seed_player['_id']), 'position': 'MC'}],
        'substitutes': []
    }),
    content_type='application/json'
)
```

**Cause racine :** Dans le service (probablement `player_service.py` ou la route coach), la boucle sur les titulaires applique `ObjectId(starter)` sur le dictionnaire entier au lieu de `ObjectId(starter['player_id'])`.

**Correction recommandée :**
Dans le service ou la route qui traite le lineup, remplacer :
```python
# Incorrect
player_ids = [ObjectId(s) for s in data['starters']]

# Correct
player_ids = [ObjectId(s['player_id']) for s in data['starters']]
```

---

### ❌ ÉCHEC 3 — `test_save_and_get_lineup`

**Fichier :** `tests/unit/test_service_player.py`
**Erreur :** `bson.errors.InvalidId: 'player1' is not a valid ObjectId, it must be a 12-byte input or a 24-character hex string`

**Description :**
Le test utilise des identifiants de joueurs fictifs non valides (`'player1'`, `'player2'`) dans le dictionnaire des titulaires. Le service `save_lineup` tente de les convertir en `ObjectId` MongoDB, ce qui échoue car ces chaînes ne respectent pas le format ObjectId.

**Extrait du test ayant échoué :**
```python
svc.save_lineup(
    club_id=str(seed_club['_id']),
    formation='4-4-2',
    starters={'GK': 'player1', 'DEF1': 'player2'},   # ← IDs invalides
    team_id=str(seed_team['_id']),
    substitutes=['sub1', 'sub2']
)
```

**Cause racine :** Le test a été écrit avec des données fictives non conformes au format ObjectId attendu par MongoDB/PyMongo.

**Correction recommandée :**
Utiliser de vrais ObjectIds générés :
```python
from bson import ObjectId

svc.save_lineup(
    club_id=str(seed_club['_id']),
    formation='4-4-2',
    starters={'GK': str(ObjectId()), 'DEF1': str(ObjectId())},
    team_id=str(seed_team['_id']),
    substitutes=[str(ObjectId()), str(ObjectId())]
)
```
Ou mieux, utiliser la fixture `seed_player` pour avoir un vrai joueur en base.

---

## Détail de l'Erreur de Collecte

### 💥 ERREUR — `tests/test_email.py::test_email`

**Type d'erreur :** Erreur de collecte (`ERROR collecting`)
**Message :** Pytest détecte une fonction `test_email(to_email)` mais ne trouve aucune fixture nommée `to_email`.

**Description :**
Le fichier `tests/test_email.py` est un **script utilitaire standalone** permettant de tester l'envoi d'email via SMTP Gmail. Il n'est pas compatible avec pytest car :
1. La fonction `test_email` prend un argument positionnel (`to_email`) qui n'est pas une fixture pytest
2. Les variables d'environnement `MAIL_USERNAME` et `MAIL_PASSWORD` ne sont pas définies dans l'environnement de test

**Correction recommandée :**
Exclure ce fichier de la collecte pytest en le renommant (ex: `send_test_email.py`) ou en ajoutant le décorateur de saut :
```python
import pytest

@pytest.mark.skip(reason="Script utilitaire — requiert .env avec MAIL_USERNAME/MAIL_PASSWORD")
def test_email(to_email):
    ...
```
Ou le déplacer hors du dossier `tests/` vers `scripts/`.

---

## Avertissements (393 occurrences)

Tous les avertissements sont de même nature :

```
DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled
for removal in a future version. Use timezone-aware objects to represent
datetimes in UTC: datetime.datetime.now(datetime.UTC).
```

**Origine :** Python 3.12+ déprécie `datetime.utcnow()`. L'appel apparaît dans :
- `tests/unit/test_service_event.py` — lignes 26, 38, 39, 50, 59, 60, 69, 80, 91, 101
- `tests/unit/test_service_match.py` — lignes 18, 30, 39, 48, 58, 69, 80, 93, 104, 108, 122
- `app/services/event_service.py`, `match_service.py`, `contract_service.py`, `post_service.py`, `subscription_service.py`, `player_service.py`
- `app/models.py`

**Impact :** Aucun pour le moment — les tests passent. Ces appels seront éliminés dans Python 3.15.

**Correction globale recommandée :**
Remplacer dans tous les fichiers concernés :
```python
# Avant (déprécié)
from datetime import datetime
datetime.utcnow()

# Après (conforme Python 3.12+)
from datetime import datetime, timezone
datetime.now(timezone.utc)
```

---

## Synthèse des Actions Correctives

| Priorité | Problème | Fichier à modifier | Effort |
|---|---|---|---|
| 🔴 Haute | Route `/admin/panel` inexistante | `tests/unit/test_admin.py` | 1 ligne |
| 🔴 Haute | `ObjectId(dict)` au lieu de `ObjectId(dict['player_id'])` | Service coach (route `tactics/save`) | 3-5 lignes |
| 🔴 Haute | IDs joueurs fictifs non valides dans test lineup | `tests/unit/test_service_player.py` | 4 lignes |
| 🟡 Moyenne | `test_email.py` non compatible pytest | `tests/test_email.py` | Renommer/déplacer |
| 🟢 Basse | 393 `DeprecationWarning` `utcnow()` | Services + tests | Script de remplacement |

---

## Tests Réussis par Catégorie

### Authentification (13/13) ✅
- Login valide, invalide, page de connexion
- Vérification de session après login
- Déconnexion et nettoyage de session
- Inscription, email dupliqué, mots de passe différents
- Inscription d'un club

### Pages publiques (7/7) ✅
- Page d'accueil, classement, CGU, aide, page club public
- Redirection des utilisateurs connectés
- Gestion des 404

### Interface Coach (9/10) ✅
- Contrôle d'accès (non connecté, mauvais rôle)
- Dashboard, effectif, fiche joueur
- Page tactiques
- Ajout joueur (création utilisateur + document joueur en DB)
- Sauvegarde et chargement de preset tactique

### Interface Joueur (6/6) ✅
- Contrôle d'accès
- Home, profil, calendrier, contrats
- Modification du profil

### Interface Admin (6/7) ✅
- Contrôle d'accès (3 niveaux : non connecté, mauvais rôle, admin)
- Page seed, ajout membre, ajout équipe

### Service PlayerService (17/18) ✅
- CRUD complet (créer, lire, mettre à jour, supprimer)
- Filtres par club et équipe
- Liaison joueur ↔ utilisateur
- Changement de statut
- Mise à jour statistiques et notes techniques
- Ajout d'évaluation et historique physique
- Meilleurs buteurs triés
- Presets tactiques (save, get, liste, delete)

### Service MatchService (10/10) ✅
- Création avec statut initial `scheduled`
- Récupération par ID
- Matchs à venir, matchs terminés
- Cycle de vie : `scheduled` → `live` → `completed`
- Mise à jour du score
- Ajout d'événement (but, carton)
- Statistiques de saison
- Suppression

### Service EventService (9/9) ✅
- Création, lecture par ID
- Filtre passé/futur, filtre par type
- Gestion des présences (unitaire et en masse)
- Mise à jour, suppression

### Autres Services (17/17) ✅
- `ContractService` : création, récupération, acceptation/refus d'offre
- `PostService` : création, like/unlike, commentaire, recherche, catégorie
- `MessagingService` : envoi et historique de messages directs
- `SubscriptionService` : mise à jour abonnement, calcul mensuel

---

## Recommandations

1. **Corriger les 3 échecs avant la prochaine release** — corrections simples (< 30 min au total)
2. **Déplacer `test_email.py`** vers `scripts/` pour ne pas polluer la collecte pytest
3. **Fixer les `utcnow()`** via un script de remplacement global pour anticiper Python 3.15
4. **Ajouter `PYTHONPATH=.`** dans `pytest.ini` pour éviter la dépendance à la variable d'environnement :
   ```ini
   [pytest]
   testpaths = tests
   pythonpath = .
   addopts = --verbose -m "not e2e"
   ```
5. **Étendre la couverture** aux modules non testés : Parent, ISY, Superadmin, Boutique, API REST
