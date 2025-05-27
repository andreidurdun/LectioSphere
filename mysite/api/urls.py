from django.urls import path, re_path, include
#from .views import views
from .views import GoogleBooksAPIView
from .views import BooksView
from .views import PostsView
from .views import EventsScapperView
from api.views.ShelfByNameView import ShelfByNameView  # ✅ corect
from api.views.BooksWebScrapperView import BooksWebScrapperView  # Import the missing view

from api.views.ReadingSheetsView import ReadingSheetsView
from api.views.LibraryPageView import LibraryPageView

from api.views.ReadingSheetsView import ReadingSheetsView
from rest_framework.routers import DefaultRouter
from .views import PostsView  # asigură-te că importul e corect
from rest_framework.routers import DefaultRouter
from .views import PostsView  # asigură-te că importul e corect
router = DefaultRouter()
router.register(r"posts", PostsView, basename="posts")
router.register(r"library", LibraryPageView, basename="library")




router2 = DefaultRouter()

router2.register(r"reading-sheets", ReadingSheetsView, basename="reading-sheets")

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


   #urls pentru postari + feed
   path("posts/add/", PostsView.as_view({"post": "add_post"}), name="add-post"),
   path("posts/<int:pk>/", PostsView.as_view({"get": "read_post"}), name="read-post"),
   path("posts/<int:pk>/delete/", PostsView.as_view({"delete": "delete_post"}), name="delete-post"),
   path("posts/<int:pk>/update/", PostsView.as_view({"put": "update_post", "patch": "update_post"}), name="update-post"),
   path("posts/", PostsView.as_view({"get": "list_posts"}), name="list-posts"),
   path("posts/feed/", PostsView.as_view({"get": "feed"}), name="feed"),
   path("posts/post_type/", PostsView.as_view({"get": "list_post_type_posts"}), name="list-post-type-posts"),
   path("posts/non_post_type/", PostsView.as_view({"get": "list_non_post_type_posts"}), name="list-non-post-type-posts"),
    
    
    
    
   path("library/", LibraryPageView.as_view({'get': 'list'}), name="library-page"),
   path("library/delete_shelf/<str:name>/", LibraryPageView.as_view({"delete": "delete_shelf"}), name="delete-shelf"),

   path("api/", include(router.urls)),

   # Comentarii la postări
   # path("posts/<int:pk>/add_comment/", PostsView.as_view({"post": "add_comment"}), name="add-comment"),
 #   path("posts/<int:pk>/list_comments/", PostsView.as_view({"get": "list_comments"}), name="list-comments"),

# Like / Unlike la postări
  #  path("posts/<int:pk>/toggle_like/", PostsView.as_view({"post": "toggle_like"}), name="toggle-like"),
  path(
        "library/shelf/<str:name>/", 
        LibraryPageView.as_view({"get": "get_shelf_by_name"}), 
        name="library-shelf"),
   path("library/reading_challenge/", LibraryPageView.as_view({"get": "reading_challenge"})),
   path("library/shelves/", LibraryPageView.as_view({"get": "shelves"})),
   path("library/book_status/", LibraryPageView.as_view({"get": "book_status"})),
   
     
     
     
     
  path("library/shelf/<str:name>/", ShelfByNameView.as_view(), name="shelf-by-name"),

     
    path("api/", include(router2.urls)),  #pt rafturi


#pt even

    path('scrape-books/', BooksWebScrapperView.as_view(), name='scrape_books'),
    path('scrape-events/', EventsScapperView.scrape_events),

]

