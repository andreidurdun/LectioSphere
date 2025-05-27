from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
import json

class UserAccountManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        print(extra_fields)

        if not email:
            raise ValueError('Users must have an email address')
            
        
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password) # Hash the password
        user.save()
        return user

    
    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        extra_fields.update({
            'first_name': first_name,
            'last_name': last_name,
        })
        user = self.create_user(email, password=password, **extra_fields)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return user



class UserAccount(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=255, unique=True)
    username = models.CharField(max_length=255, unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    #username = models.CharField(max_length=255, blank=True, null=True)
    objects = UserAccountManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def get_full_name(self):
        return self.first_name + ' ' + self.last_name
    def get_short_name(self):
        return self.first_name
    def __str__(self):
        return self.email
    


# profilul utilizatorului care contine : user-ul (cu datele de la crearea contului), bio (un text scurt despre utilizator), poza de profil , lista de followers 
# followers - relatie many to many cu el insusi, adica un utilizator poate sa aiba multi followers si sa urmareasca multi utilizatori
class Profile(models.Model):

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(default = 'default.jpg', upload_to='profile_pics', blank=True, null=True)
    followers = models.ManyToManyField('self', related_name='following', symmetrical=False, blank=True)
    embedding = models.TextField(null=True, blank=True)  # salvat ca text JSON

    def set_embedding(self, embedding_list):
        """primeste o lista de floats si o salveaza in format text JSON."""
        self.embedding = json.dumps(embedding_list)
        self.save()

    def get_embedding(self):
        """returneaza embedding-ul ca lista de floats (sau None daca nu exista)."""
        if self.embedding:
            return json.loads(self.embedding)
        return None


    def __str__(self):
        return f'{self.user.username} Profile'


