"""FootLogic V2 - Entry Point"""
from app import create_app

app = create_app()

if __name__ == '__main__':
    print("[*] FootLogic V2 - Starting server...")
    print("[*] Navigation Demo: http://127.0.0.1:5000/nav-demo")
    print("[*] API Health: http://127.0.0.1:5000/api/health")
    print("[*] Running on http://127.0.0.1:5000")
    app.run(debug=True)

