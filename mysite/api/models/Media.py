from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from .Post import Post

class Media(models.Model):
    file = models.ImageField( 
        upload_to='posts_pics',
        default = 'default.jpg', 
        verbose_name="Media File"
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name='media',
        verbose_name="Post"
    )

    def __str__(self):
        return f"Media for Post {self.post.id} - {self.file.name}"