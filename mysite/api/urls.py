from django.urls import path, re_path, include
#from .views import views
from .views import GoogleBooksAPIView
from .views import BooksView
from .views import PostsView
from .views import EventsScapperView

from api.views.LibraryPageView import LibraryPageView

from api.views.ReadingSheetsView import ReadingSheetsView
from api.views.LibraryPageView import LibraryPageView

from api.views.ReadingSheetsView import ReadingSheetsView
from rest_framework.routers import DefaultRouter
from .views import PostsView  # asigură-te că importul e corect
from api.views.LibraryPageView import LibraryPageView
from api.views.LibraryPageView import LibraryPageView  # Removed as it could not be resolved

from api.views.ReadingSheetsView import ReadingSheetsView
from api.views.LibraryPageView import LibraryPageView

from api.views.ReadingSheetsView import ReadingSheetsView
from rest_framework.routers import DefaultRouter
from .views import PostsView  # asigură-te că importul e corect
router = DefaultRouter()
router.register(r"posts", PostsView, basename="posts")


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


   #urls pentru postari
   path("posts/add/", PostsView.as_view({"post": "add_post"}), name="add-post"),
   path("posts/<int:pk>/", PostsView.as_view({"get": "read_post"}), name="read-post"),
   path("posts/<int:pk>/delete/", PostsView.as_view({"delete": "delete_post"}), name="delete-post"),
   path("posts/<int:pk>/update/", PostsView.as_view({"put": "update_post", "patch": "update_post"}), name="update-post"),
   path("posts/", PostsView.as_view({"get": "list_posts"}), name="list-posts"),
    
    
    
   path("library/", LibraryPageView.as_view({'get': 'list'}), name="library-page"),

   path("api/", include(router.urls)),

   # Comentarii la postări
   # path("posts/<int:pk>/add_comment/", PostsView.as_view({"post": "add_comment"}), name="add-comment"),
 #   path("posts/<int:pk>/list_comments/", PostsView.as_view({"get": "list_comments"}), name="list-comments"),

# Like / Unlike la postări
  #  path("posts/<int:pk>/toggle_like/", PostsView.as_view({"post": "toggle_like"}), name="toggle-like"),


   path("library/reading_challenge/", LibraryPageView.as_view({"get": "reading_challenge"})),
   path("library/shelves/", LibraryPageView.as_view({"get": "shelves"})),
   path("library/book_status/", LibraryPageView.as_view({"get": "book_status"})),

#pt even


    path('scrape-events/', EventsScapperView.scrape_events),

]

