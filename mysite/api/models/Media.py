from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from .Post import Post

class Media(models.Model):

    path = models.CharField(       
        validators=[MinLengthValidator(2), MaxLengthValidator(255)],
        blank=False,
        null=False,
        verbose_name="Path",
        
    )

    # Relatie cu modelul Post
    post = models.ForeignKey(
        Post, 
        on_delete=models.CASCADE,
        null=False, 
        blank=False,
        verbose_name="Post"
    )

    def __str__(self):
        return self.path