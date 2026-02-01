import os
import shutil
import re
import unicodedata

# --- CONFIGURATION ---
# On regarde dans filesToAdd car c'est la que tu as mis tes fichiers
SOURCE_DIRS = ['filesToAdd', 'templates']
TARGET_ROOT = 'footapp_v2'
APP_DIR = os.path.join(TARGET_ROOT, 'app')
TEMPLATES_DIR = os.path.join(APP_DIR, 'templates')
STATIC_DIR = os.path.join(APP_DIR, 'static')
ROUTES_DIR = os.path.join(APP_DIR, 'routes')
SERVICES_DIR = os.path.join(APP_DIR, 'services')

# Mapping des fichiers pour normaliser les noms
FILE_MAPPING = {
    'index.html': 'index.html',
    'siteVitrine.html': 'index.html',
    'Connexion.html': 'login.html',
    'login.html': 'login.html',
    'nscription.html': 'register.html',
    'register.html': 'register.html',
    'Récupération.html': 'forgot_password.html',
    'forgot-password.html': 'forgot_password.html',
    'Super Admin Panel.html': 'admin_panel.html',
    'admin.html': 'admin_panel.html',
    'Club Dashboard.html': 'dashboard.html',
    'dashboard.html': 'dashboard.html',
    'Mobile App.html': 'app_home.html',
    'app.html': 'app_home.html',
    'Actualités Club.html': 'feed.html',
    'feed.html': 'feed.html',
    'Créer un Post.html': 'create_post.html',
    'create-post.html': 'create_post.html',
    'Messagerie.html': 'chat_inbox.html',
    'chat-inbox.html': 'chat_inbox.html',
    'Conversation.html': 'chat_conversation.html',
    'chat-conversation.html': 'chat_conversation.html',
    'Calendrier.html': 'calendar.html',
    'calendar.html': 'calendar.html',
    'Match Center.html': 'match_center.html',
    'match-center.html': 'match_center.html',
    'Effectif.html': 'roster.html',
    'roster.html': 'roster.html',
    'Manager Tactique.html': 'tactics.html',
    'tactics.html': 'tactics.html',
    'Présences.html': 'attendance.html',
    'attendance.html': 'attendance.html',
    'Créer Événement.html': 'create_event.html',
    'create-event.html': 'create_event.html',
    'Profil Joueur.html': 'profile.html',
    'profile.html': 'profile.html',
    'Modifier Profil.html': 'edit_profile.html',
    'edit-profile.html': 'edit_profile.html',
    'Documents.html': 'documents.html',
    'documents.html': 'documents.html',
    'Paramètres.html': 'settings.html',
    'settings.html': 'settings.html',
    'Notifications.html': 'notifications.html',
    'notifications.html': 'notifications.html',
    'Réservations.html': 'reservations.html',
    'reservation.html': 'reservations.html',
    'Détail Produit.html': 'shop_product.html',
    'shop-product.html': 'shop_product.html',
    'Paiement.html': 'checkout.html',
    'checkout.html': 'checkout.html',
    'Vue Fan.html': 'public_club.html',
    'public-club.html': 'public_club.html',
    'Classement.html': 'ranking.html',
    'ranking.html': 'ranking.html',
    'Aide et Support.html': 'help.html',
    'help.html': 'help.html',
    'Détail Entraînement.html': 'event_training.html',
    'event-training.html': 'event_training.html',
    'Galerie Photos.html': 'gallery.html',
    'gallery.html': 'gallery.html',
    'Mentions Légales.html': 'terms.html',
    'terms.html': 'terms.html',
    'Erreur 404.html': '404.html',
    '404.html': '404.html',
    'Facture.html': 'invoice.html',
    'invoice.html': 'invoice.html',
    'Architecture.html': 'architecture.html',
    'navigation_diagram.html': 'architecture.html'
}

def normalize_name(filename):
    """Nettoie un nom de fichier s'il n'est pas dans le mapping"""
    try:
        name = unicodedata.normalize('NFKD', filename).encode('ASCII', 'ignore').decode('utf-8')
        name = name.lower().replace(' ', '_').replace('-', '_')
        return name
    except:
        return "unknown_file.html"

def create_structure():
    """Crée les dossiers"""
    dirs = [
        APP_DIR, TEMPLATES_DIR, STATIC_DIR, 
        ROUTES_DIR, SERVICES_DIR,
        os.path.join(STATIC_DIR, 'css'),
        os.path.join(STATIC_DIR, 'js'),
        os.path.join(STATIC_DIR, 'img')
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    print(f"✅ Structure de dossiers créée dans {TARGET_ROOT}")

def migrate_files():
    """Déplace et renomme les fichiers HTML"""
    files_processed = set()
    
    # 1. Copier les fichiers statiques existants si présents
    if os.path.exists('static'):
        shutil.copytree('static', STATIC_DIR, dirs_exist_ok=True)

    # 2. Traiter les templates
    for source_dir in SOURCE_DIRS:
        if not os.path.exists(source_dir):
            continue
            
        for filename in os.listdir(source_dir):
            if not filename.endswith('.html'):
                continue
                
            src_path = os.path.join(source_dir, filename)
            
            # Déterminer le nouveau nom
            new_name = FILE_MAPPING.get(filename, normalize_name(filename))
            
            dst_path = os.path.join(TEMPLATES_DIR, new_name)
            
            # Copie simple
            shutil.copy2(src_path, dst_path)
            files_processed.add((filename, new_name))
            print(f"📄 Migré: {filename} -> {new_name}")

    return files_processed

def update_html_links(files_map):
    """Met à jour les href='...' dans les nouveaux fichiers HTML"""
    
    replacements = {}
    for old, new in files_map:
        replacements[old] = new
        replacements[f"./{old}"] = new
        replacements[f"/{old}"] = new
        # Ajout pour gérer les espaces encodés dans les anciens liens
        replacements[old.replace(' ', '%20')] = new

    for filename in os.listdir(TEMPLATES_DIR):
        filepath = os.path.join(TEMPLATES_DIR, filename)
        
        # CORRECTION WINDOWS : encodage utf-8 forcé à la lecture
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        for old_link, new_link in replacements.items():
            # Regex insensible à la casse
            pattern = re.compile(f'href=["\']{re.escape(old_link)}["\']', re.IGNORECASE)
            endpoint = new_link.replace('.html', '')
            
            # Gestion cas spécial pour les fichiers commençant par un chiffre
            if endpoint[0].isdigit():
                endpoint = f"page_{endpoint}"
            
            # Remplacement par syntaxe Jinja2 Flask
            content = pattern.sub(f'href="{{{{ url_for(\'main.{endpoint}\') }}}}"', content)

        # CORRECTION WINDOWS : encodage utf-8 forcé à l'écriture
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    
    print("🔗 Liens HTML mis à jour vers la syntaxe Jinja2")

def generate_python_code(files_map):
    """Génère le code Flask dynamique"""
    
    endpoints = []
    for _, new_name in files_map:
        func_name = new_name.replace('.html', '')
        # Normalisation des noms de fonction Python (pas de tirets)
        func_name_py = func_name.replace('-', '_')
        
        # CORRECTION : Si le nom commence par un chiffre (ex: 404), on ajoute un préfixe
        if func_name_py[0].isdigit():
            func_name_py = f"page_{func_name_py}"
        
        route = f"/{func_name.replace('_', '-')}"
        if func_name == 'index': route = '/'
        if func_name == 'login': route = '/login'
        
        endpoints.append({
            'func': func_name_py,
            'route': route,
            'template': new_name
        })
    
    # 1. ROUTES (app/routes/main.py)
    routes_code = "from flask import Blueprint, render_template\n\n"
    routes_code += "main_bp = Blueprint('main', __name__)\n\n"
    
    seen_funcs = set()
    for ep in endpoints:
        if ep['func'] in seen_funcs: continue
        seen_funcs.add(ep['func'])
        
        routes_code += f"@main_bp.route('{ep['route']}')\n"
        routes_code += f"def {ep['func']}():\n"
        routes_code += f"    return render_template('{ep['template']}')\n\n"

    # CORRECTION WINDOWS : utf-8 pour écrire les routes
    with open(os.path.join(ROUTES_DIR, 'main.py'), 'w', encoding='utf-8') as f:
        f.write(routes_code)

    # 2. INIT ROUTES
    with open(os.path.join(ROUTES_DIR, '__init__.py'), 'w', encoding='utf-8') as f:
        f.write("from .main import main_bp")

    # 3. APP FACTORY
    app_init_code = """from flask import Flask

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'dev_key_secret_footapp'
    
    from .routes import main_bp
    app.register_blueprint(main_bp)
    
    return app
"""
    with open(os.path.join(APP_DIR, '__init__.py'), 'w', encoding='utf-8') as f:
        f.write(app_init_code)

    # 4. ENTRY POINT
    run_code = """from app import create_app

app = create_app()

if __name__ == '__main__':
    print("🚀 FootApp V2 lancé sur http://127.0.0.1:5000")
    app.run(debug=True)
"""
    # CORRECTION WINDOWS : C'est ici que ça plantait avec l'emoji fusée 🚀
    with open(os.path.join(TARGET_ROOT, 'run.py'), 'w', encoding='utf-8') as f:
        f.write(run_code)
        
    print("🐍 Code Python Flask généré avec succès")

if __name__ == "__main__":
    print("--- Démarrage du Refactoring (Mode Windows Safe) ---")
    create_structure()
    processed = migrate_files()
    update_html_links(processed)
    generate_python_code(processed)
    print("\n✅ TERMINÉ ! Allez dans le dossier 'footapp_v2' et lancez 'python run.py'")