from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from accounts.models import UserAccount
from .Book import Book

class Post(models.Model):

    description = models.TextField(
        validators=[MaxLengthValidator(255)],
        verbose_name="Description",
    )

    date = models.DateField(
        auto_now_add=True, 
        null=False, 
        blank=False,
        verbose_name="Date",
    )

    # Relatie cu modelul User
    user = models.ForeignKey(
        UserAccount,  
        on_delete=models.CASCADE,
        null=False, 
        blank=False,
        verbose_name="User",
    )

    # Relatie cu modelul Book
    book = models.ForeignKey(
        Book, 
        on_delete=models.CASCADE,
        null=False, 
        blank=False,
        verbose_name="Book",
    )

    # TO DO
    action = models.TextField(
        help_text="Info like characters, version, theme, rating, reviews, posters etc."
    )
    
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        choices=[(i, i) for i in range(1, 6)],
        null=False,
        blank=False,
        verbose_name="Rating"
    )

    def __str__(self):
        return f"Post for '{self.book.title}' by {self.user.username} on {self.date} - Rating: {self.rating}"