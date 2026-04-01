from app import create_app
from app.services.db import mongo
from werkzeug.security import check_password_hash

app = create_app()
with app.app_context():
    print(f"Connecting to: {app.config['MONGO_URI']}")
    users = list(mongo.db.users.find())
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"Email: {u['email']}, Role: {u['role']}")
        if u['email'] == 'superadmin1@footlogic.com':
            match = check_password_hash(u['password_hash'], 'super123')
            print(f"  Password match for 'super123': {match}")
