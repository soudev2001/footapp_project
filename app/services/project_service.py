# FootLogic V2 - Project Service

from bson import ObjectId
from datetime import datetime
from app.services.db import get_db
from app.models import create_project, create_ticket, serialize_doc, serialize_docs

class ProjectService:
    def __init__(self):
        self.db = get_db()
        self.projects_collection = self.db.projects
        self.tickets_collection = self.db.tickets

    def create_project(self, name, description, owner_id):
        project = create_project(name, description, owner_id)
        result = self.projects_collection.insert_one(project)
        project['_id'] = result.inserted_id
        return serialize_doc(project)

    def get_project(self, project_id):
        project = self.projects_collection.find_one({'_id': ObjectId(project_id)})
        return serialize_doc(project)

    def get_all_projects(self):
        projects = self.projects_collection.find().sort('created_at', -1)
        return serialize_docs(list(projects))

    def update_project(self, project_id, data):
        data['updated_at'] = datetime.utcnow()
        self.projects_collection.update_one(
            {'_id': ObjectId(project_id)},
            {'$set': data}
        )
        return self.get_project(project_id)

    def delete_project(self, project_id):
        # Also delete all tickets associated with the project
        self.tickets_collection.delete_many({'project_id': ObjectId(project_id)})
        return self.projects_collection.delete_one({'_id': ObjectId(project_id)})

    # Tickets
    def create_ticket(self, project_id, title, description, reporter_id, ticket_type='task', priority='medium'):
        ticket = create_ticket(project_id, title, description, reporter_id, ticket_type, priority)
        result = self.tickets_collection.insert_one(ticket)
        ticket['_id'] = result.inserted_id
        return serialize_doc(ticket)

    def get_ticket(self, ticket_id):
        ticket = self.tickets_collection.find_one({'_id': ObjectId(ticket_id)})
        return serialize_doc(ticket)

    def get_project_tickets(self, project_id):
        tickets = self.tickets_collection.find({'project_id': ObjectId(project_id)}).sort('created_at', -1)
        return serialize_docs(list(tickets))

    def update_ticket(self, ticket_id, data):
        data['updated_at'] = datetime.utcnow()
        if 'project_id' in data:
            data['project_id'] = ObjectId(data['project_id'])
        if 'reporter_id' in data:
            data['reporter_id'] = ObjectId(data['reporter_id'])
        if 'assignee_id' in data:
            data['assignee_id'] = ObjectId(data['assignee_id'])
            
        self.tickets_collection.update_one(
            {'_id': ObjectId(ticket_id)},
            {'$set': data}
        )
        return self.get_ticket(ticket_id)

    def delete_ticket(self, ticket_id):
        return self.tickets_collection.delete_one({'_id': ObjectId(ticket_id)})
