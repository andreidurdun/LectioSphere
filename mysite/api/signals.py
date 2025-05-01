from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import ShelfBooks, Shelf, Post
from accounts.models import Profile
from sentence_transformers import SentenceTransformer
import numpy as np
from django.utils.timezone import now


model = SentenceTransformer('all-MiniLM-L6-v2')

@receiver(post_save, sender=ShelfBooks)
def update_user_embedding(sender, instance, created, **kwargs):
    if not created:
        return  # doar când adăugăm un ShelfBook nou
  
    shelf = instance.shelf
    if shelf.name != "Read":
        return  # doar pentru raftul "Read"

    user = shelf.user

    # Găsim toate cărțile citite de user
    shelf_books = ShelfBooks.objects.filter(shelf=shelf)

    descriptions = [shelf_book.book.description for shelf_book in shelf_books if shelf_book.book.description]

    if not descriptions:
        return  # nu avem ce recalcula

    # Encode toate descrierile
    embeddings = model.encode(descriptions)
    mean_embedding = np.mean(embeddings, axis=0).tolist()  # face media și transformă în listă de floats

    # Actualizăm profilul userului
    profile, created = Profile.objects.get_or_create(user=user)
    profile.set_embedding(mean_embedding)



    

# @receiver(post_save, sender=ShelfBooks)
# def create_want_to_read_post(sender, instance, created, **kwargs):
#     if not created:
#         return

#     shelf = instance.shelf
#     book = instance.book
#     user = shelf.user

#     if shelf.name == "Read" and not Post.objects.filter(user=user, book=book, action=Post.ActionChoices.WANT_TO_READ).exists():
#         Post.objects.create(
#             user=user,
#             book=book,
#             action=Post.ActionChoices.WANT_TO_READ,
#             date=now()
#         )