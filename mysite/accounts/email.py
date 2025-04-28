from djoser import email
import sys
import os

# Adăugăm directorul părinte în path pentru a putea importa IPADDRESS.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from IPADDRESS import getIP

class CustomActivationEmail(email.ActivationEmail):
    def get_context_data(self):
        context = super().get_context_data()
        context['domain'] = getIP() + ':8000'  # aici pui domeniul tău real dacă e cazul
        context['site_name'] = 'LectioSphere'
        return context
