from djoser.serializers import UserCreateSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Profile
from djoser.serializers import UserSerializer

User = get_user_model()

class UserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'password')

    def get_email_context(self):
        context = super().get_email_context()
        context['domain'] = '192.168.1.129:8000'  # sau domeniul tău real
        context['site_name'] = 'LectioSphere'
        print("Email context:", context)
        return context
    
    
# serializator pentru a crea un profil de utilizator
class ProfileSerializer(serializers.ModelSerializer):

    # acestea de mai sus, vor fi afisate in API, dar nu vor fi salvate in baza de date
    followers_count = serializers.SerializerMethodField() # numarul de urmaritori ai utilizatorului
    following_count = serializers.SerializerMethodField() # numarul de persoane pe care le urmareste utilizatorul
   
    class Meta:
        model = Profile
        fields = ['id', 'user', 'bio', 'profile_picture', 'followers_count', 'following_count']

    def get_followers_count(self, obj):
        # returneaza numarul de urmaritori ai profilului
        return obj.followers.count()

    def get_following_count(self, obj):
        # returneaza numarul de persoane pe care le urmareste utilizatorul
        return obj.following.count()