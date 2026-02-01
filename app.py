from flask import Flask, render_template

app = Flask(__name__, template_folder='templates', static_folder='static')

@app.route('/')
def index(): return render_template('index.html')

@app.route('/login')
def login(): return render_template('login.html')

@app.route('/register')
def register(): return render_template('register.html')

@app.route('/admin')
def admin(): return render_template('admin.html')

@app.route('/dashboard')
def dashboard(): return render_template('dashboard.html')

@app.route('/app')
def mobile_app(): return render_template('app.html')

# Routes génériques pour les autres fichiers
@app.route('/<page>')
def generic_page(page):
    try:
        return render_template(f'{page}.html')
    except:
        return render_template('404.html'), 404

if __name__ == '__main__':
    print("[*] Serveur FootApp lance sur http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
