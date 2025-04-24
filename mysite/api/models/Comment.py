from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from accounts.models import UserAccount
from .Post import Post

class Comment(models.Model):

    text = models.TextField(
        validators=[MinLengthValidator(2), MaxLengthValidator(255)],
        null=False,
        blank=False,
        verbose_name="Comment Text"
    )

    date = models.DateField(
        auto_now_add=True, 
        null=False, 
        blank=False,
        verbose_name="Date of Comment"
    )
    # Relatie cu modelul User
    user = models.ForeignKey(
        UserAccount, 
        on_delete=models.CASCADE,
        null=False, 
        blank=False,
        verbose_name="User who made the comment"
    )

    # Relatie cu modelul Post
    post = models.ForeignKey(
        Post, 
        on_delete=models.CASCADE, 
        null=False, 
        blank=False,
        verbose_name="Post associated with the comment"
    )

    def __str__(self):
        return f"Comment by X on {self.date} – {self.text}..."
    