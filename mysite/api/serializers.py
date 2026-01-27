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
from accounts.serializers import UserAccountSerializer
from api.models import Notification



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
    user = UserAccountSerializer(read_only=True)
    book = BookSerializer(read_only=True)  
    media = MediaSerializer(many=True, read_only=True) # media = iamgini / poze
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True, source='comment_set')  # sau 'comments' dc ai related_name
    pages_read = serializers.IntegerField(required=False, write_only=True)


    class Meta:
        model = Post
        #fields = ["id", "description", "date", "user", "book", "action", "rating","media"]
        fields = ["id", "description", "date", "user", "book", "action", "rating","media", "like_count", "comment_count", "comments", "pages_read", "progress"]



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
        Post.ActionChoices.FINISHED_READING,
        ]:
            self.fields['rating'].required = False
            self.fields['description'].required = False
            self.fields['media'].required = False

        elif action == Post.ActionChoices.MADE_PROGRESS:
            self.fields['rating'].required = False
            self.fields['description'].required = False
            self.fields['media'].required = False
            self.fields['pages_read'] = serializers.IntegerField(required=True, write_only=True)


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


    # def create(self, validated_data):
    #     validated_data['user'] = self.context['request'].user
    #     validated_data['book'] = self.context['book']  
    #     validated_data.pop('pages_read', None)
    #     return super().create(validated_data)


    def create(self, validated_data):
        user = self.context['request'].user
        book = self.context['book']
        action = validated_data.get('action')

        validated_data['user'] = user
        validated_data['book'] = book

        if action == Post.ActionChoices.MADE_PROGRESS:
            pages_read = self.initial_data.get('pages_read')

            try:
                pages_read = int(pages_read)
            except (TypeError, ValueError):
                raise serializers.ValidationError({"pages_read": "A valid integer is required for made_progress."})

            # Căutăm ultima postare de progres
            last_post = Post.objects.filter(
                user=user, book=book,
                action=Post.ActionChoices.MADE_PROGRESS
            ).order_by('-date').first()

        
            last_progress = last_post.progress if last_post and last_post.progress is not None else 0

            new_progress = last_progress + pages_read
            validated_data['progress'] = min(new_progress, book.nr_pages)

        # Curățăm pages_read pentru că nu e în model
        validated_data.pop('pages_read', None)

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



class NotificationSerializer(serializers.ModelSerializer):
    # Event notification fields
    title = serializers.CharField(source="event.title", allow_null=True, required=False)
    link = serializers.CharField(source="event.link", allow_null=True, required=False)
    date = serializers.DateField(source="event.date", allow_null=True, required=False)
    source = serializers.CharField(source="event.source", allow_null=True, required=False)
    
    # Book share notification fields
    sender_username = serializers.CharField(source="sender.username", allow_null=True, required=False)
    sender_id = serializers.IntegerField(source="sender.id", allow_null=True, required=False)
    
    # Use SerializerMethodField to handle both database books and external books
    book_id = serializers.SerializerMethodField()
    book_title = serializers.SerializerMethodField()
    book_cover = serializers.SerializerMethodField()
    book_author = serializers.SerializerMethodField()
    
    def get_book_id(self, obj):
        # Return stored external_book_id field first (for external books)
        if obj.external_book_id:
            return obj.external_book_id
        # Otherwise return database book ID
        return obj.book.id if obj.book else None
    
    def get_book_title(self, obj):
        # Return stored external_book_title field first (for external books)
        if obj.external_book_title:
            return obj.external_book_title
        # Otherwise return database book title
        return obj.book.title if obj.book else None
    
    def get_book_cover(self, obj):
        # Return stored external_book_cover field first (for external books)
        if obj.external_book_cover:
            return obj.external_book_cover
        # Otherwise return database book cover
        return obj.book.cover_image if obj.book else None
    
    def get_book_author(self, obj):
        # Return stored external_book_author field first (for external books)
        if obj.external_book_author:
            return obj.external_book_author
        # Otherwise return database book author
        return obj.book.author if obj.book else None

    class Meta:
        model = Notification
        fields = [
            "id", "notification_type", "message", "created_at", "is_read",
            # Event fields
            "title", "link", "date", "source",
            # Book share fields
            "sender_username", "sender_id", "book_id", "book_title", "book_cover", "book_author"
        ]
