from rest_framework import serializers
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

    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ["ISBN", "id", "title", "author", "genre", "description", "average_rating", "nr_pages", "publication_year", "series", "cover"]

    def get_average_rating(self, obj):
        return obj.average_rating



class CommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "text", "date", "user", "user_username", "post"]
        read_only_fields = ["date", "user", "post"]




class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["name", "description", "start_date","expiring_date", "location", "link"]



class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ["id","file", "post"]



class PostSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=UserAccount.objects.all()) 
    book = BookSerializer(read_only=True)  
    media = MediaSerializer(many=True, read_only=True) # media = iamgini / poze
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True, source='comment_set')  # sau 'comments' dc ai related_name

    class Meta:
        model = Post
        #fields = ["id", "description", "date", "user", "book", "action", "rating","media"]
        fields = ["id", "description", "date", "user", "book", "action", "rating","media", "like_count", "comment_count", "comments"]



    # validari in functie de tiprul de actiune pe care dorim sa o executam 
    # urmatoarele atribuite sunt neecsare si suficiente pentru postrea de tipul indicat
    # want_to_read      date, user, book
    # made_progress     date, user, book
    # finished_reading  date, user, book
    # review            date, user, book, description, rating
    # post              date, user, book, description - media (*)
    # (*) pentru o postare trebuie ca cel putin una dintre datele descriere sau imagine sa fie completate/nenule 


    # marchez care campuri sunt requied in functie de actiunea pe care dorim sa o facem si care nu sunt 
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        initial_data = kwargs.get('data') or getattr(self, 'initial_data', {})
        action = initial_data.get('action') if initial_data else None

        if action == Post.ActionChoices.REVIEW:
            self.fields['rating'].required = True
            self.fields['description'].required = False
            self.fields['media'].required = False

        elif action == Post.ActionChoices.POST:
            self.fields['rating'].required = False
            self.fields['description'].required = False
            self.fields['media'].required = False

        elif action in [
            Post.ActionChoices.WANT_TO_READ,
            Post.ActionChoices.MADE_PROGRESS,
            Post.ActionChoices.FINISHED_READING,
        ]:
            self.fields['rating'].required = False
            self.fields['description'].required = False
            self.fields['media'].required = False


    # validari in functie de actiunea pe care dorim sa o facem
    # de exemplu : post (postarea clasica pe care o face useru-ul) nu trebuie sa aiba rating 
    def validate(self, data): 
        action = data.get('action')

        # if not action:
        #     raise serializers.ValidationError({"action": "Action is required."})

        if action == Post.ActionChoices.REVIEW:
            if data.get('rating') is None:
                raise serializers.ValidationError({"rating": "Rating is required for reviews."})

        elif action == Post.ActionChoices.POST:
            description = data.get('description')
            media = self.initial_data.get('media')
            if not description and (not media or len(media) == 0):
                raise serializers.ValidationError({"non_field_errors": "At least one of 'description' or 'media' is required for posts."})

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
    #met noi
    def get_like_count(self, obj):
        return PostLike.objects.filter(post=obj).count()

    def get_comment_count(self, obj):
        return Comment.objects.filter(post=obj).count()




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



