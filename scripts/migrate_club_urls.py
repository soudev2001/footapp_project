#!/usr/bin/env python3
"""
Migration script to clean up invalid image URLs in clubs collection.
This removes or validates image URLs that don't start with / or http
"""

from pymongo import MongoClient
import sys
import os

def migrate_club_urls(mongo_uri='mongodb://mongodb:27017/', db_name='footapp'):
    """Fix invalid URLs in clubs collection"""
    
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        clubs_collection = db['clubs']
        
        # Find all clubs with logo or cover_url
        clubs = list(clubs_collection.find({
            '$or': [
                {'logo': {'$exists': True, '$ne': None, '$ne': ''}},
                {'cover_url': {'$exists': True, '$ne': None, '$ne': ''}}
            ]
        }))
        
        print(f"Found {len(clubs)} clubs with logo/cover_url")
        
        fixed_count = 0
        
        for club in clubs:
            club_id = club['_id']
            club_name = club.get('name', 'Unknown')
            changes = {}
            
            # Check logo
            logo = club.get('logo', '').strip() if club.get('logo') else ''
            if logo and not (logo.startswith('/') or logo.startswith('http')):
                print(f"  Removing invalid logo from '{club_name}': '{logo}'")
                changes['logo'] = None
            elif logo and logo.startswith('/'):
                # Make sure it has the full path
                if not logo.startswith('/static/uploads/'):
                    print(f"  Fixing logo URL for '{club_name}': '{logo}'")
                    club_id_str = str(club_id)
                    if f'/{club_id_str}/' in logo:
                        # URL is correct, just needs /static/uploads/ prefix
                        fixed_path = f"/static/uploads/clubs{logo.split(club_id_str)[0] + club_id_str}/"+logo.split('/')[-1]
                        changes['logo'] = fixed_path
            
            # Check cover_url
            cover = club.get('cover_url', '').strip() if club.get('cover_url') else ''
            if cover and not (cover.startswith('/') or cover.startswith('http')):
                print(f"  Removing invalid cover from '{club_name}': '{cover}'")
                changes['cover_url'] = None
            elif cover and cover.startswith('/'):
                if not cover.startswith('/static/uploads/'):
                    print(f"  Fixing cover URL for '{club_name}': '{cover}'")
                    club_id_str = str(club_id)
                    if f'/{club_id_str}/' in cover:
                        fixed_path = f"/static/uploads/clubs{cover.split(club_id_str)[0] + club_id_str}/"+cover.split('/')[-1]
                        changes['cover_url'] = fixed_path
            
            # Apply changes if any
            if changes:
                clubs_collection.update_one(
                    {'_id': club_id},
                    {'$set': changes}
                )
                fixed_count += 1
                print(f"  ✓ Updated '{club_name}' with changes: {changes}")
        
        print(f"\n✓ Migration complete. Fixed {fixed_count} club(s).")
        client.close()
        return True
        
    except Exception as e:
        print(f"✗ Migration failed: {e}", file=sys.stderr)
        return False


if __name__ == '__main__':
    # Get mongo URI from environment or use default
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://mongodb:27017/')
    db_name = os.getenv('DB_NAME', 'footapp')
    
    print(f"Migrating club URLs in {db_name} at {mongo_uri}")
    success = migrate_club_urls(mongo_uri, db_name)
    sys.exit(0 if success else 1)
