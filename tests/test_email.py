import os
from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)

# Configuration Flask-Mail pour Gmail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_USERNAME')

mail = Mail(app)

def test_email(to_email):
    if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
        print("Erreur: Les variables MAIL_USERNAME et MAIL_PASSWORD ne sont pas définies dans le .env")
        return False

    with app.app_context():
        msg = Message(
            subject="Test de configuration FootLogic",
            recipients=[to_email],
            body="Si vous recevez cet email, la configuration SMTP Gmail pour FootLogic fonctionne correctement !"
        )
        try:
            mail.send(msg)
            print(f"Succès : Email envoyé avec succès à {to_email}")
            return True
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email : {e}")
            return False

if __name__ == "__main__":
    email_dest = input("Entrez l'adresse email de destination pour le test : ")
    test_email(email_dest)
