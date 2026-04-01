from app import create_app
from app.services import get_user_service

app = create_app()
with app.app_context():
    user_service = get_user_service()
    email = "superadmin1@footlogic.com"
    password = "super123"
    
    user = user_service.verify_password(email, password)
    if user:
        print(f"Login SUCCESS for {email}")
        print(f"User details: {user}")
    else:
        print(f"Login FAILED for {email}")
        # Try to find user manually
        u = user_service.get_by_email(email)
        if u:
            print(f"User found but password mismatch.")
        else:
            print(f"User NOT found in database.")
