from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from accounts.models import UserAccount
from .Book import Book

class Post(models.Model):

    # ce tip de postari (actiuni) sunt disponibile
    class ActionChoices(models.TextChoices):
        WANT_TO_READ = 'want_to_read', 'Want to Read'
        MADE_PROGRESS = 'made_progress', 'Made Progress'
        FINISHED_READING = 'finished_reading', 'Finished Reading'
        REVIEW = 'review', 'Review'
        POST = 'post', 'Post'

           
    description = models.TextField(
        validators=[MaxLengthValidator(255)],
        verbose_name="Description",
        null=True,
        blank=True,
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

    # Tipul de actiune (ex: review, postare, etc.)
    action = models.CharField(
        choices=ActionChoices.choices,
        verbose_name="Action",
        null=False, 
        blank=False,
    )
    
    rating = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=[(i, i) for i in range(1, 6)],
        verbose_name="Rating",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Post for '{self.book.title}' by {self.user.username} on {self.date} - Rating: {self.rating}"