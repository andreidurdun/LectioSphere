from django.urls import path, re_path, include
from .views import views
from .views import GoogleBooksAPIView

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

]