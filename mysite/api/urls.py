from django.urls import path, re_path, include
from . import views

urlpatterns = [
    path("userprofile/", views.UserListCreate.as_view(), name="userprofile-view-create"),
    path("books/", views.BookListCreate.as_view(), name="book-list-create"),
    path("libraries/", views.LibraryListCreate.as_view(), name="library-list-create"),
    re_path(r'^auth/', include('djoser.urls')),
    re_path(r'^auth/', include('djoser.urls.authtoken')),
]