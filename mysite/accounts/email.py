from djoser import email

class CustomActivationEmail(email.ActivationEmail):
    def get_context_data(self):
        context = super().get_context_data()
        context['domain'] = 'localhost:8000'  # aici pui domeniul tău real dacă e cazul
        context['site_name'] = 'LectioSphere'
        return context
