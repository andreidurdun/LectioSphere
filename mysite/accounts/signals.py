from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserAccount
from .models import Profile
from django.conf import settings

# in momentul in care un user este creat, se va crea automat un profil pentru el
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        
#cand un user e creat,se fac automat rafturile standard
from api.models import Shelf

@receiver(post_save, sender=UserAccount)
def create_default_shelves(sender, instance, created, **kwargs):
    if created:
        default_names = ["Read", "Reading", "ReadList", "Favourites"]
        for name in default_names:
            Shelf.objects.get_or_create(user=instance, name=name)
