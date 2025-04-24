from djoser.serializers import UserCreateSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'name', 'password')
    
    def get_email_context(self):
        context = super().get_email_context()
        context['domain'] = 'localhost:5173'  # sau domeniul tău real
        context['site_name'] = 'LectioSphere'
        print("Email context:", context)
        return context
        