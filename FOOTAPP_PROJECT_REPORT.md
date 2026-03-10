# FootApp - Comprehensive Project Report

**Document Date**: March 2026
**Project Status**: Production-Ready with Growth Opportunities
**Version**: 1.0

---

## Executive Summary

**FootApp** is a comprehensive **football club management SaaS platform** serving multiple user roles (Admin, Coach, Player, Parent, Fan, SuperAdmin). The application provides an integrated ecosystem for managing clubs, teams, players, matches, events, and fan engagement.

### Key Facts

| Metric | Value |
|--------|-------|
| **Backend** | Flask 3.0.0 (Python) |
| **Database** | MongoDB (12 collections) |
| **Frontend** | Jinja2 + Tailwind CSS |
| **Code Base** | 3,426 LOC (routes), 21 services, 88+ templates |
| **Deployment** | Docker, Nginx, Gunicorn, AWS-ready |
| **User Roles** | 6 (SuperAdmin, Admin, Coach, Player, Parent, Fan) |
| **Status** | Live on production (takurte.fr, VPS Ubuntu 24.04) |

### Technology Stack

- **Framework**: Flask 3.0.0
- **Database**: MongoDB 4.0+ (with PyMongo 4.6.1)
- **Web Server**: Gunicorn 21.2.0
- **Reverse Proxy**: Nginx + Traefik (SSL/TLS)
- **Frontend**: Jinja2 templates, Tailwind CSS (CDN), Font Awesome 6.4.0
- **Testing**: Pytest 8.0+, Playwright 0.7+
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **PWA**: Service Worker, Web Manifest, Offline support
- **Email**: Flask-Mail 0.10.0 (Gmail SMTP)
- **Environment Management**: python-dotenv 1.0.0

### Current Deployment

- **Production Domain**: takurte.fr
- **Server**: Hostinger VPS (Ubuntu 24.04 LTS)
- **IP**: 82.112.255.193
- **SSL**: Let's Encrypt (Certbot)
- **Multi-Environment**: Development, Pre-production, Production

### Value Proposition

FootApp solves key challenges for football clubs:
- **Centralized Management**: All club operations in one platform
- **Role-Based Access**: Tailored experiences for coaches, players, parents, fans
- **Advanced Tactics**: Interactive tactical board with formation management
- **Player Development**: Comprehensive performance tracking and analytics
- **Community Engagement**: Messaging, events, posts, and social features
- **Mobile-First**: PWA with offline capabilities and installable app
- **Scalable SaaS**: Multi-tenant architecture supporting multiple clubs

---

## 1. Technical Architecture

### 1.1 Architecture Pattern

**Pattern**: MVC (Model-View-Controller) with Service Layer

```
┌─────────────────────────────────────────┐
│      Routes (Controllers)               │
│   12 Blueprints, 3,426 LOC              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Services (Business Logic)          │
│   21 Service Modules, ~100 KB            │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Models (Data Layer - MongoDB Schemas)  │
│   12 Collections, document-based        │
└─────────────────────────────────────────┘
```

**Benefits**:
- Clear separation of concerns
- Reusable business logic across routes
- Easy testing of services independently
- Flexible data access patterns

### 1.2 Route Structure (12 Blueprints)

| Blueprint | LOC | Purpose |
|-----------|-----|---------|
| `auth.py` | 334 | Authentication, login, registration, password reset |
| `admin.py` | 526 | Club admin panel, member management, teams |
| `coach.py` | 890 | Coach dashboard, tactics, match center, roster |
| `player.py` | 282 | Player dashboard, calendar, contracts, profile |
| `parent.py` | 132 | Parent portal, child linking, filtered views |
| `main.py` | 416 | Public pages, app home, feed, general routes |
| `messaging.py` | 221 | Direct messages, team channels, chat |
| `api.py` | 253 | REST API endpoints for integrations |
| `isy.py` | ~150 | Isy Club features (sponsors, payments) |
| `superadmin.py` | 92 | Platform management (basic) |
| `auth_extra.py` | ~100 | Additional auth features |
| **Total** | **~3,426** | **Complete application routes** |

### 1.3 Service Layer (21 Modules)

**Core Services**:
- `user_service.py` - User authentication, permissions, profiles
- `club_service.py` - Club management, configuration
- `team_service.py` - Team CRUD, team composition
- `player_service.py` - Player data, evaluations, physical records (10KB)
- `event_service.py` - Event creation, calendar, filtering
- `match_service.py` - Match management, scoring, live updates

**Feature Services**:
- `messaging_service.py` - DM, team channels, message history
- `notification_service.py` - Email, in-app notifications
- `post_service.py` - News feed, posts, comments
- `contract_service.py` - Contract offers, acceptance
- `parent_link_service.py` - Parent-child association
- `subscription_service.py` - Subscription plans, billing

**Advanced Services**:
- `email_service.py` - Email delivery (Flask-Mail)
- `shop_service.py` - E-commerce, products, orders
- `isy_service.py` - Isy Club integration
- `project_service.py` - Project/ticket management
- `seed_data.py` - Demo data generation
- `db.py` - MongoDB initialization

**Architecture Pattern**: Service Locator + Factory Pattern in `/app/services/__init__.py`

```python
# app/services/__init__.py
class ServiceLocator:
    _services = {}

    @classmethod
    def register(cls, name, service):
        cls._services[name] = service

    @classmethod
    def get(cls, name):
        return cls._services.get(name)
```

### 1.4 Database Architecture

**MongoDB Setup**:
- **Local Development**: Docker containerized MongoDB
- **Production**: Atlas/Cloud MongoDB (via MONGO_URI env var)
- **Connection**: Flask-PyMongo for ORM-like functionality
- **Authentication**: Username/password in connection string

**12 Collections**:

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `users` | User accounts across all roles | email, password_hash, role, club_id, profile |
| `clubs` | Football clubs | name, logo, city, founded_year, colors |
| `teams` | Teams within clubs | club_id, name, category, coach_ids, colors |
| `players` | Player profiles | user_id, club_id, team_id, position, stats |
| `events` | Trainings, matches, meetings | club_id, team_id, title, type, date, attendees |
| `matches` | Football matches | club_id, opponent, date, score, lineup, events |
| `messages` | Chat messages | sender_id, receiver_id, team_id, type, content |
| `posts` | News feed content | club_id, author_id, title, content, image, likes |
| `notifications` | User notifications | user_id, type, data, read_at |
| `contracts` | Player contracts | club_id, user_id, role, status, dates, salary |
| `subscriptions` | Club subscription plans | club_id, plan_id, status, billing |
| `projects` | Ticket management | name, description, tickets (for superadmin) |

**Indexing Strategy**:
- Primary keys: `_id` (ObjectId)
- Foreign keys: `club_id`, `user_id`, `team_id`, `player_id`
- Query optimization: Indexes on frequently filtered fields
- Data persistence: Docker volumes in production

### 1.5 Project Structure

```
footapp_project/
├── app/
│   ├── __init__.py              # Flask app factory, context processors
│   ├── config.py                # Development, Production, Test configs
│   ├── models.py                # MongoDB schemas and serializers
│   │
│   ├── routes/                  # 12 Blueprint files
│   │   ├── auth.py              # Authentication (334 LOC)
│   │   ├── admin.py             # Admin panel (526 LOC)
│   │   ├── coach.py             # Coach features (890 LOC)
│   │   ├── player.py            # Player features (282 LOC)
│   │   ├── parent.py            # Parent portal (132 LOC)
│   │   ├── main.py              # Public/app routes (416 LOC)
│   │   ├── messaging.py         # Messaging (221 LOC)
│   │   ├── api.py               # REST API (253 LOC)
│   │   ├── superadmin.py        # Platform admin (92 LOC)
│   │   ├── isy.py               # Isy Club features
│   │   └── auth_extra.py        # Additional auth
│   │
│   ├── services/                # 21 Business logic modules
│   │   ├── __init__.py          # Service factory/locator
│   │   ├── user_service.py      # User management
│   │   ├── club_service.py      # Club operations
│   │   ├── player_service.py    # Player operations
│   │   ├── event_service.py     # Event management
│   │   ├── match_service.py     # Match tracking
│   │   ├── messaging_service.py # Chat functionality
│   │   ├── notification_service.py
│   │   ├── subscription_service.py
│   │   ├── email_service.py     # Email delivery
│   │   ├── parent_link_service.py
│   │   └── ... (6 more services)
│   │
│   ├── templates/               # 88+ Jinja2 templates
│   │   ├── base.html            # Master layout
│   │   ├── auth/                # Login, register, reset password
│   │   ├── admin/               # Admin panel (5 templates)
│   │   ├── coach/               # Coach features (11 templates)
│   │   ├── player/              # Player features (8 templates)
│   │   ├── parent/              # Parent portal (3 templates)
│   │   ├── public/              # Landing page, public pages
│   │   ├── app/                 # Authenticated app pages
│   │   ├── components/          # Reusable components
│   │   ├── shop/                # E-commerce templates
│   │   ├── messaging/           # Chat interface
│   │   ├── match/               # Match views
│   │   ├── errors/              # 404, 403, 500 pages
│   │   └── isy/                 # Isy Club templates
│   │
│   └── static/                  # Static assets
│       ├── css/                 # Stylesheets
│       │   ├── style.css        # Main styles
│       │   ├── _variables.css   # Design tokens
│       │   ├── _components.css  # Reusable components
│       │   └── _mobile.css      # Mobile styles
│       ├── js/                  # JavaScript
│       ├── img/                 # Images, icons
│       ├── manifest.json        # PWA manifest
│       ├── sw.js                # Service Worker
│       ├── openapi.json         # API docs
│       └── icons/               # PWA icons
│
├── tests/
│   ├── unit/                    # Unit tests (services)
│   │   ├── test_admin.py
│   │   ├── test_auth.py
│   │   ├── test_coach.py
│   │   ├── test_player.py
│   │   ├── test_public.py
│   │   ├── test_service_club.py
│   │   └── test_service_event.py
│   │
│   └── e2e/                     # End-to-end tests
│       ├── conftest.py
│       └── test_login_flow.py
│
├── scripts/                     # Deployment scripts
│   ├── deploy.sh
│   ├── deploy_prod.sh
│   ├── deploy_prod.ps1
│   └── remote_exec.py
│
├── .github/workflows/           # CI/CD pipelines
│   ├── deploy-prod.yml
│   └── deploy-preprod.yml
│
├── nginx/                       # Nginx configuration
├── run.py                       # Application entry point
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Container definition
├── docker-compose.yml           # Development setup
├── docker-compose.prod.yml      # Production setup
├── docker-compose.preprod.yml   # Pre-production setup
├── pytest.ini                   # Test configuration
├── .env.example                 # Environment template
├── generate_openapi.py          # API docs generator
└── DEPLOYMENT.md                # Deployment guide
```

### 1.6 Configuration Management

**Three Environment Configurations**:

| Environment | DEBUG | Database | Use Case |
|-------------|-------|----------|----------|
| **Development** | True | FootClubApp (Docker) | Local dev |
| **Pre-Production** | False | FootClubApp_PreProd | Testing before prod |
| **Production** | False | FootClubApp_Prod | Live users |

**Configuration Files**:
- `.env` - Production variables (secret)
- `.env.dev` - Development variables
- `.env.prod` - Production backup
- `.env.preprod` - Pre-prod backup

**Configuration Sections** (`app/config.py`):
```python
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    MONGO_URI = os.getenv('MONGO_URI')
    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT'))
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
```

---

## 2. Role System Breakdown

### 2.1 Complete Role Hierarchy

```
┌─────────────────────────────────────────────┐
│          FOOTAPP ROLES HIERARCHY            │
├─────────────────────────────────────────────┤
│                                             │
│  1. SUPERADMIN (club_id = None)             │
│     └─ Platform-level management           │
│                                             │
│  2. ADMIN (club_id = ObjectId)              │
│     └─ Club-level management               │
│                                             │
│  3. COACH                                   │
│     └─ Team coaching & tactics             │
│                                             │
│  4. PLAYER                                  │
│     └─ Player profile & development        │
│                                             │
│  5. PARENT                                  │
│     └─ Child monitoring                    │
│                                             │
│  6. FAN                                     │
│     └─ Public engagement                   │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.2 SuperAdmin Role

**Status**: Minimal implementation (92 LOC)
**Identification**: `user.role == 'admin' AND user.club_id == None`

**Implemented Features**:
- ✅ Project management (JIRA-like ticket tracking)
- ✅ Platform dashboard (total stats)
- ✅ Superadmin oversight

**Key Files**:
- Routes: `/app/routes/superadmin.py` (92 LOC)
- Templates: `/app/templates/superadmin/` (3 templates)
- Services: `project_service.py`

**Missing**: Multi-tenancy controls, platform analytics, billing management

### 2.3 Admin Role

**Status**: Well-implemented (526 LOC)
**Access Level**: Full club management
**File**: `/app/routes/admin.py` (526 LOC)

**Implemented Features**:

**1. Member Management**
- Add members with role assignment
- Invite via email (with token)
- Edit member profiles
- Delete members
- Resend invitations
- Create player profiles automatically

**2. Team Management**
- Create/edit/delete teams
- Customize team colors (primary, secondary)
- Assign coaches to teams
- Category assignment (Senior, U15, U13, etc.)

**3. Club Configuration**
- Update club profile (name, city, founded year)
- Logo management
- Color scheme customization
- Description/branding
- Stadium information

**4. Subscription Management**
- Plan selection (Free, Starter, Pro, Enterprise)
- Billing overview
- MRR tracking
- Plan limits enforcement

**5. Data Management**
- Seed demo data for testing
- View club statistics

**Routes**:
```python
/admin/dashboard                     # Dashboard
/admin/add-member                    # Invite user
/admin/users/<user_id>/edit          # Edit user
/admin/users/<user_id>/delete        # Delete user
/admin/teams/add                     # Create team
/admin/teams/<team_id>/edit          # Edit team
/admin/teams/<team_id>/update-colors # Update colors
/admin/update-club                   # Club settings
/admin/update-subscription           # Subscription
/admin/seed                          # Demo data
/admin/architecture                  # System overview
```

**Templates** (5):
- `admin_panel.html` - Dashboard
- `clubs.html` - Club management
- `seed.html` - Demo data seeding
- `architecture.html` - System diagram
- `create_club.html` - New club wizard

**Services**:
- `user_service.py` - User CRUD, permissions
- `club_service.py` - Club operations
- `team_service.py` - Team management
- `subscription_service.py` - Plan management

### 2.4 Coach Role

**Status**: Extensively implemented (890 LOC)
**Access Level**: Team management and tactics
**File**: `/app/routes/coach.py` (890 LOC)

**Implemented Features**:

**1. Roster Management** (282 LOC player_service.py)
- Add/edit/delete players
- Jersey number assignment
- Position assignment (GK, CB, LB, RB, CM, CM, RM, LM, CF, ST, etc.)
- Physical data tracking:
  - Height, Weight, VMA (Vitesse Maximale Aérobie)
  - Birth date, status (active, injured, etc.)
- Technical ratings (0-10 scale):
  - VIT (Vitesse) - Speed
  - TIR (Tir) - Shooting
  - PAS (Passe) - Passing
  - DRI (Dribbling) - Dribbling
  - DEF (Defense) - Defending
  - PHY (Physical) - Physical capability
- Coach evaluations (custom notes)
- Player statistics (goals, assists, matches played, cards)

**2. Tactical Board** (4,863 lines in `coach/tactics.html`)
- **Interactive SVG-based football pitch**
- **7 Pre-defined formations**:
  - 4-3-3 (four defenders, three midfielders, three forwards)
  - 4-4-2 (classic)
  - 3-5-2 (three at back)
  - 4-2-3-1 (two defensive midfielders)
  - 3-4-3 (wing backs)
  - 5-3-2 (defensive)
  - 4-1-4-1 (one defensive mid)

- **Position Management**:
  - Drag-and-drop player placement
  - Position-based slot matching
  - GK, DEF, MID, ATT categories
  - Automatic suggestions based on player positions

- **Tactical Configuration**:
  - Passing style: courte (short), direct, long, mixte (mixed)
  - Space usage: couloir_gauche (left wing), couloir_droit (right wing), axe (central)
  - Defensive block: bas (low), median (mid), haut (high)
  - Pressing: bas, median, haut, tout_terrain (everywhere)
  - Marking system: individuel (man-to-man), zone
  - Counter-pressing: toggle on/off
  - Goalkeeper distribution: long balls vs. short passes

- **Set Pieces**:
  - Penalty order (ranked list of takers)
  - Corner assignments (left/right, inside/outside foot)
  - Free kick specialists (direct/indirect)

- **Captain Selection**:
  - First, second, third captain hierarchy
  - Visual highlighting on pitch

- **Preset System**:
  - Save current lineup as named preset
  - Load presets for quick selection
  - Preset library per team
  - Reuse across seasons

**3. Convocation System** (drag-drop interface)
- **Composition Interface**:
  - Pitch view with player positions
  - Player pool (available players)
  - Starters (11 players) vs. Substitutes (5-7 players)
  - Visual formation overlay

- **Features**:
  - Event selection (which match/training)
  - Load saved tactics presets
  - Auto-fill based on formation
  - Drag-and-drop player assignment
  - Captain designation
  - Send convocation (trigger notifications to players)
  - Convocation history

**4. Match Center**
- View upcoming matches
- View completed matches with stats
- **Live Match Tracking**:
  - Start/finish match
  - Update score (home/away)
  - Add match events:
    - Goals (player, time, type: penalty, free kick, own goal)
    - Assists (provider)
    - Cards (yellow, red, player, time)
    - Substitutions (off/on, time, reason)

- **Lineup Management**:
  - Set team lineup before match
  - Formation display
  - Formation adjustments during match

- **Match Statistics**:
  - Final score, shots, possession
  - Player performances
  - Team stats

**5. Attendance Management**
- View upcoming events (training, matches)
- Bulk attendance marking
- Filter by team
- Track which players attended
- Update status (attended, absent, excused, injured)

**6. Event Management**
- Create events (training, match, meeting, other)
- Edit event details (date, time, location, description)
- Delete events
- Auto-notify team members
- Calendar integration

**7. Scouting & Contracts**
- Search free agents (players without club_id)
- View player profiles
- Send contract offers
- Track sent contracts
- Coach notes on potential recruits

**Routes** (40+ routes):
```python
/coach/dashboard                 # Dashboard
/coach/roster                    # Player list
/coach/player/add               # Add player
/coach/player/<id>/edit         # Edit player
/coach/player/<id>/delete       # Delete player
/coach/player/<id>/update-ratings      # Ratings
/coach/player/<id>/add-evaluation      # Evaluation
/coach/player/<id>/add-physical        # Physical data
/coach/attendance               # Attendance tracking
/coach/tactics                  # Tactical board
/coach/tactics/save             # Save formation
/coach/tactics/save-config      # Save config
/coach/tactics/preset/save      # Save preset
/coach/tactics/preset/load      # Load preset
/coach/match-center             # Match management
/coach/match-center/start       # Start match
/coach/match-center/finish      # Finish match
/coach/match-center/update-score        # Update score
/coach/match-center/add-event   # Add event
/coach/convocation              # Convocation compose
/coach/convocation/send         # Send convocation
/coach/create-event             # Create event
/coach/event/<id>/edit          # Edit event
/coach/event/<id>/delete        # Delete event
/coach/scouting                 # Scout players
/coach/offer-contract           # Send contract
```

**Templates** (11+):
- `dashboard.html` - Overview, stats
- `roster.html` - Player list with filters
- `tactics.html` - Interactive tactical board (4,863 lines!)
- `convocation.html` - Match squad composition
- `match_center.html` - Live match tracking
- `attendance.html` - Attendance marking
- `player_detail.html` - Individual player view
- And more...

**Services**:
- `player_service.py` (10KB) - Player operations
- `match_service.py` - Match management
- `event_service.py` - Event creation
- `notification_service.py` - Player notifications

**Subscription Limits**:
- Free: 1 team, 20 players
- Starter: 3 teams, 50 players
- Pro: 10 teams, 200 players (advanced analytics)
- Enterprise: Unlimited, custom features

### 2.5 Player Role

**Status**: Basic implementation (282 LOC)
**Access Level**: Personal and team data
**File**: `/app/routes/player.py` (282 LOC)

**Implemented Features**:

**1. Home Dashboard**
- Upcoming events (trainings, matches)
- Recent posts/news
- Quick stats

**2. Evolution Hub**
- Player statistics overview
- Technical ratings display
- Physical data history
- Performance tracking

**3. Profile Management**
- View personal profile
- Edit profile information
- Avatar/photo management
- Contact details

**4. Calendar & Events**
- Team-specific event calendar
- View event details
- RSVP to events (confirm/decline attendance)
- Filter by team (for multi-team players)

**5. Team View**
- View teammates roster
- Team information
- Team statistics

**6. Contract Management**
- View contract offers
- Accept/reject contracts
- Contract details (salary, duration, role)
- Accepting contract:
  - Adds player to club
  - Creates/updates player profile
  - Updates session information
  - Player immediately gets access to club features

**7. Additional Sections**
- Documents access
- Settings (notifications, privacy)
- Notifications inbox
- Offers/opportunities

**Routes**:
```python
/player/home                    # Home dashboard
/player/profile                 # View profile
/player/profile/edit            # Edit profile
/player/evo-hub                 # Performance hub
/player/calendar                # Team calendar
/player/event/<id>              # Event details
/player/event/<id>/respond      # RSVP event
/player/team                    # Team roster
/player/contracts               # Contract offers
/player/contracts/<id>/respond  # Accept/reject
/player/documents               # Document library
/player/settings                # Settings
/player/notifications           # Notifications
```

**Templates** (8):
- `home.html` - Dashboard
- `profile.html` - Profile view/edit
- `evo_hub.html` - Performance tracking
- `calendar.html` - Event calendar
- `team.html` - Roster view
- `contracts.html` - Contract management
- `documents.html` - File access
- `settings.html` - Configuration

**Services**:
- `event_service.py` - Calendar events
- `contract_service.py` - Contract handling
- `user_service.py` - Profile management

**Limitations**:
- No detailed analytics
- Limited performance data
- No training plan access
- No injury tracking
- No personal goal setting

### 2.6 Parent Role

**Status**: Focused implementation (132 LOC)
**Access Level**: Child-linked data only
**File**: `/app/routes/parent.py` (132 LOC)

**Implemented Features**:

**1. Dashboard**
- Linked children overview
- Quick statistics per child
- Action buttons

**2. Child Linking System**
- **Code-based association** (secure, manual control)
- Admin generates 6-character code for player
- Parent enters code on dashboard
- Stores link with `status: 'pending'` then `'active'`
- Multiple children support
- Unlink option

**API for Code Generation** (called by Admin/Coach):
```python
POST /parent/api/generate_code/<player_id>
# Returns: 6-character alphanumeric code
```

**Database Collection** (`parent_links`):
```python
{
    '_id': ObjectId,
    'parent_id': ObjectId,
    'player_id': ObjectId,
    'association_code': str,
    'status': str,  # 'pending', 'active'
    'linked_at': datetime
}
```

**3. Filtered Calendar**
- Only shows events for linked children's teams
- Aggregates across multiple children
- Color-coded by child/team
- Full event details

**4. Restricted Roster View**
- Shows teammates of linked child
- **Sanitized data** (no sensitive info):
  - Names, positions, jersey numbers
  - NO ratings, stats, contract details
  - NO contact information
- Parent-child relationship verified before showing

**5. Notification Forwarding**
- System automatically forwards player notifications to linked parents
- Notification text prefixed with child name: `[Lucas Silva] Training at 19:00`
- Email notifications sent to parent email

**Routes**:
```python
/parent/dashboard                      # Dashboard
/parent/link                           # Link child (POST with code)
/parent/calendar                       # Filtered calendar
/parent/child/<player_id>/roster       # Child's teammates
/parent/api/generate_code/<player_id>  # Code generation (admin)
```

**Templates** (3):
- `dashboard.html` - Overview and child linking
- `calendar.html` - Filtered event calendar
- `roster_restricted.html` - Teammate roster (limited data)

**Services**:
- `parent_link_service.py` - Child association logic
- `event_service.py` - Calendar filtering
- `player_service.py` - Roster access
- `notification_service.py` - Notification forwarding

**Security Features**:
- Unique codes prevent unauthorized access
- Code expiry (if implemented)
- Parent-child link verification on all routes
- No sensitive data exposure

**Limitations**:
- No performance data visibility
- No coach feedback access
- No payment tracking
- Limited communication with coaches
- No community/parent directory

### 2.7 Fan Role

**Status**: Public pages + e-commerce (416 LOC)
**Access Level**: Public information only
**File**: `/app/routes/main.py` (416 LOC)

**Implemented Features**:

**1. Public Pages**
- **Landing Page** (`/`)
  - Club highlights
  - Quick facts
  - Call-to-action

- **Public Club Page** (`/club`)
  - Club information
  - Recent matches
  - Upcoming fixtures
  - Club posts/news

- **Rankings** (`/ranking`)
  - League standings (if available)
  - Team statistics comparison

- **Help Page** (`/help`)
  - FAQ
  - Support contact
  - User guides

- **Terms & Conditions** (`/terms`)
  - Legal agreements
  - Privacy policy

**2. App Home** (`/app-home` - for logged-in fans)
- Club statistics
- Recent posts
- Next scheduled match
- Upcoming events

**3. News Feed** (`/feed`)
- Club posts
- Match results
- Team announcements
- Player updates
- Like system (backend support)

**4. E-Commerce** (`/shop`)
- Product catalog (club merchandise)
- Categories (apparel, accessories, etc.)
- Product detail pages with images
- Shopping cart
- Checkout process (integrated with payment system)
- Order history

**Routes**:
```python
/                           # Landing page
/club                       # Public club info
/ranking                    # Rankings
/help                       # Help/FAQ
/terms                      # Terms
/app-home                   # App home (authenticated)
/feed                       # News feed
/shop                       # Shop/e-commerce
/shop/cart                  # Shopping cart
/shop/checkout              # Checkout
/shop/orders                # Order history
```

**Templates** (10+):
- `index.html` - Landing page
- `club.html` - Public club page
- `ranking.html` - Rankings
- `help.html` - Help
- `terms.html` - Terms
- `feed.html` - News feed
- `shop.html` - Product catalog
- `product_detail.html` - Product page
- `cart.html` - Shopping cart
- `checkout.html` - Checkout

**Services**:
- `post_service.py` - Feed content
- `shop_service.py` - E-commerce
- `club_service.py` - Public club info

**Limitations**:
- No community engagement (no comments, forum)
- Limited content (no highlights, videos)
- No fan rewards/loyalty
- No match statistics detail
- No live match tracking

---

## 3. Core Functionalities Inventory

### 3.1 Authentication & Authorization

**File**: `/app/routes/auth.py` (334 LOC)

**Features**:

**1. Registration Types**
- **Club Registration**: `/register-club`
  - Create club + admin account simultaneously
  - Admin automatically linked to club
  - Auto-login after creation
  - Redirect to admin dashboard

- **Invitation-Based**: `/register?token=<token>`
  - Admin creates pending user with invitation_token
  - Email sent with registration link
  - User sets password and completes profile
  - Status changes from `pending` to `active`
  - Token becomes invalid

- **Standard User**: `/register`
  - Public registration for fans
  - Default role: `fan`

**2. Login System**
- `/login` - Email + password
- Verify credentials via `user_service.verify_password()`
- Store in session: `user_id`, `user_role`, `user_email`, `user_profile`, `club_id`
- **Role-Based Redirect**:
  - Admin → `/admin/dashboard`
  - Coach → `/coach/dashboard`
  - Others → `/app-home`

**3. Authentication Decorators**

**`@login_required`**:
```python
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # Check for API Bearer token
            if not validate_api_token():
                return redirect('/login') or abort(401)
        return f(*args, **kwargs)
    return decorated_function
```

**`@role_required(*roles)`**:
```python
def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_role = session.get('user_role')
            if user_role == 'admin':
                return f(*args, **kwargs)  # Admin has all access
            if user_role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

**4. Password Management**
- **Hash Algorithm**: werkzeug.security.generate_password_hash()
- **Forgot Password**: `/forgot-password`
  - Generates reset token (1-hour expiry)
  - Email sent with reset link
- **Reset Password**: `/reset-password/<token>`
  - Token validation
  - New password setting
  - Token invalidation

**5. API Authentication**
- Bearer token support for API endpoints
- Mock JWT format (to be replaced with real JWT)
- Token validation in protected API routes

**6. Session Management**
- Session-based authentication (Flask sessions)
- Secure cookies (HTTPOnly, SameSite)
- 30-day session timeout (configurable)

### 3.2 Messaging System

**File**: `/app/routes/messaging.py` (221 LOC)

**Collections**: `messages` collection

**Features**:

**1. Direct Messages (DM)**
- Send messages between individual users
- Conversation threads
- Read status tracking
- Sender-receiver filtering

**2. Team Channels**
- Channel creation (per team)
- Role-based membership
- Broadcast messaging to team
- Channel history

**3. User Interface**
- Inbox view (recent conversations)
- Conversation view (message history)
- Unread count badges
- Search conversations (basic)

**4. Notifications**
- New message alerts
- Email notifications (optional)
- In-app notification badge

**Data Model** (`MESSAGE_SCHEMA`):
```python
{
    '_id': ObjectId,
    'sender_id': ObjectId,
    'receiver_id': ObjectId,    # None for team messages
    'team_id': ObjectId,         # For team channels
    'content': str,
    'type': str,                 # 'direct', 'team'
    'read_by': [ObjectId],       # List of users who read
    'created_at': datetime
}
```

**Routes**:
```python
/messaging/inbox                # Message inbox
/messaging/conversation/<user_id>  # DM conversation
/messaging/send                 # Send message (POST)
/messaging/channels             # Team channels
/messaging/channel/<id>         # Channel view
```

**Limitations**:
- No real-time updates (WebSocket)
- No rich text formatting
- No file attachment support
- No encryption
- Limited search capability

### 3.3 Notification System

**File**: `/app/services/notification_service.py`

**Channels**:
- **In-App**: Displayed in notification bell/icon
- **Email**: Via Flask-Mail (Gmail SMTP)
- **Push**: Prepared (FCM/APNs) but not implemented

**Notification Types**:
- Event invitations (trainings, matches)
- Convocation notifications (match squad)
- Contract offers
- Message notifications
- Post comments
- Match updates
- Payment reminders
- Invitation emails (new account setup)

**Features**:
- User preference system (basic)
- Email templates
- Automatic delivery
- Read/unread status
- Notification history

**Parent Notification Forwarding**:
- Automatically sends player notifications to linked parents
- Prefixes message with child name
- Respects parent notification preferences

### 3.4 Event Management

**File**: `/app/services/event_service.py`

**Collection**: `events` collection

**Features**:

**1. Event Types**
- Training (team training sessions)
- Match (official matches)
- Meeting (tactical meetings, discussions)
- Other (flexible events)

**2. Event Creation & Scheduling**
- Date, time, location, description
- Team assignment
- Duration specification
- Recurrence (if configured)

**3. Attendee Management**
- Player attendance tracking
- RSVP responses (confirm, decline)
- Absence tracking
- Attendance history

**4. Calendar Integration**
- JSON calendar endpoint (for calendar views)
- Date filtering
- Team filtering
- Past/upcoming separation

**5. Notifications**
- Automatic notification when event created
- Reminders (day before, 1 hour before)
- Update notifications (if event changed)

**Data Model** (`EVENT_SCHEMA`):
```python
{
    '_id': ObjectId,
    'club_id': ObjectId,
    'team_id': ObjectId,
    'title': str,
    'type': str,  # 'training', 'match', 'meeting', 'other'
    'date': datetime,
    'location': str,
    'description': str,
    'created_by': ObjectId,  # Coach ID
    'attendees': [{
        'player_id': ObjectId,
        'status': str,  # 'confirmed', 'declined', 'pending'
        'rsvp_date': datetime
    }],
    'created_at': datetime
}
```

**Routes**:
```python
/coach/create-event             # Create event
/coach/event/<id>/edit          # Edit event
/coach/event/<id>/delete        # Delete event
/player/calendar                # View calendar
/player/event/<id>              # Event details
/player/event/<id>/respond      # RSVP (confirm/decline)
/api/events                     # Calendar JSON endpoint
/api/clubs/<club_id>/events     # Club events JSON
```

### 3.5 Match Management

**File**: `/app/services/match_service.py`

**Collection**: `matches` collection

**Features**:

**1. Match Scheduling**
- Opponent name
- Date and time
- Location
- Home/away designation
- Match type (league, cup, friendly)

**2. Lineup Management**
- Set team lineup (11 players + substitutes)
- Formation assignment
- Player positions
- Captain designation

**3. Live Match Tracking**
- Match status (scheduled, live, completed)
- Score updates (home/away)
- Match events:
  - Goals (player, time, assist, type)
  - Cards (yellow, red, player, time)
  - Substitutions (off/on players, time)
  - Injuries, fouls, etc.

**4. Match Statistics**
- Final score
- Shots on target
- Possession percentage
- Passing accuracy
- Player performances
- Team statistics

**5. Match History**
- Previous match records
- Season statistics
- Head-to-head records (if available)

**Data Model** (`MATCH_SCHEMA`):
```python
{
    '_id': ObjectId,
    'club_id': ObjectId,
    'opponent': str,
    'date': datetime,
    'location': str,
    'is_home': bool,
    'score': {
        'home': int,
        'away': int
    },
    'status': str,  # 'scheduled', 'live', 'completed'
    'lineup': [{
        'player_id': ObjectId,
        'position': str,
        'number': int
    }],
    'events': [{
        'type': str,  # 'goal', 'card', 'substitution'
        'time': int,  # minutes
        'player_id': ObjectId,
        'details': {...}
    }],
    'created_at': datetime
}
```

**Routes**:
```python
/coach/match-center             # Match management
/coach/match-center/start       # Start match
/coach/match-center/finish      # Finish match
/coach/match-center/update-score    # Update score
/coach/match-center/add-event   # Add match event
/api/matches                    # All matches JSON
/api/clubs/<club_id>/matches    # Club matches JSON
```

### 3.6 Subscription Management

**File**: `/app/services/subscription_service.py`

**Collection**: `subscriptions` collection

**4 Subscription Plans**:

| Plan | Cost | Teams | Players | Storage | Features |
|------|------|-------|---------|---------|----------|
| **Free** | $0 | 1 | 20 | 2 GB | Basic features |
| **Starter** | $29/mo | 3 | 50 | 10 GB | Advanced features |
| **Pro** | $99/mo | 10 | 200 | 50 GB | Analytics, priority support |
| **Enterprise** | Custom | Unlimited | Unlimited | Custom | Custom features |

**Features**:
- Plan selection and upgrade
- Billing management
- MRR/ARR calculation
- Usage tracking (teams, players, storage)
- Plan enforcement (block features if limit exceeded)

**Data Model** (`SUBSCRIPTION_SCHEMA`):
```python
{
    '_id': ObjectId,
    'club_id': ObjectId,
    'plan_id': str,  # 'free', 'starter', 'pro', 'enterprise'
    'status': str,   # 'active', 'past_due', 'canceled'
    'billing': {
        'currency': str,  # 'EUR'
        'amount': float,
        'interval': str   # 'monthly', 'annual'
    },
    'created_at': datetime,
    'expires_at': datetime
}
```

**Limitations**:
- No payment processing (Stripe integration missing)
- Manual billing tracking
- No invoicing
- No cancellation workflow
- No dunning/retry logic

### 3.7 PWA Features

**File**: `/app/static/` + `/app/static/sw.js`

**Features**:

**1. Service Worker** (`sw.js`)
- **Installation**: Caches critical assets
- **Activation**: Cleans old caches
- **Fetch Event Handling**:
  - Cache-first strategy: Static assets (fonts, images)
  - Network-first strategy: API calls (always try network first)
  - Stale-while-revalidate: HTML pages (serve cached while fetching new)

**2. Web App Manifest** (`manifest.json`)
- App name: "FootLogic"
- App icons (multiple sizes for different devices)
- Theme colors (dark mode by default)
- Display mode: standalone (fullscreen app)
- App shortcuts:
  - Dashboard
  - Calendar
  - Roster
- Orientation: portrait
- Language: French (fr-FR)

**3. Offline Support**
- Fallback offline page
- Cached critical routes
- Service worker intercepts network failures

**4. Installability**
- Add to home screen prompt
- iOS/Android support
- PWA badge in browser

**5. Push Notifications** (Prepared)
- Service worker ready for push events
- Browser notification API support
- Not fully implemented yet

**Configuration**:
- Cache strategies optimized for app performance
- Cache versioning for automatic updates
- Stale content serving (within reason)

---

## 4. Design System Analysis

### 4.1 Design Framework

**Primary Framework**: Tailwind CSS (CDN-based)
**Custom CSS**: In `/app/static/css/` (4 files)
**Component System**: Custom CSS classes (no external UI library)
**Icon Library**: Font Awesome 6.4.0
**Responsive**: Mobile-first design

### 4.2 Color System

**Default Colors** (Dark Mode First):

**Background Palette**:
- Primary: `#0a0f1a` (very dark blue)
- Secondary: `#111827` (dark gray-blue)
- Tertiary: `#1f2937` (medium dark)
- Surface: `#374151` (slightly lighter)

**Text Palette**:
- Primary: `#f9fafb` (almost white)
- Secondary: `rgba(255,255,255,0.65)` (60% opacity white)
- Tertiary: `rgba(255,255,255,0.4)` (40% opacity white)
- Muted: `rgba(255,255,255,0.2)` (20% opacity)

**Brand Colors**:
- Primary: `#10b981` (Emerald green)
- Secondary: `#f59e0b` (Amber yellow)
- Accent: `#06b6d4` (Cyan)

**Semantic Colors**:
- Success: `#22c55e` (Light green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Info: `#3b82f6` (Blue)

**Light Mode Colors** (Alternative):
- Background: `#f8fafc`, `#ffffff`
- Text: `#0f172a`, `#475569`, `#94a3b8`
- Borders: `#e2e8f0`, `#cbd5e1`

### 4.3 Typography

**Font Families**:
- **Sans-serif (Body)**: Inter (Google Fonts)
  - Weights: 300, 400, 500, 600, 700, 800, 900
  - Used for: Body text, UI labels, general content

- **Display (Headlines)**: Outfit (Google Fonts)
  - Weights: 400, 500, 600, 700, 800
  - Used for: Page titles, headings, emphasis

**Font Sizes**:
- `xs`: 0.75rem (12px)
- `sm`: 0.875rem (14px)
- `base`: 1rem (16px)
- `lg`: 1.125rem (18px)
- `xl`: 1.25rem (20px)
- `2xl`: 1.5rem (24px)
- `3xl`: 1.875rem (30px)
- `4xl`: 2.25rem (36px)

**Line Heights**:
- Tight: 1.25
- Normal: 1.5
- Relaxed: 1.75

### 4.4 Spacing & Layout

**Spacing Scale** (Tailwind default):
- `px`: 1px
- `0.5`: 2px
- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `5`: 20px
- `6`: 24px
- `8`: 32px
- `10`: 40px
- `12`: 48px

**Border Radius**:
- `sm`: 0.375rem (6px)
- `md`: 0.5rem (8px)
- `lg`: 0.75rem (12px)
- `xl`: 1rem (16px)
- `2xl`: 1.25rem (20px)
- `3xl`: 1.5rem (24px)
- `full`: 9999px (perfect circles)

**Shadows**:
- `sm`: `0 1px 3px rgba(0,0,0,0.3)`
- `md`: `0 4px 12px rgba(0,0,0,0.25)`
- `lg`: `0 12px 24px -4px rgba(0,0,0,0.35)`
- `glow`: `0 0 24px rgba(16,185,129,0.25)`

### 4.5 Component Library

**Custom CSS Components** (in `_components.css`):

**Buttons**:
- `.btn` - Base button
- `.btn-primary` - Primary action (emerald)
- `.btn-secondary` - Secondary action
- `.btn-ghost` - Ghost/outline button
- `.btn-danger` - Destructive action (red)
- `.btn-sm`, `.btn-lg` - Size variants
- `.btn-icon` - Icon-only buttons
- Features: Gradients, hover effects, active states, focus rings

**Cards**:
- `.card` - Standard card container
- `.card-glass` - Glassmorphism effect (blurred background)
- `.card-header`, `.card-body`, `.card-footer` - Sections
- `.stat-card` - Statistics display card
- Features: Subtle borders, dark backgrounds, shadow effects

**Badges**:
- `.badge` - Base badge
- `.badge-primary`, `.badge-success`, `.badge-error`, `.badge-warning`, `.badge-info`
- `.badge-outline` - Outlined variant
- Features: Rounded pill shape, semantic colors

**Avatars**:
- `.avatar` - Circular user avatar
- `.avatar-sm`, `.avatar-md`, `.avatar-lg`, `.avatar-xl` - Sizes
- `.avatar-group` - Multiple avatars together
- Features: Borders, initials fallback, image support

**Forms**:
- `.input` - Text input
- `.select` - Dropdown select
- `.textarea` - Multi-line text
- `.checkbox`, `.radio` - Form controls
- `.label` - Form label
- Features: Dark styling, focus states, validation states

**Navigation**:
- `.navbar` - Top navigation bar
- `.nav-link` - Navigation link
- `.sidebar` - Side navigation
- `.breadcrumbs` - Breadcrumb navigation
- Features: Active states, hover effects, responsive

### 4.6 Layout Patterns

**Base Layout** (`base.html`):
```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Stylesheets, meta tags -->
  </head>
  <body>
    <!-- Navigation (desktop) -->
    {% include 'components/_navbar.html' %}

    <!-- Mobile Header -->
    {% include 'components/_mobile_header.html' %}

    <!-- Main Content -->
    <main>
      {% if current_user.is_authenticated %}
        {% include 'components/_sidebar.html' %}
        {{ content area }}
      {% else %}
        {{ content area }}
      {% endif %}
    </main>

    <!-- Footer -->
    {% include 'components/_footer.html' %}

    <!-- Mobile Bottom Navigation -->
    {% if current_user.is_authenticated %}
      {% include 'components/_bottom_nav.html' %}
    {% endif %}

    <!-- Scripts -->
  </body>
</html>
```

**Responsive Breakpoints**:
- **Mobile**: 0-767px (portrait phones)
- **Tablet**: 768px-1023px (tablets, landscape phones)
- **Desktop**: 1024px+ (desktops, large screens)

**Navigation Patterns**:
- **Desktop (>768px)**: Horizontal navbar + sidebar
- **Mobile (<768px)**: Hamburger menu + bottom navigation (5 items max)

**Desktop Navbar** (fixed top):
- Logo with hover effects
- Horizontal menu items
- Right-side icons: theme toggle, notifications, user profile
- Max-width container (centered)
- Glass effect background (blur + transparency)

**Mobile Bottom Navigation** (fixed bottom):
- Safe area inset support (for notched phones)
- 5 action items maximum
- Center action button (prominent)
- Active state indicators
- Touch-friendly sizing (48-56px)

**Sidebar** (desktop):
- 280px fixed width
- Slide-in animation (off-canvas on mobile)
- User profile card at top
- Categorized navigation
- Hover effects on items

### 4.7 Dark Mode Implementation

**Method**: Class-based dark mode (`.dark` class on `<html>`)

**Toggle**:
- Theme toggle button (sun/moon icon)
- Preference stored in `localStorage`
- Persists across sessions
- Respects system preference (as fallback)

**CSS Variables** (in `_variables.css`):
```css
:root {
  --bg-primary: #0a0f1a;
  --bg-secondary: #111827;
  --text-primary: #f9fafb;
  --text-secondary: rgba(255,255,255,0.65);
  --color-primary-rgb: 16, 185, 129;
}

.light {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --text-primary: #0f172a;
}
```

### 4.8 Animations & Transitions

**Global Timing**:
- Fast: 150ms (quick responses)
- Normal: 250ms (standard interactions)
- Slow: 350ms (emphasis effects)

**Common Animations**:
- **Float**: 6s infinite (subtle bobbing motion)
- **Slide-up**: 0.5s ease-out (entrance animation)
- **Fade-in**: 0.4s ease-in (opacity change)
- **Scale**: 0.2s ease-out (button press feedback)
- **Pulse**: 2s infinite (loading/attention)

**Transitions**:
- All color transitions: `transition: color 250ms`
- Background changes: `transition: background 250ms`
- Transform animations: `transition: transform 150ms cubic-bezier(...)`

### 4.9 Glassmorphism Design

**Effect**: Frosted glass appearance with background blur

**Implementation**:
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
}
```

**Use Cases**:
- Navigation bars
- Modal overlays
- Card containers
- Alert messages
- Tooltip backgrounds

**Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

### 4.10 Accessibility Features

**Color Contrast**:
- All text meets WCAG AA standards (4.5:1 minimum)
- Tested with Lighthouse accessibility audit

**Focus States**:
- All interactive elements have visible focus rings
- Focus color: Emerald with 2px solid border
- Works with keyboard navigation (Tab key)

**Semantic HTML**:
- Proper heading hierarchy (h1 > h2 > h3...)
- Form labels associated with inputs
- Alt text on images
- ARIA labels on icon-only buttons

**Reduced Motion**:
- Respects `prefers-reduced-motion` media query
- Disables animations for users who prefer it
- Essential interactions still work

**Screen Reader Support**:
- Semantic landmarks (header, nav, main, footer)
- Skip-to-content links
- ARIA descriptions on complex components
- Form validation messages are accessible

---

## 5. Tactics & Strategy Features

### 5.1 Tactical Board (4,863 lines!)

**File**: `/app/templates/coach/tactics.html`

**Technology**: SVG-based interactive pitch, JavaScript for drag-and-drop

**Visual Design**:
- Realistic football field with markings
- Center circle, penalty areas, goal areas
- Corner arcs, sidelines, goal lines
- Grid overlay (optional, for positioning)
- Responsive: scales to container width
- Dark background with field lines

**Formation System**:

**7 Pre-defined Formations**:
1. **4-3-3** (4 def, 3 mid, 3 fwd)
   - Most balanced, modern formation
   - Defensive stability with attacking width

2. **4-4-2** (4 def, 4 mid, 2 fwd)
   - Classic, proven formation
   - Solid defensively

3. **3-5-2** (3 def, 5 mid, 2 fwd)
   - Attacking-minded, wing back focused
   - Control in midfield

4. **4-2-3-1** (4 def, 2 def-mid, 3 mid, 1 fwd)
   - Defensive solidity in midfield
   - Flexibility

5. **3-4-3** (3 def, 4 mid, 3 fwd)
   - Attacking, wing back support
   - Less defensive structure

6. **5-3-2** (5 def, 3 mid, 2 fwd)
   - Ultra-defensive
   - Counter-attacking focus

7. **4-1-4-1** (4 def, 1 def-mid, 4 mid, 1 fwd)
   - Midfield control
   - Defensive balance

**Position Categories**:
- **GK** (Goalkeeper): 1
- **DEF** (Defenders): 3-5 depending on formation
- **MID** (Midfielders): 3-5 depending on formation
- **ATT** (Attackers): 1-3 depending on formation

**Player Assignment**:
- Drag-and-drop interface
- Players can be placed in position slots
- Automatic position suggestions based on player attributes
- Repositioning allowed mid-match

**Features**:
- **Real-time player count**: Shows how many positions filled vs. needed
- **Player pool**: List of available players (filtered by position)
- **Substitutes bench**: Displays unused players
- **Team composition display**: Visual confirmation of formation
- **Color coding**: Different colors for each position type

### 5.2 Tactical Configuration

**Comprehensive Settings** (stored per formation save):

**1. Possession & Passing**
- **Passing Style**:
  - Courte (Short) - Build from back, many passes
  - Direct - Long balls, quick transitions
  - Long - Direct to attackers, risk/reward
  - Mixte (Mixed) - Flexible approach

**2. Space Utilization**
- **Zone Focus**:
  - Couloir Gauche (Left Wing) - Focus attacks on left side
  - Couloir Droit (Right Wing) - Focus attacks on right side
  - Axe (Central) - Through the middle attacks

**3. Defensive Shape**
- **Defensive Block Height**:
  - Bas (Low) - Deep defense, compact shape (5-10m from goal)
  - Median (Mid) - Balanced position (15-20m from goal)
  - Haut (High) - Aggressive pressing (25-30m from goal)

**4. Pressing Intensity**
- **Pressing Strategy**:
  - Bas (Low) - Defensive pressing only
  - Median - Zone pressing in midfield
  - Haut (High) - Aggressive press everywhere
  - Tout Terrain (Everywhere) - All-over pressing, high intensity

**5. Marking System**
- **Marking Type**:
  - Individuel (Man-to-man) - Each defender marks a player
  - Zone - Defend areas, not specific players
  - Mixed - Combination (some man, some zone)

**6. Counter-Pressing**
- Toggle: On/Off
- Effect: Immediate pressing after losing the ball
- Requires high fitness, risk of being caught out

**7. Goalkeeper Distribution**
- **GK Style**:
  - Long Balls - Direct distribution, fewer touches
  - Short Passes - Build from back, many passes to defense/fullbacks
  - Mixed - Flexible, context-based

### 5.3 Set Piece Management

**Specialized Teams for Dead Balls**:

**Penalty Takers** (Ranked List):
- First choice
- Second choice
- Third choice
- Each with specific player assignment
- Success rate tracking (if available)

**Corner Takers**:
- Left side corners (assigned player)
- Right side corners (assigned player)
- Inside foot or outside foot preference
- Short corner option assigned player

**Free Kick Specialists**:
- Direct free kick takers (long range)
- Indirect free kick specialists (through balls, crosses)
- Goal kick distribution (goalkeeper)

**Data Persistence**:
- Set piece assignments saved per formation
- Reused across similar formations
- Customizable per match/season

### 5.4 Captain Selection

**Hierarchy**:
1. **First Captain** (Primary - wears armband)
   - Full leadership responsibility
   - Represents team on field
   - Makes tactical decisions during match
   - Communicates with referee

2. **Second Captain** (Deputy)
   - Takes over if first injured/sent off
   - Advises first captain
   - Leadership role

3. **Third Captain** (Alternate)
   - Backup option
   - May lead if both injured

**Visual Representation** on Tactics Board:
- Captain highlighted with special badge (C, VC, etc.)
- Color-coded or icon-marked
- Easily identifiable

**Function**:
- Appears on match lineup
- Included in convocation
- Used for communication flows
- Affects team morale (gamification aspect)

### 5.5 Convocation System

**File**: `/app/templates/coach/convocation.html`

**Purpose**: Compose match squad and send to players

**Interface Design**:

**Two-Column Layout**:
- **Left**: Pitch view with formation overlay
- **Right**: Player pool (available players grouped by position)

**Player Selection**:
- **Starters** (11 players): Primary lineup
- **Substitutes** (5-7 players): Bench players
- Real-time count: "11/11 starters", "6/7 subs"

**Drag-and-Drop Mechanics**:
- Drag player from pool to pitch position
- Auto-placement based on position match
- Drag to substitute bench for backup players
- Reorder substitutes by drag-and-drop
- Manual repositioning allowed

**Features**:

**1. Preset Loading**
- Load saved tactics/formations instantly
- One-click auto-fill starters based on preset
- Still allows manual adjustment
- Quick setup for frequent formations

**2. Event Selection**
- Dropdown to select which match/event
- Team filtering (for multi-team coaches)
- Date and opponent info displayed

**3. Visual Feedback**
- Glow effect on valid positions
- Red highlight if invalid assignment
- Player color-coded by position
- Avatar images for recognition

**4. Convocation Actions**
- Preview (see formatted convocation)
- Send (triggers notifications to all players)
- Save (save as template for future use)
- Cancel/back out

**5. Notifications**
- Automatic email to all selected players
- In-app notification
- Push notification (if enabled)
- Convocation details included:
  - Match details (opponent, date, time, location)
  - Team lineup
  - Specific instructions
  - Reporting time/location

### 5.6 Match Center Integration

**Tactical Features in Match Center**:

**1. Pre-Match**
- Display lineup in formation
- Show captain assignments
- Show set piece assignments
- Allow last-minute adjustments

**2. During Match**
- Formation stays visible
- Mark players on field vs. bench
- Update positions for substitutions
- Track formation changes (if tactical adjustment)

**3. Tactical Adjustments**
- Change formation mid-match
- Reassign players
- Adjust set piece takers
- Record tactical decisions in match notes

**4. Match Events with Tactical Context**
- Goal - by which player, from which position
- Assist - which position combination
- Substitution - who came off, who came on, reason
- Card - which player, which position, when

---

## 6. Current Gaps & Missing Features

### 6.1 Critical Gaps

**1. Real-Time Features** (WebSocket)
- **Problem**: No live updates for match scores, messages, notifications
- **Impact**: High - Users must refresh to see updates
- **Solution Required**: Flask-SocketIO, Redis, event broadcasting
- **Affected Features**: Match center, messaging, notifications, convocation responses

**2. File Upload System**
- **Problem**: No image/document storage capability
- **Impact**: High - Can't upload logos, avatars, photos, videos
- **Current Workaround**: External image URLs only
- **Solution Required**: AWS S3, Cloudinary, or MinIO
- **Affected Features**: Club logos, player photos, team photos, match analysis videos

**3. Analytics Dashboards**
- **Problem**: Limited metrics, no trend analysis, no reporting
- **Impact**: High - Admins and coaches can't see meaningful insights
- **Solution Required**: Analytics service, data aggregation, charting library
- **Affected Features**: Club growth, team performance, player development

**4. Training Plan Management**
- **Problem**: No structured training programs
- **Impact**: High - Coaches can't plan training sessions systematically
- **Solution Required**: Training service, drill library, session planning
- **Affected Features**: Coach workflow, player development, season planning

**5. Injury Tracking System**
- **Problem**: No medical history or recovery tracking
- **Impact**: High - Can't manage player fitness or prevent re-injuries
- **Solution Required**: Injury service, medical records, recovery tracking
- **Affected Features**: Roster management, lineup decisions, player care

### 6.2 Moderate Gaps

**1. Video Analysis Module**
- **Problem**: No video upload or annotation capability
- **Impact**: Medium-High - Important for coaching analysis
- **Solution Required**: Video storage, player, annotation tools, clip creation
- **Affected Features**: Coach training analysis, player education, tactical review

**2. Payment Processing (Stripe)**
- **Problem**: No actual payment collection for subscriptions
- **Impact**: Medium - SaaS model can't generate revenue
- **Solution Required**: Stripe integration, invoicing, subscription management
- **Affected Features**: Financial sustainability, subscription enforcement

**3. Advanced Match Statistics**
- **Problem**: Limited match data capture and analysis
- **Impact**: Medium - Can't provide deep performance insights
- **Solution Required**: Extended match statistics, player performance metrics
- **Affected Features**: Player evaluation, team analysis, fan engagement

**4. Advanced Search Functionality**
- **Problem**: No global search across entities
- **Impact**: Medium - Users must navigate to specific sections
- **Solution Required**: Text indexing, search service
- **Affected Features**: Player search, team search, match search

**5. Player Performance Analytics**
- **Problem**: No detailed player statistics, trends, or comparisons
- **Impact**: Medium - Can't objectively track player development
- **Solution Required**: Analytics service, statistics aggregation, visualizations
- **Affected Features**: Coach evaluation, player motivation, contract decisions

### 6.3 Minor Gaps

**1. Internationalization (i18n)**
- **Problem**: French-only interface
- **Impact**: Low - Limits to French-speaking user base
- **Solution Required**: Flask-Babel, translation files
- **Affected Features**: Global expansion, multi-language support

**2. Export Features**
- **Problem**: Can't export data to CSV, PDF, Excel
- **Impact**: Low - Users want offline access, reports, integrations
- **Solution Required**: Export service, PDF generation
- **Affected Features**: Reporting, data portability

**3. Advanced Permissions**
- **Problem**: Only role-based permissions, no granular controls
- **Impact**: Low - Some clubs need flexible permission schemes
- **Solution Required**: Permission matrix system, custom roles
- **Affected Features**: Large club structures, custom hierarchies

**4. Mobile Native Apps**
- **Problem**: Only PWA, no native iOS/Android apps
- **Impact**: Low - PWA works well but native apps expected by some
- **Solution Required**: React Native or Flutter, app store distribution
- **Affected Features**: Offline capability (already in PWA), app store presence

**5. Social Media Integration**
- **Problem**: Can't share to social platforms, limited social features
- **Impact**: Low - Limits viral growth, fan engagement
- **Solution Required**: Social API integration, sharing buttons
- **Affected Features**: Fan engagement, social proof, growth

---

## 7. Deployment Infrastructure

### 7.1 Containerization & Docker

**Dockerfile**:
- Base image: Python 3.11
- Workdir: `/app`
- Dependencies: Installed from `requirements.txt`
- Command: `gunicorn wsgi:app` (production)
- Exposed port: 5000

**Docker Compose** (Development):
```yaml
services:
  web:
    build: .
    ports: ["5000:5000"]
    volumes: [".:/app"]  # Hot reload
    environment: [DEBUG=true]
    depends_on: [db]

  db:
    image: mongo:latest
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]
```

**Docker Compose** (Production):
```yaml
services:
  web:
    build: .
    environment: [DEBUG=false]
    restart: always
    depends_on: [db]

  db:
    image: mongo:latest
    volumes: ["mongo_prod_data:/data/db"]  # Persistent
    restart: always

  nginx:
    image: nginx:latest
    volumes: ["./nginx/nginx.conf:/etc/nginx/nginx.conf"]
    ports: ["80:80", "443:443"]
    depends_on: [web]
```

### 7.2 Environment Strategy

| Environment | Purpose | Branch | Domain | Database |
|-------------|---------|--------|--------|----------|
| **Development** | Local development | feature/* | localhost:5000 | FootClubApp (Docker) |
| **Pre-Production** | Test before prod | pre-prod | preprod.footlogic.com | FootClubApp_PreProd |
| **Production** | Live users | main | takurte.fr | FootClubApp_Prod (Atlas) |

**Environment Files**:
- `.env` (Production) - Secret variables
- `.env.dev` (Development) - Local settings
- `.env.prod` (Backup) - Production reference
- `.env.preprod` (Backup) - Pre-prod reference

### 7.3 Nginx Configuration

**Reverse Proxy**:
- Listen on ports 80 (HTTP) and 443 (HTTPS)
- Proxy requests to Gunicorn (localhost:5000)
- Serve static files directly (performance)
- Redirect HTTP to HTTPS
- Add security headers (HSTS, X-Frame-Options, CSP)
- Gzip compression for text responses

**SSL Configuration**:
- Certbot for Let's Encrypt automatic renewal
- Certificate stored in `/etc/letsencrypt/`
- Auto-renewal via cron job

### 7.4 Gunicorn Configuration

**Worker Management**:
- Number of workers: 4 (configurable)
- Worker class: sync (stable, for this application)
- Timeout: 60 seconds
- Graceful reload: Yes

**Binding**:
- Address: `0.0.0.0:5000` (internal only, behind Nginx)
- Workers listen on same port

**Logging**:
- Access logs to stdout
- Error logs to stderr
- Log level: warning (normal operations)

### 7.5 VPS Configuration

**Server**:
- **Provider**: Hostinger
- **OS**: Ubuntu 24.04 LTS
- **IP**: 82.112.255.193
- **RAM**: [configured]
- **Disk**: [configured]
- **Network**: Public IP + SSH access

**Domain Setup**:
- **Primary Domain**: takurte.fr
- **DNS Records**:
  - A record pointing to VPS IP
  - SSL certificate for takurte.fr
  - Wildcard certificates (if needed)

**SSH Access**:
- SSH key-based authentication (no password)
- Automated deployment via GitHub Actions

### 7.6 CI/CD Pipeline

**GitHub Actions Workflows**:

**Deploy to Pre-Production** (`.github/workflows/deploy-preprod.yml`):
- **Trigger**: Push to `pre-prod` branch
- **Steps**:
  1. Checkout code
  2. SSH into VPS (82.112.255.193)
  3. Pull latest code from GitHub
  4. Build Docker image
  5. Run docker-compose (pre-prod config)
  6. Run database migrations (if needed)
  7. Send Slack notification

**Deploy to Production** (`.github/workflows/deploy-prod.yml`):
- **Trigger**: Push to `main` branch
- **Steps**:
  1. Checkout code
  2. SSH into VPS
  3. Pull latest code
  4. Build Docker image
  5. Run docker-compose (prod config)
  6. Database migrations
  7. Health check
  8. Send notification

**Rollback Capability**:
- Tag releases (git tags)
- Keep previous image in registry
- Manual rollback via SSH if needed

### 7.7 Database Management

**MongoDB Setup**:
- **Local**: Docker container with ephemeral storage (development)
- **Production**: AWS Atlas or MongoDB Cloud (secure, backed up)
- **Connection**: MONGO_URI environment variable

**Backup Strategy**:
- **Manual Dumps**: `mongodump` command (occasional)
- **Cloud Backup**: Atlas automatic daily backups (production)
- **Backup Location**: S3 or cloud storage (if needed)
- **No automated backup system** currently

**Data Persistence**:
- Docker volumes for local MongoDB (named volume)
- Atlas replication (cloud production)

---

## 8. Testing Infrastructure

### 8.1 Test Framework

**Technology**: Pytest with Playwright for E2E

**Configuration** (`pytest.ini`):
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    e2e: End-to-end tests
    unit: Unit tests
    slow: Slow tests (skip normally)
```

### 8.2 Unit Tests

**Location**: `tests/unit/`

**Files**:
- `test_admin.py` - Admin routes
- `test_auth.py` - Authentication flows
- `test_coach.py` - Coach features
- `test_player.py` - Player features
- `test_public.py` - Public pages
- `test_service_club.py` - Club service
- `test_service_event.py` - Event service

**Pattern**: Service layer testing primarily

**Example**:
```python
def test_user_creation(user_service):
    user = user_service.create_user('test@example.com', 'password', 'admin')
    assert user['email'] == 'test@example.com'
    assert user['role'] == 'admin'
```

### 8.3 End-to-End Tests

**Location**: `tests/e2e/`

**Files**:
- `test_login_flow.py` - Login, navigation, basic flows
- Playwright browser automation

**Example**:
```python
@pytest.mark.e2e
def test_admin_login_and_dashboard(page):
    page.goto('http://localhost:5000/login')
    page.fill('input[name=email]', 'admin@example.com')
    page.fill('input[name=password]', 'password')
    page.click('button[type=submit]')
    assert page.url == 'http://localhost:5000/admin/dashboard'
```

### 8.4 Test Coverage Gaps

**Missing Test Coverage**:
- Route-level tests (most routes untested)
- Authentication decorator tests (role-based access)
- Permission/authorization tests
- Integration tests (multi-service interactions)
- Performance tests
- Load tests
- API endpoint tests

**Current Test Count**: ~50-100 tests (rough estimate)

**Coverage**: ~20-30% of codebase (estimated)

**No CI/CD Test Automation**: Tests don't run on pull requests

---

## 9. API Documentation

### 9.1 REST API Endpoints

**File**: `/app/routes/api.py` (253 LOC)

**Base URL**: `https://takurte.fr/api/`

**Implemented Endpoints**:

**Players**:
- `GET /api/players` - Get all players
- `GET /api/players/<player_id>` - Get single player

**Clubs**:
- `GET /api/clubs` - Get all clubs
- `GET /api/clubs/<club_id>` - Get single club
- `GET /api/clubs/<club_id>/players` - Get club players

**Events**:
- `GET /api/events` - Get all events
- `GET /api/clubs/<club_id>/events` - Get club events (JSON calendar)

**Matches**:
- `GET /api/matches` - Get all matches
- `GET /api/clubs/<club_id>/matches` - Get club matches

**Posts**:
- `GET /api/posts` - Get all posts

**Utility**:
- `GET /api/health` - Health check
- `POST /api/seed` - Seed database (development only)
- `GET /api/stats` - Database statistics
- `POST /api/auth/login` - API login (returns mock JWT)

**Push Notifications**:
- `POST /api/notifications/token` - Register FCM token

**Notifications**:
- `GET /api/events/convocations` - Get convocations

**RSVP**:
- `POST /api/events/<event_id>/rsvp` - RSVP to event

**API Documentation**:
- `GET /api/docs` - Swagger UI
- Auto-generated OpenAPI spec

### 9.2 Authentication Methods

**Session-Based** (Web browsers):
- Uses Flask sessions
- Cookies with user_id, user_role
- Secure HTTPOnly cookies

**API Bearer Token** (Mobile, third-party):
- `Authorization: Bearer <token>`
- Token format (current): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{user_id}.{role}`
- Validation in `@login_required` decorator

### 9.3 OpenAPI Specification

**Files**:
- `/app/static/openapi.json` (JSON format)
- `/app/static/openapi.yaml` (YAML format)

**Status**: Exists but incomplete

**Coverage**: Basic endpoints documented

**Missing**:
- Complete endpoint documentation
- Request/response schema definitions
- Error code documentation
- Authentication documentation
- Rate limiting documentation

### 9.4 API Limitations

**Current Issues**:
1. No RESTful design consistency
2. No API versioning (v1, v2)
3. No rate limiting
4. No API keys (only token-based)
5. No webhook support
6. No pagination implemented
7. Limited error messages
8. No CORS configuration (if needed)

**Planned**:
- Comprehensive API v1 design
- Complete OpenAPI specification
- Rate limiting middleware
- API key management
- Webhook system for events
- Comprehensive error handling

---

## 10. Security Analysis

### 10.1 Implemented Security Measures

**Authentication**:
- ✅ Password hashing (werkzeug.security.generate_password_hash)
- ✅ Salted hashes (automatic with werkzeug)
- ✅ Session management (Flask sessions)
- ✅ Secure cookies (HTTPOnly, SameSite)
- ✅ Login decorators (@login_required)

**Authorization**:
- ✅ Role-based access control (RBAC)
- ✅ Role decorators (@role_required)
- ✅ Admin implicit access to all features
- ✅ Club-level data isolation (via club_id)
- ✅ Parent-child verification

**Data Security**:
- ✅ MongoDB as document database (safer than SQL injection)
- ✅ No direct SQL queries
- ✅ Input validation via Jinja2 (auto-escaping)

**Infrastructure**:
- ✅ HTTPS/SSL (Let's Encrypt)
- ✅ VPS deployment (not shared hosting)
- ✅ Environment variable separation (no hardcoded secrets)
- ✅ Docker containerization (isolation)

### 10.2 Security Gaps

**Authentication & Authorization**:
- ❌ No two-factor authentication (2FA)
- ❌ No session timeout enforcement
- ❌ No IP-based rate limiting
- ❌ No brute-force protection on login
- ❌ No password complexity requirements
- ❌ No account lockout after failed attempts

**API Security**:
- ❌ No rate limiting on API endpoints
- ❌ No API key rotation
- ❌ No request signing (for webhooks)
- ❌ No CORS configuration (security risk)
- ❌ No request size limits

**Data Security**:
- ❌ No input sanitization library (relies on auto-escaping)
- ❌ No encryption at rest (MongoDB data on disk)
- ❌ No encryption in transit (except HTTPS)
- ❌ No field-level encryption
- ❌ No audit logging of sensitive operations

**Infrastructure**:
- ❌ No Web Application Firewall (WAF)
- ❌ No DDoS protection
- ❌ No backup encryption
- ❌ No disaster recovery plan
- ❌ No security headers (CSP, X-Frame-Options, etc.)

**Code Security**:
- ❌ No SAST (Static Application Security Testing)
- ❌ No dependency scanning (for vulnerable packages)
- ❌ No regular security audits
- ❌ No OWASP top 10 validation
- ❌ No security training documentation

---

## 11. Performance Characteristics

### 11.1 Optimizations Implemented

**Frontend**:
- ✅ Service Worker caching
- ✅ Tailwind CSS (utility-first, minimal CSS)
- ✅ Font Awesome 6.4.0 (icon fonts, faster than images)
- ✅ Lazy loading (if implemented in templates)

**Backend**:
- ✅ MongoDB indexing (on ObjectId, foreign keys)
- ✅ Gunicorn multi-worker setup (4 workers)
- ✅ Nginx reverse proxy (static file serving)
- ✅ Gzip compression (Nginx level)

**Database**:
- ✅ Indexed primary keys
- ✅ Document-based (no complex joins)
- ✅ Connection pooling (PyMongo)

### 11.2 Performance Issues

**Frontend**:
- ❌ No minification of CSS/JavaScript
- ❌ No image optimization (no responsive images)
- ❌ No CDN for static assets
- ❌ No bundle splitting
- ❌ No preloading/prefetching

**Backend**:
- ❌ No query optimization/analysis
- ❌ No pagination on list endpoints
- ❌ No caching layer (Redis)
- ❌ No database query profiling
- ❌ No async task processing (Celery)

**Database**:
- ❌ No query performance monitoring
- ❌ No slow query logging
- ❌ No index optimization analysis
- ❌ No connection pooling configuration

**Monitoring**:
- ❌ No APM (Application Performance Monitoring)
- ❌ No error tracking (Sentry)
- ❌ No performance benchmarking
- ❌ No load testing infrastructure

---

## 12. Summary & Recommendations

### Current State

**Strengths**:
- ✅ Comprehensive feature set (6 roles, 3,426 LOC routes)
- ✅ Clean architecture (MVC + Service Layer)
- ✅ Well-structured codebase (organized by responsibility)
- ✅ Production-ready deployment (Docker, CI/CD, HTTPS)
- ✅ Modern tech stack (Flask, MongoDB, Tailwind)
- ✅ Advanced features (Tactics board, convocation, PWA)
- ✅ Multi-role system with granular access control
- ✅ Mobile-first responsive design

**Weaknesses**:
- ❌ Limited analytics and reporting
- ❌ No real-time features
- ❌ No file upload system
- ❌ No video analysis
- ❌ Incomplete payment processing
- ❌ Limited testing coverage
- ❌ Missing advanced features (training plans, injury tracking)
- ❌ Security gaps (no 2FA, no rate limiting, no WAF)

### Future Direction

**Short Term** (3-6 months):
1. Implement file upload system (AWS S3)
2. Add real-time features (WebSocket)
3. Build analytics dashboards
4. Implement training plan management
5. Add injury tracking

**Medium Term** (6-12 months):
1. Complete payment integration (Stripe)
2. Add video analysis module
3. Implement player performance analytics
4. Build parent features (communication, payment tracking)
5. Expand fan engagement

**Long Term** (12+ months):
1. AI-powered insights
2. Wearable integration
3. Live streaming
4. Mobile native apps
5. Advanced multi-tenancy controls

---

## 13. Conclusion

**FootApp** is a well-architected, production-ready football club management platform with comprehensive features for coaches, players, parents, and fans. The application demonstrates solid engineering practices (MVC architecture, service layer, clean separation of concerns) and includes advanced features like tactical boards, convocation systems, and PWA support.

While there are opportunities for enhancement (real-time features, analytics, video analysis), the platform provides significant value to football clubs and can serve as a foundation for continued growth and feature expansion.

The identified gaps are addressable through focused development efforts following the prioritization framework provided in this report. With strategic implementation of critical features, FootApp can become a market-leading club management solution.

---

**Document Version**: 1.0
**Last Updated**: March 2026
**Next Review**: When major features are implemented
