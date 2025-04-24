from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from .Shelf import Shelf
from .Book import Book

class ShelfBooks(models.Model):

    # Relatie cu modelul Shelf
    shelf = models.ForeignKey(
        Shelf, on_delete=models.CASCADE,
        null=False, 
        blank=False,
    )
    
    # Relatie cu modelul Book
    book = models.ForeignKey(
        Book, 
        on_delete=models.CASCADE,
        null=False, 
        blank=False
    )

    class Meta:
        unique_together = ('shelf', 'book')