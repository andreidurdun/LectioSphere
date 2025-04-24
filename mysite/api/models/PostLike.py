from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from accounts.models import UserAccount
from .Post import Post

class PostLike(models.Model):
    # Relatie cu modelul User
    user = models.ForeignKey(
        UserAccount, 
        on_delete=models.CASCADE,
        null=False, 
        blank=False,
    )

    # Relatie cu modelul Post
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE,
        null=False, 
        blank=False
    )

    class Meta:
        unique_together = ('user', 'post')