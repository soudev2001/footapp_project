import pytest
import threading
from app import create_app
from app.services.db import get_db


@pytest.fixture(scope='session')
def app():
    """Create application for E2E testing."""
    app = create_app('testing')
    return app


@pytest.fixture(scope='session')
def live_server(app):
    """Start Flask dev server in a background thread for E2E tests."""
    host = '127.0.0.1'
    port = 5099  # Use a non-standard port to avoid conflicts

    server_thread = threading.Thread(
        target=lambda: app.run(host=host, port=port, use_reloader=False)
    )
    server_thread.daemon = True
    server_thread.start()

    # Wait for server to be ready
    import time
    import urllib.request
    for _ in range(30):
        try:
            urllib.request.urlopen(f'http://{host}:{port}/')
            break
        except Exception:
            time.sleep(0.2)

    yield f'http://{host}:{port}'


@pytest.fixture(autouse=True)
def clean_db(app):
    """Clear test collections before each test."""
    with app.app_context():
        db = get_db()
        for name in db.list_collection_names():
            db[name].delete_many({})
    yield
    with app.app_context():
        db = get_db()
        for name in db.list_collection_names():
            db[name].delete_many({})
