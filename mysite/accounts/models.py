from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
import json


class UserAccountManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password) # Hash the password
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        user = self.create_user(email, password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return user

class UserAccount(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=255, unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    username = models.CharField(max_length=255, blank=True, null=True)

    objects = UserAccountManager()

    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = ['first_name', 'last_name']

    def get_full_name(self):
        return self.first_name + ' ' + self.last_name
    def get_short_name(self):
        return self.first_name

    def __str__(self):
        return self.email
    

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    #profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    embedding = models.TextField(null=True, blank=True) #pentru recomandari

    def set_embedding(self, embedding_list):
        """Primeste o lista de floats si o salveaza în format text JSON"""
        self.embedding = json.dumps(embedding_list)
        self.save()

    def get_embedding(self):
        """Returneaza embedding-ul ca lista de floats"""
        if self.embedding:
            return json.loads(self.embedding)
        return None
    
    def __str__(self):
        return f"{self.user.email} - profile"