from django.urls import path, include
from django.conf import settings
from rest_framework.routers import DefaultRouter
from .views import ProfileUpdateView, ProfileReadView, DeleteAccountView, AddFollowerView


# Router pentru ViewSet
router = DefaultRouter()
#router.register(r'profile', ProfileViewSet, basename='user-profile')

urlpatterns = [
    # ViewSet: /api/accounts/profile/
    path('', include(router.urls)),

    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('profile/read/', ProfileReadView.as_view(), name='profile-read'),
    path('profile/delete/', DeleteAccountView.as_view(), name='profile-delete'),
    path('profile/<int:pk>/follow/', AddFollowerView.as_view(), name='add-follower'),

]
