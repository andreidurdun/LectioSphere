from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import ShelfBooks, Shelf, Post
from accounts.models import Profile
from sentence_transformers import SentenceTransformer
import numpy as np
from django.utils.timezone import now


model = SentenceTransformer('all-MiniLM-L6-v2')

@receiver(post_save, sender=Post)
def update_user_embedding(sender, instance, created, **kwargs):

    if not created:
        return  "Nu a fost facuta o postare"# daca nu s a facut o postare: return 
  
     # instance = modelul Post care tocmai a fost salvat in BD
    if instance.rating == 0:
        return  # 0 = nu a lasat rating

    user = instance.user

    # luam cartile despre care a postat userul
    posts = Post.objects.filter(user=user).exclude(rating=0)
    
    descriptions_ratings = [(post.book.description, post.rating) for post in posts if post.book.description] # lista de tuplu (descriere, rating)

    if not descriptions_ratings:
        return  # nu avem ce recalcula

    descriptions, ratings = zip(*descriptions_ratings)

    # normalizam ratingurile intre [0,1]
    ratings = np.array(ratings)
    weights = ratings / np.sum(ratings)

    # encode toate descrierile
    embeddings = model.encode(descriptions)
    weighted_embeddings = np.average(embeddings, axis=0, weights=weights).tolist()  # media ponderata a embedding urilor (lista de floats)
    

    # actualizam profilul userului
    profile, created = Profile.objects.get_or_create(user=user)
    profile.set_embedding(weighted_embeddings)



    

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