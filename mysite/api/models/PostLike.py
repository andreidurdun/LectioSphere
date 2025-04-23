from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from .User import User
from .Post import Post

class PostLike(models.Model):
    # Relatie cu modelul User
    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
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