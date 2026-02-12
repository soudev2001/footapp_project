# FootLogic V2 - Shop Service

from bson import ObjectId
from datetime import datetime

class ShopService:
    """Service for managing shop products and orders"""
    
    def __init__(self, db):
        self.db = db
        self.products_collection = db.products
        self.orders_collection = db.orders

    def get_all_products(self, category=None):
        """Get all products, optionally filtered by category"""
        query = {}
        if category:
            query['category'] = category
        return list(self.products_collection.find(query))

    def get_product_by_id(self, product_id):
        """Get a single product by ID"""
        return self.products_collection.find_one({'_id': ObjectId(product_id)})

    def get_categories(self):
        """Get unique categories of products"""
        return self.products_collection.distinct('category')

    def create_order(self, user_id, items, total_amount, shipping_info):
        """Create a new order"""
        order = {
            'user_id': ObjectId(user_id) if user_id else None,
            'items': items, # List of {product_id, quantity, price, size}
            'total_amount': float(total_amount),
            'shipping_info': shipping_info,
            'status': 'pending',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = self.orders_collection.insert_one(order)
        order['_id'] = result.inserted_id
        
        # Update stock (simplified)
        for item in items:
            self.products_collection.update_one(
                {'_id': ObjectId(item['product_id'])},
                {'$inc': {'stock': -int(item['quantity'])}}
            )
            
        return order

    def get_user_orders(self, user_id):
        """Get all orders for a user"""
        return list(self.orders_collection.find({'user_id': ObjectId(user_id)}).sort('created_at', -1))

    def get_order_by_id(self, order_id):
        """Get order by ID"""
        return self.orders_collection.find_one({'_id': ObjectId(order_id)})
