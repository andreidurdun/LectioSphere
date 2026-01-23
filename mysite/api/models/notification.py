# api/models/notification.py
from django.db import models
from accounts.models import UserAccount

class Notification(models.Model):
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name="notifications")
    event = models.ForeignKey("api.Event", on_delete=models.CASCADE, related_name="notifications")
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user} - {self.event.title}"
