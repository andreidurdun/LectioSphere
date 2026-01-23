from django.db import models

class Event(models.Model):
    title = models.CharField(max_length=500,null=True, blank=True)
    link = models.URLField(max_length=1000,null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)

    source = models.CharField(max_length=100, null=True, blank=True)  
    external_id = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["source", "external_id"], name="uniq_event_source_external")
        ]

    def __str__(self):
        return f"[{self.source}] {self.title}"
