from django.db import models
from django.core.validators import MinLengthValidator, RegexValidator

class User(models.Model):
    first_name = models.CharField(
        max_length=50,
        validators=[MinLengthValidator(3)],
        verbose_name="First Name"
    )
    
    last_name = models.CharField(
        max_length=50,
        validators=[MinLengthValidator(3)],
        verbose_name="Last Name"
    )
    
    email = models.EmailField(
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$',
                message="Enter a valid email address"
            )
        ],
        verbose_name="Email Address"
    )
    
    phone_number = models.CharField(
        max_length=15,
        validators=[MinLengthValidator(10)],
        verbose_name="Phone Number"
    )
    
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    
    # profile_picture = models.ImageField(
    #     upload_to='profile_pictures/',
    #     blank=True,
    #     null=True,
    #     verbose_name="Profile Picture"
    # )
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"