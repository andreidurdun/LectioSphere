from django.urls import path, include
from django.conf import settings
from rest_framework.routers import DefaultRouter
from .views import ProfileUpdateView, ProfileReadView, DeleteAccountView, AddFollowerView, ActivateAccountView, ProfileSearchView, RemoveFollowerView, IsFollowingView, ProfileDetailView


# Router pentru ViewSet
router = DefaultRouter()

urlpatterns = [
    # ViewSet: /api/accounts/profile/
    path('', include(router.urls)),

    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('profile/read/', ProfileReadView.as_view(), name='profile-read'),
    path('profile/delete/', DeleteAccountView.as_view(), name='profile-delete'),
    path('profile/<int:pk>/follow/', AddFollowerView.as_view(), name='add-follower'),
    path('profiles/search/', ProfileSearchView.as_view(), name='search-users'),
    path('profile/<int:pk>/unfollow/', RemoveFollowerView.as_view(), name='remove-follower'),
    path('profile/<int:pk>/is-following/', IsFollowingView.as_view(), name='is-following'),
    path('profile/<int:pk>/details/', ProfileDetailView.as_view(), name='profile-detail'),


]
