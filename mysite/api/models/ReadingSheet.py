from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from .User import User
from .Book import Book
from .Shelf import Shelf

class ReadingSheet(models.Model):

    # Relatie cu modelul Shelf
    shelf = models.ForeignKey(
        Shelf, 
        on_delete=models.CASCADE,
        blank=True, 
        null=True
    )

    # Relatie cu modelul User
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        blank=True, 
        null=True
    )   

    # Relatie cu modelul Book
    book = models.ForeignKey(
        Book, 
        on_delete=models.CASCADE,
        blank=True, 
        null=True
    )

    text = models.TextField(
        validators=[MaxLengthValidator(255)],
        blank=True, 
        null=True,
    )

    date = models.DateField(
        auto_now_add=True, 
        blank=True, 
        null=True,
    )

    def __str__(self):
        return f"Reading Sheet for '{self.book.title}' by {self.user.username if self.user else 'Unknown User'} on {self.date}"