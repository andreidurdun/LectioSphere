from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator

class Event(models.Model):
  
    name = models.CharField(
        validators=[MinLengthValidator(2), MaxLengthValidator(255)],
        null=False, 
        blank=False,
        verbose_name="Event Name",
    )
    
    description = models.TextField(
        validators=[MaxLengthValidator(1023)],
        null=False, 
        blank=False,
        verbose_name="Description",
    )

    start_date = models.DateField(
        null=False, 
        blank=False,
        verbose_name="Start Date",
    )
    
    expiring_date = models.DateField(
        null=False, 
        blank=False,
        verbose_name="Expiring Date",
    )
    
    # image = models.ImageField(
    #     upload_to='events/', 
    #     blank=True, 
    #     null=True
    # )  

    location = models.CharField(
        validators=[MinLengthValidator(2), MaxLengthValidator(255)],
        null=False, 
        blank=False,
        verbose_name="Location",
    )
    
    link = models.URLField(
        null=False, 
        blank=False,
        verbose_name="Event Link"
    )

    def __str__(self):
        return f"Event: {self.name} on {self.start_date} at {self.location} - link: {self.link}"
   