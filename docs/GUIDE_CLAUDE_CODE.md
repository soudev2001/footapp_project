# Guide Claude Code dans Antigravity IDE
## Utilisation optimale avec consommation minimale

---

## 1. Les modes d'interaction disponibles

### 1.1 Le panneau de chat (mode principal)
Claude Code s'ouvre dans un panneau latéral ou en bas de l'IDE selon ta configuration :
```json
"claudeCode.preferredLocation": "panel"  // panneau latéral
"claudeCode.preferredLocation": "editor" // onglet éditeur
```
C'est le mode le plus riche : il donne accès à tous les outils (lecture de fichiers, exécution de commandes, recherche dans le code, etc.).

### 1.2 Sélection de code + interaction ciblée
Sélectionne du code dans l'éditeur **avant** d'envoyer un message → Claude reçoit uniquement ce fragment comme contexte. C'est l'un des moyens les plus efficaces de réduire la consommation de tokens.

**Astuce :** Sélectionne exactement la fonction ou le bloc concerné, pas le fichier entier.

### 1.3 Les commandes slash (/)
Tape `/` dans le chat pour accéder aux commandes intégrées :

| Commande | Description |
|----------|-------------|
| `/help` | Liste toutes les commandes disponibles |
| `/clear` | Vide l'historique de conversation (libère le contexte) |
| `/compact` | Résume la conversation pour libérer de la place dans la fenêtre de contexte |
| `/cost` | Affiche la consommation de tokens de la session |
| `/model` | Change le modèle utilisé |
| `/memory` | Affiche les fichiers mémoire persistants |
| `/fast` | Active le mode rapide (même modèle, sortie plus rapide) |
| `/review` | Revue de code sur les changements git |

### 1.4 Les raccourcis clavier
- **Ctrl+Shift+C** → Ouvrir Claude Code
- **Escape** → Interrompre une réponse en cours
- **Shift+Enter** → Saut de ligne sans envoyer
- **Flèche Haut** → Rappeler le message précédent

---

## 2. Fonctionnalités clés à maîtriser

### 2.1 Fichier CLAUDE.md — Instructions persistantes
Crée un fichier `CLAUDE.md` à la **racine du projet**. Claude le lit automatiquement à chaque session sans que tu aies besoin de répéter les instructions.

**Exemple pour ce projet :**
```markdown
# FootApp — Instructions Claude

## Stack technique
- Backend : Flask (Python 3.13)
- ORM : SQLAlchemy
- Frontend : Jinja2 + TailwindCSS
- Base de données : PostgreSQL
- Déploiement : Docker + Nginx + Traefik

## Conventions
- Langue des commentaires : français
- Tests : pytest dans /tests
- Ne jamais modifier les fichiers de migration sans validation
```

### 2.2 Mémoire automatique
Claude dispose d'un répertoire mémoire persistant :
```
C:\Users\Soufiane\.claude\projects\...\memory\
```
Il y sauvegarde les patterns importants détectés dans le projet entre les sessions. Tu peux lui demander explicitement : **"Mémorise que X pour les prochaines sessions"**.

### 2.3 Mode Plan (EnterPlanMode)
Pour les tâches complexes, Claude entre en mode Plan : il explore le code, conçoit une approche, te la soumet pour validation **avant** d'écrire une seule ligne. Cela évite les retours arrière coûteux.

**Quand l'utiliser :** Nouvelles fonctionnalités, refactoring multi-fichiers, décisions architecturales.

**Comment l'activer :** Préfixe ta demande avec des mots comme *"planifie"*, *"propose une approche pour"*, ou demande-lui d'entrer en mode plan.

### 2.4 Les agents spécialisés (sous-tâches)
Claude peut déléguer des recherches à des agents spécialisés en parallèle :
- **Explore** : exploration rapide du codebase
- **Bash** : exécution de commandes shell
- **Plan** : conception architecturale

Ces agents tournent en fond et protègent la fenêtre de contexte principale.

### 2.5 Les outils disponibles (Tool Use)
Claude a accès à ces outils dans l'IDE :
- **Read** — Lecture de fichiers
- **Edit / Write** — Modification et création de fichiers
- **Bash** — Exécution de commandes terminal
- **Grep / Glob** — Recherche dans le code
- **WebFetch / WebSearch** — Accès au web
- **TodoWrite** — Gestion de liste de tâches visible dans le chat

---

## 3. Réduire la consommation de tokens — Stratégies

### 3.1 Sois précis dans tes demandes
| Mauvais | Bon |
|---------|-----|
| "Regarde mon code et améliore-le" | "Dans `app/routes/coach.py`, optimise la fonction `get_players` pour éviter les requêtes N+1" |
| "Y a un bug quelque part" | "L'erreur `KeyError: 'team_id'` se produit dans `player_service.py:45` quand..." |

### 3.2 Utilise `/compact` régulièrement
Quand la conversation devient longue, `/compact` résume l'historique en gardant les informations essentielles. Cela libère de l'espace dans la fenêtre de contexte.

### 3.3 Démarre de nouvelles sessions pour de nouveaux sujets
Chaque session `/clear` repart de zéro. Si tu changes de sujet, vide le contexte plutôt que de traîner un historique non pertinent.

### 3.4 Sélectionne le bon modèle selon la tâche
Configurable avec `/model` ou dans les paramètres :
```json
"claudeCode.selectedModel": "opus"   // Plus capable, plus cher
"claudeCode.selectedModel": "sonnet" // Équilibre qualité/coût (recommandé)
"claudeCode.selectedModel": "haiku"  // Rapide, économique pour les tâches simples
```
**Règle pratique :**
- **Haiku** → Questions simples, recherches rapides, reformulations
- **Sonnet** → Développement quotidien (95% des cas)
- **Opus** → Architecture complexe, debugging difficile, décisions critiques

### 3.5 Évite de répéter le contexte
- Utilise `CLAUDE.md` pour les informations permanentes (stack, conventions)
- Utilise la mémoire automatique pour les patterns récurrents
- Référence les fichiers par chemin plutôt que de coller leur contenu

### 3.6 Travaille avec des fichiers cibles
Au lieu de demander à Claude d'explorer tout le projet, donne-lui le chemin exact :
```
✗ "Trouve où je gère les notifications"
✓ "Dans app/services/notification_service.py, la fonction send_notification..."
```

---

## 4. Workflows recommandés pour ce projet

### Développement d'une nouvelle fonctionnalité
```
1. /clear  (nouveau contexte propre)
2. Sélectionne les fichiers pertinents dans l'IDE
3. "Planifie l'ajout de [fonctionnalité] en suivant le pattern existant dans [fichier]"
4. Valide le plan
5. "Implémente le plan"
6. Lance les tests : pytest tests/
```

### Debug d'une erreur
```
1. Sélectionne le fichier/fonction concerné
2. Colle le traceback complet dans le message
3. "Explique cette erreur et propose un fix"
```

### Revue de code avant commit
```
1. /review  → analyse les changements git en cours
2. Demande des corrections ciblées si nécessaire
3. Commit uniquement quand c'est validé
```

---

## 5. Configuration optimale (paramètres IDE)

Voici les réglages clés déjà configurés dans ton IDE :

```json
// Réponses automatiques pour ne pas bloquer l'agent
"chat.tools.autoApprove": true,

// Limite de requêtes agent élevée
"chat.agent.maxRequests": 1000,

// Sauvegarde automatique pour que Claude voie les dernières modifications
"files.autoSave": "afterDelay"
```

**Paramètre recommandé à ajouter** — limite les tokens par réponse pour éviter les réponses interminables :
```json
"github.copilot.chat.maxTokens": 8000  // au lieu de 16000
```

---

## 6. Bonnes pratiques générales

- **Une tâche à la fois** : Claude est plus efficace sur des demandes ciblées que sur plusieurs choses en parallèle dans un seul message.
- **Valide les plans avant l'exécution** : évite de défaire et refaire.
- **Interromps si ça part dans le mauvais sens** : Escape → redirige avec plus de précision.
- **Consulte `/cost`** régulièrement pour suivre ta consommation.
- **Ne colle pas de gros fichiers** dans le chat : donne le chemin, Claude lit lui-même.
- **Utilise les TodoWrite** : pour les tâches longues, la liste de tâches te permet de suivre la progression et de reprendre si la session est interrompue.

---

## 7. Exemple de session type (optimisée)

```
Toi : /clear

Toi : [Sélection de app/routes/coach.py lignes 45-80]
      "Cette route /coach/tactics retourne une 500 quand team_id est None.
       Ajoute une validation et retourne un 404 propre."

Claude : [Lit uniquement le fragment sélectionné]
         [Propose l'edit ciblé]
         [Applique le fix]

Toi : "Lance les tests liés à cette route"

Claude : [Exécute pytest tests/test_coach.py -v]
         [Rapport des résultats]
```

**Résultat :** Tâche accomplie en ~3 échanges, consommation minimale.

---

*Dernière mise à jour : Février 2026*
