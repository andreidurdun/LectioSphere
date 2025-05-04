from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator

class Book(models.Model):

    id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Book ID"
    )
    
    ISBN = models.CharField(
        primary_key=True,
    )

    title = models.CharField(
        validators=[MinLengthValidator(2), MaxLengthValidator(255)],
        verbose_name="Book Title"
    )
    
    author = models.CharField(
        validators=[MinLengthValidator(2), MaxLengthValidator(255)],
        verbose_name="Author"
    )
    
    genre = models.CharField(
        validators=[MinLengthValidator(2), MaxLengthValidator(255)],
        verbose_name="Genre"
    )

    # cover = models.ImageField(
    #     upload_to='covers/', 
    #     blank=True, 
    #     null=True
    # )

    cover = models.URLField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name="Cover Image URL"
    )

    description = models.TextField(
        blank=True, 
        null=True, 
        validators=[MinLengthValidator(2), MaxLengthValidator(255)],
        verbose_name="Book Description"
    )

    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        choices=[(i, i) for i in range(1, 6)],
        null=False,
        blank=False,
        verbose_name="Rating"
    )

    nr_pages = models.IntegerField(
        validators=[MinValueValidator(1)],
        null=False,
        blank=False,
        verbose_name="Number of Pages"
    )

    publication_year = models.IntegerField(
        validators=[MinValueValidator(1900), MaxValueValidator(2100)],
        null=True,
        blank=True,
        verbose_name="Publication Year"
    )

    series = models.CharField(
        validators=[MinLengthValidator(2), MaxLengthValidator(255)],
        blank=True, 
        null=True,
        verbose_name="Series"
    )

    def __str__(self):
        return f"{self.title} by {self.author} | Genre: {self.genre} | Rating: {self.rating}/5 | Pages: {self.nr_pages} | Published: {self.publication_year} | Series: {self.series or 'N/A'}"

