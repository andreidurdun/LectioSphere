from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response

#from api.models.User import User
from api.models.Book import Book
from api.models.Comment import Comment
from api.models.Event import Event
from api.models.Media import Media
from api.models.Post import Post
from api.models.PostLike import PostLike
from api.models.ReadingSheet import ReadingSheet
from api.models.Shelf import Shelf
from api.models.ShelfBooks import ShelfBooks

#from api.serializers import UserSerializer
from api.serializers import BookSerializer
from api.serializers import CommentSerializer
from api.serializers import EventSerializer
from api.serializers import MediaSerializer
from api.serializers import PostSerializer
from api.serializers import PostLikeSerializer
from api.serializers import ReadingSheetSerializer
from api.serializers import ShelfSerializer
from api.serializers import ShelfBooksSerializer

from django.conf import settings

from rest_framework import serializers
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from requests.exceptions import HTTPError



class BookListCreate(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    

class CommentListCreate(generics.ListCreateAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer


class EventListCreate(generics.ListCreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
  

class PostListCreate(generics.ListCreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer


class ReadingSheetListCreate(generics.ListCreateAPIView):
    queryset = ReadingSheet.objects.all()
    serializer_class = ReadingSheetSerializer
    

class ShelfListCreate(generics.ListCreateAPIView):
    queryset = Shelf.objects.all()
    serializer_class = ShelfSerializer
   

class ShelfBooksListCreate(generics.ListCreateAPIView):
    queryset = ShelfBooks.objects.all()
    serializer_class = ShelfBooksSerializer
   
# class UserListCreate(generics.ListCreateAPIView):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer
   