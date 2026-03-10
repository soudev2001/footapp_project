# Technical Implementation Guide

**Version**: 1.0
**Audience**: Backend developers, architects
**Purpose**: Code patterns, architecture decisions, technical specifications

---

## 1. Architecture Patterns

### 1.1 Service Layer Pattern

**Current Implementation**:
```python
# app/services/__init__.py
class ServiceLocator:
    _services = {}

    @classmethod
    def register(cls, name, service_class):
        cls._services[name] = service_class()

    @classmethod
    def get(cls, name):
        return cls._services[name]

# Usage in routes
from app.services import ServiceLocator

user_service = ServiceLocator.get('user_service')
user = user_service.get_user(user_id)
```

**Pattern Benefits**:
- Dependency injection (testable)
- Service reusability across routes
- Centralized initialization
- Easy mocking for tests

### 1.2 Blueprint Organization

**Current Structure**:
```
app/routes/
├── __init__.py (blueprint registration)
├── auth.py
├── admin.py
├── coach.py
├── player.py
├── parent.py
├── main.py
└── api.py
```

**Pattern**:
```python
# Each file defines a blueprint
from flask import Blueprint

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/dashboard')
@login_required
@role_required('admin')
def dashboard():
    return render_template('admin/panel.html')

# Registered in app/__init__.py
app.register_blueprint(admin_bp)
```

### 1.3 Decorator Pattern for Authorization

**Current Decorators**:
```python
# app/routes/auth.py

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_role = session.get('user_role')
            if user_role == 'admin':  # Admin bypass
                return f(*args, **kwargs)
            if user_role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Usage
@route('/dashboard')
@login_required
@role_required('coach', 'admin')
def dashboard():
    pass
```

---

## 2. Database Schema Design

### 2.1 Base Document Structure

**MongoDB Collections**:
```python
# All documents include:
{
    '_id': ObjectId,         # MongoDB auto-generated
    'created_at': datetime,  # Creation timestamp
    'updated_at': datetime,  # Last update
    'is_deleted': bool,      # Soft delete flag (optional)
}
```

### 2.2 Schema Organization in models.py

**Current Pattern**:
```python
# app/models.py

USER_SCHEMA = {
    'email': str,
    'password_hash': str,
    'role': str,
    'club_id': ObjectId,
    'profile': {
        'first_name': str,
        'last_name': str,
        'avatar': str,
        'phone': str,
    },
    'account_status': str,  # 'pending', 'active'
    'created_at': datetime
}

PLAYER_SCHEMA = {
    'user_id': ObjectId,
    'club_id': ObjectId,
    'team_id': ObjectId,
    'position': str,
    'jersey_number': int,
    'stats': {
        'goals': int,
        'assists': int,
        'matches_played': int,
        'cards': {'yellow': int, 'red': int},
    },
    'created_at': datetime
}
```

### 2.3 Relationship Patterns

**Foreign Key Pattern** (MongoDB):
```python
# Instead of SQL joins, store references and populate manually

MATCH_SCHEMA = {
    'opponent': str,  # Name (not reference)
    'lineup': [
        {
            'player_id': ObjectId,  # Reference to player
            'position': str,
            'number': int
        }
    ],
    'events': [
        {
            'type': str,
            'player_id': ObjectId,  # Reference
            'timestamp': int,
        }
    ]
}

# To get player details in route:
from bson import ObjectId
match = db.matches.find_one({'_id': ObjectId(match_id)})
player_ids = [item['player_id'] for item in match['lineup']]
players = list(db.players.find({'_id': {'$in': player_ids}}))
```

### 2.4 New Schemas for P0 Features

**Training Plan Schemas**:
```python
TRAINING_PLAN_SCHEMA = {
    '_id': ObjectId,
    'club_id': ObjectId,
    'team_id': ObjectId,
    'coach_id': ObjectId,
    'name': str,  # e.g., "Pre-season 2026"
    'type': str,  # 'weekly', 'monthly', 'seasonal'
    'start_date': datetime,
    'end_date': datetime,
    'sessions': [ObjectId],  # References to TRAINING_SESSION
    'focus_area': str,  # 'technical', 'tactical', 'physical'
    'created_at': datetime,
    'updated_at': datetime
}

TRAINING_SESSION_SCHEMA = {
    '_id': ObjectId,
    'plan_id': ObjectId,
    'team_id': ObjectId,
    'coach_id': ObjectId,
    'date': datetime,
    'duration': int,  # minutes
    'location': str,
    'focus': str,  # 'technical', 'tactical', 'physical', 'mixed'
    'drills': [
        {
            'drill_id': ObjectId,
            'order': int,
            'duration': int,
            'notes': str,
            'players': [ObjectId]  # Specific groups
        }
    ],
    'attendance': [
        {
            'player_id': ObjectId,
            'status': str,  # 'present', 'absent', 'late'
            'reason': str,
            'rating': int  # 1-10
        }
    ],
    'coach_notes': str,
    'video_link': str,
    'training_load': str,  # 'low', 'medium', 'high'
    'created_at': datetime
}

DRILL_SCHEMA = {
    '_id': ObjectId,
    'club_id': ObjectId,  # None if public library
    'name': str,
    'description': str,
    'category': str,  # 'passing', 'shooting', 'defending'
    'sub_category': str,  # 'technical', 'tactical', 'physical'
    'duration': int,  # minutes
    'players_needed': int,
    'equipment': [str],  # ['ball', 'cone', 'vest']
    'diagram_image': str,  # URL
    'video_link': str,
    'difficulty': str,  # 'beginner', 'intermediate', 'advanced'
    'coaching_points': [str],
    'is_public': bool,
    'created_at': datetime
}
```

**Injury Schema**:
```python
INJURY_SCHEMA = {
    '_id': ObjectId,
    'player_id': ObjectId,
    'team_id': ObjectId,
    'coach_id': ObjectId,
    'injury_type': str,  # 'muscle', 'ligament', 'bone', 'concussion'
    'body_part': str,  # 'ankle', 'knee', 'hamstring'
    'severity': str,  # 'minor', 'moderate', 'severe'
    'description': str,
    'injury_date': datetime,
    'expected_return': datetime,
    'actual_return': datetime,
    'status': str,  # 'active', 'recovering', 'resolved'
    'medical_clearance': bool,
    'cleared_by': str,  # Doctor name
    'cleared_date': datetime,
    'recovery_notes': [
        {
            'date': datetime,
            'update': str,
            'updated_by': ObjectId
        }
    ],
    'logged_by': ObjectId,
    'created_at': datetime
}
```

**Financial Schemas**:
```python
PAYMENT_SCHEMA = {
    '_id': ObjectId,
    'club_id': ObjectId,
    'stripe_customer_id': str,
    'stripe_subscription_id': str,
    'amount': float,  # cents
    'currency': str,  # 'eur'
    'payment_method': str,  # 'card', 'bank'
    'status': str,  # 'pending', 'succeeded', 'failed'
    'description': str,
    'created_at': datetime,
    'paid_at': datetime
}

INVOICE_SCHEMA = {
    '_id': ObjectId,
    'club_id': ObjectId,
    'stripe_invoice_id': str,
    'invoice_number': str,  # 'INV-2026-001'
    'amount': float,
    'currency': str,
    'due_date': datetime,
    'paid_at': datetime,
    'status': str,  # 'draft', 'open', 'paid', 'void'
    'pdf_url': str,
    'created_at': datetime
}
```

---

## 3. Service Layer Implementation

### 3.1 Service Base Pattern

```python
# app/services/base_service.py

from pymongo import MongoClient
from app.services import ServiceLocator

class BaseService:
    def __init__(self, db):
        self.db = db

    def create(self, collection_name, document):
        """Create document with timestamps"""
        from datetime import datetime
        document['created_at'] = datetime.utcnow()
        document['updated_at'] = datetime.utcnow()
        result = self.db[collection_name].insert_one(document)
        return result.inserted_id

    def update(self, collection_name, doc_id, update_data):
        """Update document with timestamp"""
        from datetime import datetime
        from bson import ObjectId
        update_data['updated_at'] = datetime.utcnow()
        self.db[collection_name].update_one(
            {'_id': ObjectId(doc_id)},
            {'$set': update_data}
        )

    def get_by_id(self, collection_name, doc_id):
        """Get document by ID"""
        from bson import ObjectId
        return self.db[collection_name].find_one({'_id': ObjectId(doc_id)})

    def delete(self, collection_name, doc_id):
        """Soft delete (mark as deleted)"""
        self.update(collection_name, doc_id, {'is_deleted': True})
```

### 3.2 Training Service Example

```python
# app/services/training_service.py

from app.services.base_service import BaseService
from bson import ObjectId

class TrainingService(BaseService):
    def create_training_plan(self, club_id, team_id, coach_id, plan_data):
        """Create new training plan"""
        plan = {
            'club_id': ObjectId(club_id),
            'team_id': ObjectId(team_id),
            'coach_id': ObjectId(coach_id),
            'name': plan_data['name'],
            'type': plan_data['type'],  # 'weekly', 'monthly'
            'start_date': plan_data['start_date'],
            'end_date': plan_data['end_date'],
            'sessions': [],
            'focus_area': plan_data.get('focus_area', 'mixed'),
        }
        return self.create('training_plans', plan)

    def add_session(self, plan_id, session_data):
        """Add training session to plan"""
        session = {
            'plan_id': ObjectId(plan_id),
            'team_id': ObjectId(session_data['team_id']),
            'coach_id': ObjectId(session_data['coach_id']),
            'date': session_data['date'],
            'duration': session_data['duration'],
            'location': session_data.get('location', 'TBD'),
            'focus': session_data.get('focus', 'mixed'),
            'drills': [],
            'attendance': [],
            'coach_notes': '',
            'training_load': 'medium',
        }
        session_id = self.create('training_sessions', session)

        # Add to plan's sessions list
        self.db['training_plans'].update_one(
            {'_id': ObjectId(plan_id)},
            {'$push': {'sessions': ObjectId(session_id)}}
        )
        return session_id

    def mark_attendance(self, session_id, player_id, status, reason=None):
        """Mark player attendance"""
        attendance = {
            'player_id': ObjectId(player_id),
            'status': status,  # 'present', 'absent', 'late'
            'reason': reason,
            'rating': 0
        }
        self.db['training_sessions'].update_one(
            {'_id': ObjectId(session_id)},
            {'$push': {'attendance': attendance}}
        )

    def get_training_load(self, player_id, days=7):
        """Calculate training load for player"""
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        sessions = list(self.db['training_sessions'].find({
            'attendance.player_id': ObjectId(player_id),
            'date': {'$gte': cutoff_date}
        }))

        total_minutes = sum(s['duration'] for s in sessions)
        total_load = len(sessions) * 10  # Simple: sessions * 10 points
        return {
            'sessions': len(sessions),
            'total_minutes': total_minutes,
            'load_score': total_load,
            'load_level': 'low' if total_load < 30 else 'medium' if total_load < 60 else 'high'
        }
```

### 3.3 Service Registration

```python
# app/services/__init__.py

from flask_pymongo import PyMongo
from app.services.training_service import TrainingService
from app.services.injury_service import InjuryService
from app.services.player_analytics_service import PlayerAnalyticsService
# ... import all services

mongo = PyMongo()

class ServiceLocator:
    _services = {}

    @classmethod
    def initialize(cls, app):
        """Initialize all services with app context"""
        mongo.init_app(app)
        db = mongo.db

        # Register services
        cls._services['training'] = TrainingService(db)
        cls._services['injury'] = InjuryService(db)
        cls._services['player_analytics'] = PlayerAnalyticsService(db)
        # ... register all services

    @classmethod
    def get(cls, name):
        return cls._services.get(name)
```

---

## 4. Route & View Implementation

### 4.1 Route Pattern with Services

```python
# app/routes/coach.py

from flask import Blueprint, render_template, request, jsonify, redirect
from app.services import ServiceLocator
from app.routes.auth import login_required, role_required
from bson import ObjectId

coach_bp = Blueprint('coach', __name__, url_prefix='/coach')

@coach_bp.route('/training-plans', methods=['GET'])
@login_required
@role_required('coach', 'admin')
def training_plans():
    """List all training plans for coach's team"""
    coach_id = session.get('user_id')
    team_id = request.args.get('team_id')

    training_service = ServiceLocator.get('training')
    plans = training_service.get_plans_by_coach(coach_id, team_id)

    return render_template('coach/training_plans.html', plans=plans)

@coach_bp.route('/training-plan/create', methods=['POST'])
@login_required
@role_required('coach', 'admin')
def create_training_plan():
    """Create new training plan"""
    coach_id = session.get('user_id')
    club_id = session.get('club_id')

    training_service = ServiceLocator.get('training')
    plan_id = training_service.create_training_plan(
        club_id=club_id,
        team_id=request.form.get('team_id'),
        coach_id=coach_id,
        plan_data={
            'name': request.form.get('name'),
            'type': request.form.get('type'),  # 'weekly', 'monthly'
            'start_date': parse_date(request.form.get('start_date')),
            'end_date': parse_date(request.form.get('end_date')),
        }
    )

    return redirect(url_for('coach.training_plan_detail', plan_id=plan_id))
```

### 4.2 API Route Pattern (JSON responses)

```python
# app/routes/api.py

@api_bp.route('/api/training-plans/<plan_id>/sessions', methods=['GET'])
@login_required
def get_sessions(plan_id):
    """Get all sessions in a training plan (JSON)"""
    training_service = ServiceLocator.get('training')
    sessions = training_service.get_sessions_by_plan(plan_id)

    return jsonify({
        'status': 'success',
        'data': {
            'sessions': [
                {
                    'id': str(s['_id']),
                    'date': s['date'].isoformat(),
                    'duration': s['duration'],
                    'location': s['location'],
                    'focus': s['focus'],
                    'drills_count': len(s.get('drills', [])),
                    'attendance_count': len(s.get('attendance', []))
                }
                for s in sessions
            ]
        }
    })
```

---

## 5. Required Package Updates

### 5.1 requirements.txt Additions

```
# Core additions
stripe==7.0.0              # Payment processing
boto3==1.34.0              # AWS S3 file storage
flask-socketio==5.3.0      # Real-time WebSocket
flask-babel==4.0.0         # Internationalization
pandas==2.1.0              # Advanced analytics
celery==5.3.0              # Background tasks
redis==5.0.0               # Caching & Celery broker

# Supporting
python-socketio==5.11.0    # Socket.IO support
python-engineio==4.9.0     # Engine.IO protocol
openpyxl==3.11.0           # Excel export
reportlab==4.0.7           # PDF generation
```

### 5.2 Installation & Testing

```bash
# Install new packages
pip install -r requirements.txt

# Test imports
python -c "import stripe, boto3, flask_socketio"

# Update requirements in deployment
docker-compose build  # Rebuilds image with new packages
```

---

## 6. Configuration Management

### 6.1 Environment Variables for New Features

```python
# app/config.py

class Config:
    # ... existing config

    # Stripe
    STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY')
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
    STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

    # AWS S3
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'footapp-uploads')
    AWS_S3_REGION = os.getenv('AWS_S3_REGION', 'eu-west-1')

    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Flask-SocketIO
    SOCKETIO_MESSAGE_QUEUE = os.getenv('SOCKETIO_MESSAGE_QUEUE', 'redis://localhost:6379/1')

    # Celery
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/2')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/2')
```

### 6.2 .env Example

```bash
# Stripe
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# AWS
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=footapp-uploads-prod
AWS_S3_REGION=eu-west-1

# Redis
REDIS_URL=redis://redis-host:6379/0

# Other
SECRET_KEY=your-secret-key-here
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/FootClubApp
```

---

## 7. Testing Patterns

### 7.1 Service Testing Example

```python
# tests/unit/test_training_service.py

import pytest
from bson import ObjectId
from app.services.training_service import TrainingService

@pytest.fixture
def training_service(mongo_db):
    """Create training service with test database"""
    return TrainingService(mongo_db)

def test_create_training_plan(training_service):
    """Test training plan creation"""
    plan_id = training_service.create_training_plan(
        club_id=ObjectId(),
        team_id=ObjectId(),
        coach_id=ObjectId(),
        plan_data={
            'name': 'Pre-season 2026',
            'type': 'monthly',
            'start_date': datetime(2026, 7, 1),
            'end_date': datetime(2026, 8, 31),
        }
    )

    plan = training_service.get_by_id('training_plans', plan_id)
    assert plan['name'] == 'Pre-season 2026'
    assert plan['type'] == 'monthly'

def test_add_session_updates_plan(training_service):
    """Test that adding session updates plan's sessions list"""
    plan_id = training_service.create_training_plan(...)
    session_id = training_service.add_session(plan_id, {...})

    plan = training_service.get_by_id('training_plans', plan_id)
    assert len(plan['sessions']) == 1
    assert plan['sessions'][0] == ObjectId(session_id)
```

### 7.2 Route Testing Example

```python
# tests/unit/test_coach_routes.py

def test_training_plans_list(client, auth_headers):
    """Test GET /coach/training-plans"""
    response = client.get('/coach/training-plans', headers=auth_headers)
    assert response.status_code == 200
    assert 'training_plans.html' in response.get_data(as_text=True)

def test_create_training_plan(client, auth_headers, mongo_db):
    """Test POST /coach/training-plan/create"""
    response = client.post('/coach/training-plan/create', data={
        'name': 'Weekly Plan',
        'type': 'weekly',
        'start_date': '2026-03-10',
        'end_date': '2026-03-16',
        'team_id': str(ObjectId())
    }, headers=auth_headers)

    assert response.status_code == 302  # Redirect on success

    # Verify created in database
    plans = list(mongo_db.training_plans.find({'name': 'Weekly Plan'}))
    assert len(plans) == 1
```

---

## 8. Performance Optimization

### 8.1 Database Indexing

```python
# app/services/db.py

def create_indexes(db):
    """Create optimized database indexes"""

    # Users
    db.users.create_index('email', unique=True)
    db.users.create_index([('club_id', 1), ('role', 1)])

    # Training
    db.training_plans.create_index([('club_id', 1), ('team_id', 1)])
    db.training_sessions.create_index([('plan_id', 1), ('date', 1)])
    db.training_sessions.create_index([('attendance.player_id', 1)])

    # Injuries
    db.injuries.create_index([('player_id', 1), ('team_id', 1)])
    db.injuries.create_index([('status', 1), ('injury_date', -1)])

    # Matches
    db.matches.create_index([('club_id', 1), ('date', -1)])

    # Payments
    db.payments.create_index([('club_id', 1), ('status', 1)])
    db.payments.create_index([('stripe_customer_id', 1)])
```

### 8.2 Query Optimization

```python
# Bad: Multiple database calls
def get_match_details_bad(match_id):
    match = db.matches.find_one({'_id': ObjectId(match_id)})
    players = []
    for lineup_item in match['lineup']:
        player = db.players.find_one({'_id': lineup_item['player_id']})
        players.append(player)
    return match, players  # N+1 query problem

# Good: Single aggregation
def get_match_details_good(match_id):
    result = list(db.matches.aggregate([
        {'$match': {'_id': ObjectId(match_id)}},
        {'$lookup': {
            'from': 'players',
            'let': {'player_ids': '$lineup.player_id'},
            'pipeline': [
                {'$match': {'$expr': {'$in': ['$_id', '$$player_ids']}}}
            ],
            'as': 'players'
        }}
    ]))[0]
    return result
```

---

## 9. Security Implementation

### 9.1 Input Validation

```python
# app/utils/validators.py

from email_validator import validate_email
from datetime import datetime

def validate_email_address(email):
    """Validate email format"""
    try:
        valid = validate_email(email)
        return valid.email
    except:
        return None

def validate_date(date_str):
    """Validate and parse date"""
    try:
        return datetime.strptime(date_str, '%Y-%m-%d')
    except:
        return None

def validate_amount(amount):
    """Validate monetary amount"""
    try:
        value = float(amount)
        if value < 0:
            return None
        return value
    except:
        return None

# Usage in routes
@coach_bp.route('/training-plan/create', methods=['POST'])
def create_plan():
    name = request.form.get('name', '').strip()
    if not name or len(name) < 3:
        return error_response('Plan name too short')

    start_date = validate_date(request.form.get('start_date'))
    if not start_date:
        return error_response('Invalid start date')

    # Proceed with validated data...
```

### 9.2 Rate Limiting

```python
# app/__init__.py

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

app = create_app()
limiter.init_app(app)

# Apply to API routes
@api_bp.route('/api/payments', methods=['POST'])
@limiter.limit("5 per minute")
def create_payment():
    # Rate limited to 5 requests per minute
    pass
```

---

## 10. Deployment Considerations

### 10.1 Multi-Container Docker Setup

```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  web:
    build: .
    environment:
      - FLASK_ENV=production
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    restart: always

  db:
    image: mongo:latest
    volumes:
      - mongo_data:/data/db
    restart: always

  redis:
    image: redis:latest
    restart: always

  nginx:
    image: nginx:latest
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web
```

### 10.2 Environment-Specific Configuration

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f web

# Database backup
docker exec footapp-db mongodump --out /backup/$(date +%Y%m%d)

# Update code and restart
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Conclusion

This technical guide provides:
- ✅ Architecture patterns (Service layer, Blueprints, Decorators)
- ✅ Database design (Schemas, relationships, indexing)
- ✅ Service implementation examples
- ✅ Route patterns (HTML & JSON)
- ✅ Package management
- ✅ Configuration patterns
- ✅ Testing examples
- ✅ Performance optimization
- ✅ Security patterns
- ✅ Deployment guidance

**Next Steps for Implementation**:
1. Review and approve patterns
2. Set up Phase 0 infrastructure (WebSocket, S3, Analytics)
3. Begin service development following patterns
4. Write tests for each service
5. Deploy incrementally with monitoring
