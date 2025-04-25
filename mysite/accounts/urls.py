from django.urls import path, include
from django.conf import settings
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, ProfilePartialUpdateView, ProfileCreateView


# Router pentru ViewSet
router = DefaultRouter()
router.register(r'profile', ProfileViewSet, basename='user-profile')

urlpatterns = [
    # ViewSet: /api/accounts/profile/
    path('', include(router.urls)),

    # Rute suplimentare:
    path('profile/update/', ProfilePartialUpdateView.as_view(), name='profile-partial-update'),
    path('profile/create/', ProfileCreateView.as_view(), name='profile-create'),

]
