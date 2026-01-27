from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserAccount
from .models import Profile
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# in momentul in care un user este creat, se va crea automat un profil pentru el
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile(sender, instance, created, **kwargs):
    if created:
        try:
            Profile.objects.create(user=instance)
            logger.info(f'Profile created for user: {instance.email}')
        except Exception as e:
            logger.exception(f'Error creating profile for user {instance.email}: {e}')
            raise
        
#cand un user e creat,se fac automat rafturile standard
from api.models import Shelf

@receiver(post_save, sender=UserAccount)
def create_default_shelves(sender, instance, created, **kwargs):
    if created:
        try:
            default_names = ["Read", "Reading", "ReadList", "Favourites"]
            for name in default_names:
                Shelf.objects.get_or_create(user=instance, name=name)
            logger.info(f'Default shelves created for user: {instance.email}')
        except Exception as e:
            logger.exception(f'Error creating default shelves for user {instance.email}: {e}')
            raise
