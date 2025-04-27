from djoser import email
from ..IPADDRESS import getIP

class CustomActivationEmail(email.ActivationEmail):
    def get_context_data(self):
        context = super().get_context_data()
        context['domain'] = getIP() + ':5173'  # aici pui domeniul tău real dacă e cazul
        context['site_name'] = 'LectioSphere'
        return context
