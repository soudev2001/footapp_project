
from pymongo import MongoClient
from werkzeug.security import check_password_hash
import os

MONGO_URI = 'mongodb+srv://soufiane:gogo@cluster0.05omqhe.mongodb.net/FootClubApp'
client = MongoClient(MONGO_URI)
db = client.get_database()

email = 'admin@footlogic.fr'
password = 'admin123'

user = db.users.find_one({'email': email})
if user:
    print(f"User found: {user['email']}")
    is_valid = check_password_hash(user['password_hash'], password)
    print(f"Password 'admin123' valid? {is_valid}")
    
    # Let's try superadmin1
    user2 = db.users.find_one({'email': 'superadmin1@footlogic.com'})
    if user2:
        print(f"User found: {user2['email']}")
        is_valid2 = check_password_hash(user2['password_hash'], 'super123')
        print(f"Password 'super123' valid? {is_valid2}")
else:
    print("User admin@footlogic.fr NOT found")

client.close()
