# api/models/Library.py
from django.db import models
from .User import User  # Importăm modelul User
from django.core.validators import MinLengthValidator

class Library(models.Model):
    name = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(3)],
        verbose_name="Library Name"
    )
    
    user = models.ForeignKey(
        User,  # Un utilizator poate avea mai multe librării
        on_delete=models.CASCADE,
        related_name="libraries",  # Acesta va crea un atribut "libraries" în User
        verbose_name="User"
    )
    
    def __str__(self):
        return f"{self.name} by {self.user.first_name} {self.user.last_name}"
