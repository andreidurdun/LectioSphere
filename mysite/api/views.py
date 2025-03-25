from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from .models.User import User
from .models.Library import Library
from .models.Book import Book
from .serializers import UserSerializer
from .serializers import BookSerializer
from .serializers import LibrarySerializer

class UserListCreate(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class BookListCreate(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

class LibraryListCreate(generics.ListCreateAPIView):
    queryset = Library.objects.all()
    serializer_class = LibrarySerializer