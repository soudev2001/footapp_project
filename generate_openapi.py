import json
import inspect
import ast
import re
import textwrap
from app import create_app

def extract_params_from_ast(func):
    query_params = set()
    body_params = set()
    if not func:
        return query_params, body_params
        
    try:
        source = inspect.getsource(func)
        source = textwrap.dedent(source)
        tree = ast.parse(source)
    except Exception:
        return query_params, body_params
        
    for node in ast.walk(tree):
        # look for .get('key')
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute) and node.func.attr == 'get':
                if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str):
                    # try to see if it's chained to request.args or request.json/request.form
                    # this is an approximation: any .get('xxx') is considered a param
                    key = node.args[0].value
                    
                    # check if the call involves 'args' (for query) or form/json
                    # For simplicity, we assign it to body if we can't tell, unless it explicitly says 'args'
                    is_query = False
                    if isinstance(node.func.value, ast.Attribute):
                        if node.func.value.attr == 'args':
                            is_query = True
                    
                    if is_query:
                        query_params.add(key)
                    else:
                        body_params.add(key)
        
        # look for dict access ['key']
        elif isinstance(node, ast.Subscript):
            if isinstance(node.slice, ast.Constant) and isinstance(node.slice.value, str):
                key = node.slice.value
                
                is_query = False
                if isinstance(node.value, ast.Attribute) and node.value.attr == 'args':
                    is_query = True
                    
                if is_query:
                    query_params.add(key)
                else:
                    body_params.add(key)
                    
    return list(query_params), list(body_params)

def generate_openapi():
    app = create_app()
    
    openapi = {
        "openapi": "3.0.3",
        "info": {
            "title": "FootLogic Elite API",
            "description": "Documentation autogénérée de toutes les routes de l'application (GET, POST, PUT, DELETE).",
            "version": "2.0.0"
        },
        "servers": [
            {"url": "/", "description": "Serveur principal"}
        ],
        "components": {
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            }
        },
        "paths": {}
    }

    with app.app_context():
        # Iterate over all routes
        for rule in app.url_map.iter_rules():
            # Skip static routes
            if rule.endpoint == 'static':
                continue
            
            methods = [m for m in rule.methods if m not in ['HEAD', 'OPTIONS']]
            if not methods:
                continue
                
            path = str(rule)
            # Convert Flask's <param> to Swagger's {param}
            path = re.sub(r'<([^>:]*:)?([^>]+)>', r'{\2}', path)
            
            if path not in openapi['paths']:
                openapi['paths'][path] = {}
                
            view_func = app.view_functions.get(rule.endpoint)
            docstring = inspect.getdoc(view_func) if view_func else ""
            summary = docstring.split('\n')[0] if docstring else rule.endpoint
            
            blueprint = rule.endpoint.split('.')[0] if '.' in rule.endpoint else 'default'
            
            # Extract queried / body params using AST
            query_params, body_params = extract_params_from_ast(view_func)
            
            for method in methods:
                method_lower = method.lower()
                
                # Parameters extraction
                parameters = []
                for arg in rule.arguments:
                    parameters.append({
                        "name": arg,
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": f"URL parameter: {arg}"
                    })
                    
                # Add extracted Query parameters
                for qparam in query_params:
                    # Avoid duplicates with path params
                    if qparam not in rule.arguments:
                        parameters.append({
                            "name": qparam,
                            "in": "query",
                            "required": False,
                            "schema": {"type": "string"}
                        })
                
                # Setup Auth Security if route is not public
                security = [{"BearerAuth": []}]
                if rule.endpoint in ['main.index', 'auth.login', 'auth.register', 'api.api_login', 'static', 'main.manifest', 'main.service_worker']:
                    security = []
                
                operation = {
                    "summary": summary,
                    "tags": [blueprint.capitalize()],
                    "security": security,
                    "responses": {
                        "200": {"description": "Success"},
                        "400": {"description": "Bad Request"},
                        "401": {"description": "Unauthorized"},
                        "404": {"description": "Not Found"},
                        "500": {"description": "Server Error"}
                    }
                }
                
                if parameters:
                    operation["parameters"] = parameters
                    
                if method_lower in ['post', 'put', 'patch']:
                    operation["requestBody"] = {
                        "description": "Payload body for this request",
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": True,
                                    "description": "JSON payload containing fields required by this endpoint."
                                }
                            },
                            "multipart/form-data": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": True
                                }
                            },
                            "application/x-www-form-urlencoded": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": True
                                }
                            }
                        }
                    }
                    
                openapi['paths'][path][method_lower] = operation

    # Save to JSON
    out_path = 'app/static/openapi.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(openapi, f, indent=2, ensure_ascii=False)
    
    print(f"[*] OpenAPI JSON generated at {out_path} with {len(openapi['paths'])} paths.")

if __name__ == '__main__':
    generate_openapi()
