from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from .User import User

class Shelf(models.Model):
   
    # Relatie cu modelul User
    user = models.ForeignKey(
        User, 
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
        return f"{self.name} - {self.user.username}"