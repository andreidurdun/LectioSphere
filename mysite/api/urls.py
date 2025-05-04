from django.urls import path, re_path, include
#from .views import views
from .views import GoogleBooksAPIView
from .views import BooksView
<<<<<<< HEAD
from .views import PostsView
=======
from api.views.LibraryPageView import LibraryPageView

from api.views.ReadingSheetsView import ReadingSheetsView
>>>>>>> 60713e2f (Adaugare view fise de lectura si rutare)


urlpatterns = [
   
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
<<<<<<< HEAD


    # urls pentru postari
    path("posts/add/", PostsView.as_view({"post": "add_post"}), name="add-post"),
    path("posts/<int:pk>/", PostsView.as_view({"get": "read_post"}), name="read-post"),
    path("posts/<int:pk>/delete/", PostsView.as_view({"delete": "delete_post"}), name="delete-post"),
    path("posts/<int:pk>/update/", PostsView.as_view({"put": "update_post", "patch": "update_post"}), name="update-post"),
    path("posts/", PostsView.as_view({"get": "list_posts"}), name="list-posts"),
    
]
=======
    path("library/", LibraryPageView.as_view(), name="library-page"),
    path("reading_sheets/user/", ReadingSheetsView.as_view(), name="user-reading-sheets"),
]
>>>>>>> 60713e2f (Adaugare view fise de lectura si rutare)
