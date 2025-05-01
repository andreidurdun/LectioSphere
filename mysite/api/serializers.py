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
    book = BookSerializer(read_only=True)  
    class Meta:
        model = Post
        fields = ["id", "description", "date", "user", "book", "action", "rating"]


    # validari in functie de tiprul de actiune pe care dorim sa o executam 
    # urmatoarele atribuite sunt neecsare si suficiente pentru postrea de tipul indicat
    # want_to_read      date, user, book
    # made_progress     date, user, book
    # finished_reading  date, user, book
    # review            date, user, book, description, rating
    # post              date, user, book, description - images (*)
    # (*) pentru o postare trebuie ca cel putin una dintre datele descriere sau imagine sa fie completate/nenule 



    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        initial_data = kwargs.get('data') or getattr(self, 'initial_data', {})
        action = initial_data.get('action') if initial_data else None

        if action == Post.ActionChoices.REVIEW:
            self.fields['rating'].required = True
            self.fields['description'].required = False

        elif action == Post.ActionChoices.POST:
            self.fields['rating'].required = False
            self.fields['description'].required = False

        elif action in [
            Post.ActionChoices.WANT_TO_READ,
            Post.ActionChoices.MADE_PROGRESS,
            Post.ActionChoices.FINISHED_READING,
        ]:
            self.fields['rating'].required = False
            self.fields['description'].required = False



    def validate(self, data): 
        action = data.get('action')

        if action == Post.ActionChoices.REVIEW:
            if data.get('rating') is None:
                raise serializers.ValidationError({"rating": "Rating is required for reviews."})

        elif action == Post.ActionChoices.POST:
            if data.get('rating') is not None:
                raise serializers.ValidationError({"rating": "Rating is not allowed for posts."})

        elif action in [
            Post.ActionChoices.WANT_TO_READ,
            Post.ActionChoices.MADE_PROGRESS,
            Post.ActionChoices.FINISHED_READING,
        ]:
            if data.get('rating') is not None:
                raise serializers.ValidationError({"rating": f"Rating is not allowed for '{action}'."})
            if data.get('description'):
                raise serializers.ValidationError({"description": f"Description is not allowed for '{action}'."})

        return data


    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['book'] = self.context['book']  
        return super().create(validated_data)



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



