# api/models/notification.py
from django.db import models
from accounts.models import UserAccount

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('event', 'Event'),
        ('book_share', 'Book Share'),
    ]
    
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='event')
    
    # For event notifications
    event = models.ForeignKey("api.Event", on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    
    # For book share notifications
    sender = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name="sent_notifications", null=True, blank=True)
    book = models.ForeignKey("api.Book", on_delete=models.CASCADE, related_name="share_notifications", null=True, blank=True)
    message = models.TextField(null=True, blank=True)
    
    # For external books (not in database yet)
    external_book_id = models.CharField(max_length=255, null=True, blank=True)  # External book ID (e.g., Google Books ID)
    external_book_title = models.CharField(max_length=500, null=True, blank=True)
    external_book_cover = models.URLField(max_length=1000, null=True, blank=True)
    external_book_author = models.CharField(max_length=500, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        if self.notification_type == 'book_share':
            return f"Book share from {self.sender.username} to {self.user.username}"
        return f"Notification for {self.user} - {self.event.title if self.event else 'No event'}"
