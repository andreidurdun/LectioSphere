from django.urls import path, re_path, include
#from .views import views
from .views import GoogleBooksAPIView
from .views import BooksView
from .views import PostsView
from .views import EventsScapperView
from api.views.NotificationsView import NotificationsView
from api.views.ShelfByNameView import ShelfByNameView  # ✅ corect
from api.views.BooksWebScrapperView import BooksWebScrapperView  # Import the missing view
from api.views.BookShareView import ShareBookView

from api.views.ReadingSheetsView import ReadingSheetsView
from api.views.LibraryPageView import LibraryPageView

from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"posts", PostsView, basename="posts")
router.register(r"library", LibraryPageView, basename="library")

urlpatterns = [
    # --- BOOKS ---
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

   path('posts/reviews/followed/<str:book_id>/', PostsView.as_view({"get": "reviews_for_followed_users"}), name='reviews-for-followed-users'),
   path('posts/reviews/<str:book_id>/', PostsView.as_view({"get": "reviews_for_book"}), name='reviews-for-book'),
   path('posts/user/<int:profile_id>/', PostsView.as_view({"get": "posts_for_user"}), name='posts-for-user'),
   path("posts/post_type/<int:profile_id>/", PostsView.as_view({"get": "post_type_posts_for_user"}), name="post-type-posts-for-user"),
   path("posts/non_post_type/<int:profile_id>/", PostsView.as_view({"get": "non_post_type_posts_for_user"}), name="non-post-type-posts-for-user"),



   # urls notificari 
   path("notifications/", NotificationsView.as_view({"get": "list"}), name="list-notifications"),
   path("notifications/<int:pk>/", NotificationsView.as_view({"delete": "destroy"}), name="delete-notification"),
   
   # urls book sharing
   path("books/share/", ShareBookView.as_view(), name="share-book"),








    
    path("posts/<int:pk>/add_comment/", PostsView.as_view({"post": "add_comment"}), name="add-comment"),
    path("posts/<int:pk>/list_comments/", PostsView.as_view({"get": "list_comments"}), name="list-comments"),
    path("posts/<int:pk>/has_liked/", PostsView.as_view({"get": "has_liked"}), name="has-liked"),

    # --- LIBRARY ---
    path("library/add_book_to_shelf/<str:shelf_name>/", LibraryPageView.as_view({"post": "add_book_to_shelf"}), name="add-book-to-shelf"),
    path("library/", LibraryPageView.as_view({"get": "list"}), name="library-page"),
    path("library/delete_shelf/<str:name>/", LibraryPageView.as_view({"delete": "delete_shelf"}), name="delete-shelf"),
    path("library/reading_challenge/", LibraryPageView.as_view({"get": "reading_challenge"})),
    path("library/shelves/", LibraryPageView.as_view({"get": "shelves"})),
    path("library/book_status/", LibraryPageView.as_view({"get": "book_status"})),

    # ⚠️ ai doua rute identice pt library/shelf/<name>/ — alege una!
    # path("library/shelf/<str:name>/", LibraryPageView.as_view({"get": "get_shelf_by_name"}), name="library-shelf"),
    path("library/shelf/<str:name>/", ShelfByNameView.as_view(), name="shelf-by-name"),

    # --- SCRAPE ---
    path("scrape-books/", BooksWebScrapperView.as_view(), name="scrape_books"),
    path("scrape-events/", EventsScapperView.scrape_events),
    path("scrape-events/<int:event_id>/", EventsScapperView.scrape_event_by_id),

    # --- READING SHEETS (manual, ca la posts) ---
    path("reading-sheets/", ReadingSheetsView.as_view({"get": "list_sheets"}), name="list-reading-sheets"),
    path("reading-sheets/add/", ReadingSheetsView.as_view({"post": "add_sheet"}), name="add-reading-sheet"),
    path("reading-sheets/<int:pk>/", ReadingSheetsView.as_view({"get": "read_sheet"}), name="read-reading-sheet"),
    path("reading-sheets/<int:pk>/update/", ReadingSheetsView.as_view({"put": "update_sheet", "patch": "update_sheet"}), name="update-reading-sheet"),
    path("reading-sheets/<int:pk>/delete/", ReadingSheetsView.as_view({"delete": "delete_sheet"}), name="delete-reading-sheet"),
    path("reading-sheets/latest/", ReadingSheetsView.as_view({"get": "latest"}), name="latest-reading-sheets"),
    path("reading-sheets/simple/", ReadingSheetsView.as_view({"get": "simple"}), name="simple-reading-sheets"),

    # router (daca chiar ai nevoie de el; optional)
    path("api/", include(router.urls)),
    
    path("reading-sheets/basic/", ReadingSheetsView.as_view({"post": "create_basic"})),
    path("reading-sheets/book_review/", ReadingSheetsView.as_view({"post": "create_model1"})),
    path("reading-sheets/reading_notes/", ReadingSheetsView.as_view({"post": "create_model2"})),
    path("reading-sheets/reading_reflections/", ReadingSheetsView.as_view({"post": "create_model3"})),

   path("reading-sheets/", ReadingSheetsView.as_view({"get": "list_sheets"})),
path("reading-sheets/<int:pk>/", ReadingSheetsView.as_view({"get": "read_sheet"})),
path("reading-sheets/<int:pk>/update/", ReadingSheetsView.as_view({"put": "update_sheet", "patch": "update_sheet"})),
path("reading-sheets/<int:pk>/delete/", ReadingSheetsView.as_view({"delete": "delete_sheet"})),

# create pe modele
path("reading-sheets/basic/", ReadingSheetsView.as_view({"post": "create_basic"})),
path("reading-sheets/book-review/", ReadingSheetsView.as_view({"post": "create_book_review"})),
path("reading-sheets/reading-notes/", ReadingSheetsView.as_view({"post": "create_reading_notes"})),
path("reading-sheets/reading-reflections/", ReadingSheetsView.as_view({"post": "create_reading_reflections"})),

]
