from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator



class User(AbstractUser):
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

    username = models.CharField( 
        #unique=True,
        max_length=50,
        validators=[MinLengthValidator(3)],
        verbose_name="Username"
    )
    
    email = models.EmailField(
        #unique=True,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$',
                message="Enter a valid email address"
            )
        ],
        verbose_name="Email Address"
    )
    
    
    description = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Description"
    )
    
    # profile_picture = models.ImageField(
    #     upload_to='profile_pictures/',
    #     blank=True,
    #     null=True,
    #     verbose_name="Profile Picture"
    # )

    friends = models.ManyToManyField(
        "self",
        symmetrical=False,
        blank=True
    )
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"