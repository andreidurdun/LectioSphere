from django.urls import path, re_path, include
from .views import views
from .views import GoogleBooksAPIView
from .views import BooksView
from api.views.LibraryPageView import LibraryPageView

from api.views.ReadingSheetsView import ReadingSheetsView


urlpatterns = [
   
    path("books/", views.BookListCreate.as_view(), name="book-list-create"),
    path("comments/", views.CommentListCreate.as_view(), name="comment-list-create"),
    path("events/", views.EventListCreate.as_view(), name="event-list-create"),
    path("posts/", views.PostListCreate.as_view(), name="post-list-create"),
    path("reading_sheets/", views.ReadingSheetListCreate.as_view(), name="reading-sheet-list-create"),
    path("shelves/", views.ShelfListCreate.as_view(), name="shelf-list-create"),
    path("shelves_books/", views.ShelfBooksListCreate.as_view(), name="shelf-books-list-create"),
    #path("userprofile/", views.UserListCreate.as_view(), name="userprofile-view-create"),
    path("books/search/", GoogleBooksAPIView.as_view({"get": "search"}), name="google-books-search"),
    path("books/category/", GoogleBooksAPIView.as_view({"get": "category"}), name="google-books-category"),
    path("books/recommendation/<str:category>/", GoogleBooksAPIView.as_view({"get": "recommendation"}), name="books-recommendation"),
    path("books/recommendation/", GoogleBooksAPIView.as_view({"get": "recommendation_generalized"}), name="books-recommendation_generalized"),
    path("books/currently_reading/add/", BooksView.as_view({"post": "add_to_currently_reading"}), name="add-currently-reading"),
    path("books/read/add/", BooksView.as_view({"post": "add_to_read"}), name="add-read"),
    path("books/read_list/add/", BooksView.as_view({"post": "add_to_read_list"}), name="add-read-list"),
    path("books/currently_reading/remove/", BooksView.as_view({"delete": "remove_from_currently_reading"}), name="remove-currently-reading"),
    path("books/read/remove/", BooksView.as_view({"delete": "remove_from_read"}), name="remove-read"),
    path("books/read_list/remove/", BooksView.as_view({"delete": "remove_from_read_list"}), name="remove-read-list"),
    path("books/currently_reading/get/", BooksView.as_view({"get": "get_currently_reading"}), name="get-currently-reading"),
    path("books/read/get/", BooksView.as_view({"get": "get_read"}), name="get-read"),
    path("books/read_list/get/", BooksView.as_view({"get": "get_read_list"}), name="get-read-list"),
    path("books/get/<str:isbn>/", BooksView.as_view({"get": "get_book"}), name="get-book"),
    path("books/get_friends_books/", BooksView.as_view({"get": "get_friends_books"}), name="get-friends-books"),
    path("library/", LibraryPageView.as_view(), name="library-page"),
    path("reading_sheets/user/", ReadingSheetsView.as_view(), name="user-reading-sheets"),
]