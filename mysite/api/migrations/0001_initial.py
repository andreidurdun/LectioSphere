# Generated by Django 5.2 on 2025-05-03 10:05

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Book',
            fields=[
                ('ISBN', models.CharField(primary_key=True, serialize=False)),
                ('title', models.CharField(validators=[django.core.validators.MinLengthValidator(2), django.core.validators.MaxLengthValidator(255)], verbose_name='Book Title')),
                ('author', models.CharField(validators=[django.core.validators.MinLengthValidator(2), django.core.validators.MaxLengthValidator(255)], verbose_name='Author')),
                ('genre', models.CharField(validators=[django.core.validators.MinLengthValidator(2), django.core.validators.MaxLengthValidator(255)], verbose_name='Genre')),
                ('description', models.TextField(blank=True, null=True, validators=[django.core.validators.MinLengthValidator(2), django.core.validators.MaxLengthValidator(255)], verbose_name='Book Description')),
                ('rating', models.IntegerField(choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)], validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)], verbose_name='Rating')),
                ('nr_pages', models.IntegerField(validators=[django.core.validators.MinValueValidator(1)], verbose_name='Number of Pages')),
                ('publication_year', models.IntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1900), django.core.validators.MaxValueValidator(2100)], verbose_name='Publication Year')),
                ('series', models.CharField(blank=True, null=True, validators=[django.core.validators.MinLengthValidator(2), django.core.validators.MaxLengthValidator(255)], verbose_name='Series')),
            ],
        ),
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(validators=[django.core.validators.MinLengthValidator(2), django.core.validators.MaxLengthValidator(255)], verbose_name='Event Name')),
                ('description', models.TextField(validators=[django.core.validators.MaxLengthValidator(1023)], verbose_name='Description')),
                ('start_date', models.DateField(verbose_name='Start Date')),
                ('expiring_date', models.DateField(verbose_name='Expiring Date')),
                ('location', models.CharField(validators=[django.core.validators.MinLengthValidator(2), django.core.validators.MaxLengthValidator(255)], verbose_name='Location')),
                ('link', models.URLField(verbose_name='Event Link')),
            ],
        ),
        migrations.CreateModel(
            name='Post',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.TextField(validators=[django.core.validators.MaxLengthValidator(255)], verbose_name='Description')),
                ('date', models.DateField(auto_now_add=True, verbose_name='Date')),
                ('action', models.TextField(help_text='Info like characters, version, theme, rating, reviews, posters etc.')),
                ('rating', models.IntegerField(choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)], validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)], verbose_name='Rating')),
                ('book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.book', verbose_name='Book')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
        ),
        migrations.CreateModel(
            name='Media',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('path', models.CharField(validators=[django.core.validators.MinLengthValidator(2), django.core.validators.MaxLengthValidator(255)], verbose_name='Path')),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.post', verbose_name='Post')),
            ],
        ),
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField(validators=[django.core.validators.MinLengthValidator(2), django.core.validators.MaxLengthValidator(255)], verbose_name='Comment Text')),
                ('date', models.DateField(auto_now_add=True, verbose_name='Date of Comment')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='User who made the comment')),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.post', verbose_name='Post associated with the comment')),
            ],
        ),
        migrations.CreateModel(
            name='Shelf',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, null=True, validators=[django.core.validators.MinLengthValidator(1), django.core.validators.MaxLengthValidator(255)])),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ReadingSheet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField(blank=True, null=True, validators=[django.core.validators.MaxLengthValidator(255)])),
                ('date', models.DateField(auto_now_add=True, null=True)),
                ('book', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.book')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('shelf', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.shelf')),
            ],
        ),
        migrations.CreateModel(
            name='PostLike',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.post')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'post')},
            },
        ),
        migrations.CreateModel(
            name='ShelfBooks',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.book')),
                ('shelf', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.shelf')),
            ],
            options={
                'unique_together': {('shelf', 'book')},
            },
        ),
    ]
