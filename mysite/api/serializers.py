from rest_framework import serializers
from .models.User import User
from .models.Book import Book
from .models.Library import Library

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "phone_number", "description"] #, "profile_picture"]

# Serializer pentru modelul Book
class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "title", "author", "genre"]

# Serializer pentru modelul Library
class LibrarySerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())  # Folosim PrimaryKeyRelatedField pentru ID-ul user-ului

    class Meta:
        model = Library
        fields = ["id", "name", "user"]