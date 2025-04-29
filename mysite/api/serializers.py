from rest_framework import serializers
#from .models.User import User
from accounts.models import UserAccount
from .models.Book import Book
from .models.Comment import Comment
from .models.Event import Event
from .models.Media import Media
from .models.Post import Post
from .models.PostLike import PostLike
from .models.ReadingSheet import ReadingSheet
from .models.Shelf import Shelf
from .models.ShelfBooks import ShelfBooks



class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["ISBN", "title", "author", "genre", "description", "rating", "nr_pages", "publication_year", "series"]


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserAccount.objects.all()) 
    book = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all())
    class Meta:
        model = Comment
        fields = ["text", "date", "user", "post"]



class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["name", "description", "start_date","expiring_date", "location", "link"]



class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ["path", "post"]



class PostSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserAccount.objects.all()) 
    #book = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all())
    book = BookSerializer(read_only=True)  
    class Meta:
        model = Post
        fields = ["description", "date", "user", "book", "action", "rating"]



class PostLikeSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserAccount.objects.all()) 
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all())
    class Meta:
        model = PostLike
        fields = ["user", "post"]



class ReadingSheetSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserAccount.objects.all()) 
    book = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all())
    shelf = serializers.PrimaryKeyRelatedField(queryset=Shelf.objects.all())
    class Meta:
        model = ReadingSheet
        fields = ["shelf", "user", "book", "text", "date"]



class ShelfSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserAccount.objects.all()) 
    class Meta:
        model = Shelf
        fields = ["name", "user"]



class ShelfBooksSerializer(serializers.ModelSerializer):
    shelf = serializers.PrimaryKeyRelatedField(queryset=Shelf.objects.all()) 
    book = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all())
    class Meta:
        model = ShelfBooks
        fields = ["shelf", "book"]



