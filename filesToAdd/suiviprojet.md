Suivi de Progression - Système Global FootApp

Ce document détaille l'état d'avancement des modules du système, en corrélation avec le diagramme de classes "Admin SaaS".

1. Front-Office (Site Public)

État : ✅ Fonctionnel (Dynamique)
Le point d'entrée pour les clubs potentiels et les fans.

[x] Landing Page : Présentation du concept.

[x] CMS (Content Management System) : Les textes (Hero, Footer) sont configurables par le Dirigeant.

[x] Plans & Tarifs : Affichage des offres SaaS (Liaison classe Plan).

[x] Navbar & Footer : Structure personnalisable.

2. Module SaaS (Inscription & Validation)

État : ✅ Fonctionnel (Simulé)
Le flux d'acquisition client.

[x] Formulaire d'inscription : Création d'une RegistrationRequest.

[x] Workflow de validation :

Le club remplit le formulaire.

Statut = PENDING.

Le SuperAdmin valide la demande.

Création automatique du Club et de l'utilisateur Dirigeant.

3. Back-Office (Super Admin)

État : ✅ Fonctionnel
Interface de gestion globale de la plateforme.

[x] Gestion des Demandes : Liste des inscriptions en attente.

[x] Action de Validation : Transforme un prospect en client.

[ ] Gestion des Plans : CRUD sur les tarifs (Prévu V2).

[ ] Métriques Globales : KPI financiers et techniques (Prévu V2).

4. Back-Office (Dirigeant Club)

État : ⚠️ Partiel (Focus Admin & CMS)
Interface de gestion interne du club.

[x] Configuration CMS : Modification des textes de la Landing Page du club.

[x] Gestion Abonnement : Vue de l'état Subscription et date d'expiration.

[x] Gestion Utilisateurs : Vue simplifiée des membres.

[ ] Paiement : Intégration Stripe (Prévu V3).

5. Application Mobile (Coach/Joueur)

État : ✅ Intégré (MVP v1)
L'outil opérationnel pour le terrain.

[x] Vue Coach : Création d'événements.

[x] Vue Joueur : Réponses aux convocations.

[x] Messagerie : Chat d'équipe.