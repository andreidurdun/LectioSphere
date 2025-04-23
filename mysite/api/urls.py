from django.urls import path, re_path, include
from . import views
from .views import GoogleBooksAPIView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'books', GoogleBooksAPIView, basename='books') # ia automat numele metodelor ca ruta (ex: books/search/parametrii)

urlpatterns = [

    path('api/', include(router.urls)),
]