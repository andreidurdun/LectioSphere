from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class UserPreferences(models.Model):
    MODEL_CHOICES = [
        ("basic", "Basic"),
        ("model1", "Model 1"),
        ("model2", "Model 2"),
        ("model3", "Model 3"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preferences")
    preferred_model = models.CharField(max_length=10, choices=MODEL_CHOICES, default="basic")

    def __str__(self):
        return f"Preferences for {self.user.username}"
