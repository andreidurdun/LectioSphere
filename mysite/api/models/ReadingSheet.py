from django.db import models
from django.core.validators import MaxLengthValidator

from accounts.models import UserAccount
from .Book import Book
from .Shelf import Shelf


class ReadingSheet(models.Model):

    MODEL_CHOICES = [
        ("basic", "Basic Notes"),
        ("book_review", "Book Review"),
        ("reading_notes", "Reading Notes"),
        ("reading_reflections", "Reading Reflections"),
    ]

    # optional
    shelf = models.ForeignKey(
        Shelf,
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )

    # obligatoriu
    user = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE
    )

    # obligatoriu
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE
    )

    # ce tip de fisa e
    model_type = models.CharField(
        max_length=30,
        choices=MODEL_CHOICES,
        default="basic"
    )

    # campuri structurate pt modelele "avansate"
    data = models.JSONField(default=dict, blank=True)

    # pt basic (ramane ca la tine)
    text = models.TextField(
        validators=[MaxLengthValidator(255)],
        blank=True,
        null=True,
    )

    date = models.DateField(auto_now_add=True)

    def __str__(self):
        book_title = self.book.title if self.book else "Unknown Book"
        username = self.user.username if self.user else "Unknown User"
        return f"Reading Sheet [{self.model_type}] for '{book_title}' by {username} on {self.date}"
