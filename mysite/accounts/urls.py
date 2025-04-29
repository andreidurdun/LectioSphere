
from django.urls import path
from .views import UserProfileView
from .views import ActivateAccountView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('activate/<str:uid>/<str:token>/', ActivateAccountView.as_view(), name='activate-account'),
]