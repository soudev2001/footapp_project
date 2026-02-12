
from pymongo import MongoClient
import os

MONGO_URI = 'mongodb+srv://soufiane:gogo@cluster0.05omqhe.mongodb.net/FootClubApp'
client = MongoClient(MONGO_URI)
db = client.get_database()

print("Collections in DB:", db.list_collection_names())
users = list(db.users.find({}, {'email': 1, 'role': 1}))
print("Found users:")
for u in users:
    print(f" - {u.get('email')} ({u.get('role')})")

client.close()
