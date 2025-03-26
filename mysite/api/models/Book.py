# api/models/Book.py
from django.db import models
from django.core.validators import MinLengthValidator

class Book(models.Model):
    title = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(3)],
        verbose_name="Book Title"
    )
    
    author = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(3)],
        verbose_name="Author"
    )
    
    genre = models.CharField(
        max_length=50,
        validators=[MinLengthValidator(3)],
        verbose_name="Genre"
    )
    
    def __str__(self):
        return f"{self.title} by {self.author} ({self.genre})"
