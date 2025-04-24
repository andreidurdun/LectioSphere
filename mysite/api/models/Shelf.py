from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from accounts.models import UserAccount

class Shelf(models.Model):
   
    # Relatie cu modelul User
    user = models.ForeignKey(
        UserAccount, 
        on_delete=models.CASCADE,
        blank=True, 
        null=True
    )

    name = models.CharField(
        validators=[MinLengthValidator(1), MaxLengthValidator(255)],
        blank=True, 
        null=True
    )

    def __str__(self):
        return f"{self.name}"