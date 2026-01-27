from django.shortcuts import render
from rest_framework import generics, permissions
from .models import Profile
from .serializers import ProfileSerializer
from rest_framework.response import Response
import requests
from rest_framework import status
from rest_framework import serializers, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Profile 
from .models import UserAccount  
from .serializers import ProfileSerializer 
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from IPADDRESS import getIP
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
import os
import logging
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


def get_object(self):
    return self.request.user.profile
    
class ActivateAccountView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, uid, token, *args, **kwargs):
        if not uid or not token:
            return Response({"error": "Missing 'uid' or 'token'"}, status=status.HTTP_400_BAD_REQUEST)

        url = "http://" + getIP() + ":8000/auth/users/activation/"
        payload = {
            "uid": uid,
            "token": token
        }

        try:
            response = requests.post(url, json=payload)
            if response.status_code == 204:
                return Response({"success": "Account activated successfully"}, status=status.HTTP_200_OK)
            elif response.status_code == 403:
                return Response({"error": "Activation link is invalid or expired"}, status=status.HTTP_403_FORBIDDEN) 
            else:
                return Response({"error": "Activation failed"}, status=response.status_code)
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# obtinem profilul utilizatorului curent
class ProfileReadView(APIView):

    # utilizatorul trebuie sa fie autentificat
    permission_classes = [IsAuthenticated]  

    def get(self, request):
    
        profile = request.user.profile
        serializer = ProfileSerializer(profile)  
        return Response({"detail": "Profile retrieved successfully.", "profile": serializer.data},status=status.HTTP_200_OK)
        
   


# facem update la profilul utilizatorului curent 
class ProfileUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Profile updated successfully.", "data": serializer.data},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": "Invalid data.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

# stergem contul utilizatorului curent
# daca stergem profilul, se va sterge si userul din baza de date
class DeleteAccountView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        request.user.delete()
        return Response({"detail": "Account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)



# # adaugam un follower la utilizatorul curent
class AddFollowerView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        user_to_follow = Profile.objects.get(id=pk)
        current_user_profile = request.user.profile

        if current_user_profile == user_to_follow:
            return Response({"detail": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        user_to_follow.followers.add(current_user_profile)
        return Response({"detail": "You are now following this user."}, status=status.HTTP_200_OK)








# dam unfollow
# eliminăm un follower de la utilizatorul curent
class RemoveFollowerView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            user_to_unfollow = Profile.objects.get(id=pk)
        except Profile.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        current_user_profile = request.user.profile

        if current_user_profile == user_to_unfollow:
            return Response({"detail": "You cannot unfollow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        if current_user_profile in user_to_unfollow.followers.all():
            user_to_unfollow.followers.remove(current_user_profile)
            return Response({"detail": "You have unfollowed this user."}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "You are not following this user."}, status=status.HTTP_400_BAD_REQUEST)


# vedem daca urmareste sau nu pe cineva 
class IsFollowingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            target_profile = Profile.objects.get(id=pk)
        except Profile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        current_user_profile = request.user.profile
        is_following = current_user_profile in target_profile.followers.all()

        return Response({"is_following": is_following}, status=status.HTTP_200_OK)


# obtinem lista de followers
class FollowersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        # If pk is provided, get followers of that profile, else get followers of current user
        if pk:
            try:
                profile = Profile.objects.get(id=pk)
            except Profile.DoesNotExist:
                return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            profile = request.user.profile
        
        followers = profile.followers.all()
        current_user_profile = request.user.profile
        
        # Add is_following_back field to each follower
        followers_data = []
        for follower in followers:
            follower_serialized = ProfileSerializer(follower).data
            # Check if current user follows them back
            is_following_back = follower in current_user_profile.following.all()
            follower_serialized['is_following_back'] = is_following_back
            followers_data.append(follower_serialized)
        
        return Response({"followers": followers_data}, status=status.HTTP_200_OK)


# obtinem lista de following
class FollowingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        # If pk is provided, get following of that profile, else get following of current user
        if pk:
            try:
                profile = Profile.objects.get(id=pk)
            except Profile.DoesNotExist:
                return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            profile = request.user.profile
        
        following = profile.following.all()
        current_user_profile = request.user.profile
        
        # Add is_following field to each user being followed
        following_data = []
        for followed_user in following:
            followed_serialized = ProfileSerializer(followed_user).data
            # Check if current user follows them
            is_following = followed_user in current_user_profile.following.all()
            followed_serialized['is_following'] = is_following
            following_data.append(followed_serialized)
        
        return Response({"following": following_data}, status=status.HTTP_200_OK)


# obtinem lista de mutual friends (friends = people who follow each other)
class MutualFriendsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_user_profile = request.user.profile
        
        # Get users that current user follows
        following = current_user_profile.following.all()
        
        # Filter to get only mutual friends (those who follow back)
        mutual_friends = []
        for profile in following:
            if current_user_profile in profile.following.all():
                mutual_friends.append(profile)
        
        serializer = ProfileSerializer(mutual_friends, many=True)
        return Response({"friends": serializer.data}, status=status.HTTP_200_OK)


# vedem info despre un profil dat dupa id 
class ProfileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            profile = Profile.objects.get(id=pk)
        except Profile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)










# Motor de cautare pentru puseri 
class ProfileSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip().lower()
        username = request.query_params.get('username', '').strip().lower()
        first_name = request.query_params.get('first_name', '').strip().lower()
        last_name = request.query_params.get('last_name', '').strip().lower()

        if not any([query, username, first_name, last_name]):
            return Response({"error": "Provide at least one search parameter (?q=..., ?username=..., ?first_name=..., ?last_name=...)"},
                            status=status.HTTP_400_BAD_REQUEST)

        current_profile = request.user.profile

        filters = Q()
        if query:
            filters |= Q(user__username__icontains=query)
            filters |= Q(user__first_name__icontains=query)
            filters |= Q(user__last_name__icontains=query)
        if username:
            filters |= Q(user__username__icontains=username)
        if first_name:
            filters |= Q(user__first_name__icontains=first_name)
        if last_name:
            filters |= Q(user__last_name__icontains=last_name)

        matching_profiles = Profile.objects.filter(filters).exclude(user=request.user).distinct()

        mutuals = []
        following_only = []
        others = []

        for profile in matching_profiles:
            if profile in current_profile.followers.all() and profile in current_profile.following.all():
                mutuals.append(profile)
            elif profile in current_profile.following.all():
                following_only.append(profile)
            else:
                others.append(profile)

        ordered_profiles = mutuals + following_only + others
        serializer = ProfileSerializer(ordered_profiles, many=True)
        return Response({"results": serializer.data}, status=status.HTTP_200_OK)


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'http://localhost:8000'
    client_class = OAuth2Client


class GoogleExchangeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Accept either an access_token, an id_token, or an authorization code
        code = request.data.get('code')
        redirect_uri = request.data.get('redirect_uri')
        access_token = request.data.get('access_token')
        id_token = request.data.get('id_token')

        client_id = os.environ.get('GOOGLE_CLIENT_ID')
        client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')

        if not client_id:
            return Response({'error': 'Server misconfiguration: missing Google client id'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        userinfo = None

        # 1) If id_token is provided, validate it via Google's tokeninfo endpoint
        if id_token:
            try:
                tokeninfo_resp = requests.get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': id_token})
            except requests.exceptions.RequestException as e:
                logger.exception('Error validating id_token with Google: %s', e)
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            if tokeninfo_resp.status_code != 200:
                logger.warning('Google id_token validation failed: status=%s body=%s', tokeninfo_resp.status_code, tokeninfo_resp.text)
                return Response(tokeninfo_resp.json(), status=tokeninfo_resp.status_code)

            tokeninfo = tokeninfo_resp.json()
            # Verify audience matches our client_id
            aud = tokeninfo.get('aud') or tokeninfo.get('azp')
            if aud != client_id:
                logger.warning('id_token audience mismatch: expected=%s got=%s', client_id, aud)
                return Response({'error': 'Invalid id_token audience'}, status=status.HTTP_400_BAD_REQUEST)

            userinfo = {
                'email': tokeninfo.get('email'),
                'given_name': tokeninfo.get('given_name'),
                'family_name': tokeninfo.get('family_name')
            }

        # 2) If access_token is provided, fetch userinfo
        elif access_token:
            try:
                userinfo_resp = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers={'Authorization': f'Bearer {access_token}'})
            except requests.exceptions.RequestException as e:
                logger.exception('Error requesting userinfo from Google: %s', e)
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            if userinfo_resp.status_code != 200:
                logger.warning('Google userinfo fetch failed: status=%s body=%s', userinfo_resp.status_code, userinfo_resp.text)
                return Response(userinfo_resp.json(), status=userinfo_resp.status_code)

            userinfo = userinfo_resp.json()

        # 3) Otherwise, fall back to exchanging authorization code for tokens
        elif code:
            if not client_secret:
                return Response({'error': 'Server misconfiguration: missing Google client secret for code exchange'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            token_url = 'https://oauth2.googleapis.com/token'
            data = {
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            }

            try:
                token_resp = requests.post(token_url, data=data)
            except requests.exceptions.RequestException as e:
                logger.exception('Error requesting token from Google: %s', e)
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            if token_resp.status_code != 200:
                logger.warning('Google token exchange failed: status=%s body=%s', token_resp.status_code, token_resp.text)
                return Response(token_resp.json(), status=token_resp.status_code)

            token_json = token_resp.json()
            logger.debug('Google token response: %s', token_json)
            access_token = token_json.get('access_token')

            if not access_token:
                return Response({'error': 'No access token returned by Google', 'details': token_json}, status=status.HTTP_400_BAD_REQUEST)

            try:
                userinfo_resp = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers={'Authorization': f'Bearer {access_token}'})
            except requests.exceptions.RequestException as e:
                logger.exception('Error requesting userinfo from Google after token exchange: %s', e)
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            if userinfo_resp.status_code != 200:
                logger.warning('Google userinfo fetch failed after token exchange: status=%s body=%s', userinfo_resp.status_code, userinfo_resp.text)
                return Response(userinfo_resp.json(), status=userinfo_resp.status_code)

            userinfo = userinfo_resp.json()

        else:
            logger.warning('GoogleExchangeView called without credentials; request.data=%s', request.data)
            return Response({'error': 'Missing credentials: provide id_token, access_token, or code'}, status=status.HTTP_400_BAD_REQUEST)

        email = userinfo.get('email')
        first_name = userinfo.get('given_name', '')
        last_name = userinfo.get('family_name', '')

        if not email:
            return Response({'error': 'No email returned from Google', 'userinfo': userinfo}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create user
        user_created = False
        try:
            user = UserAccount.objects.get(email=email)
        except UserAccount.DoesNotExist:
            # Ensure unique username
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while UserAccount.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            try:
                user = UserAccount.objects.create_user(
                    email=email, 
                    password=None, 
                    username=username, 
                    first_name=first_name or username, 
                    last_name=last_name or ''
                )
                user_created = True
                logger.info(f'Created new user via Google: {email}')
            except Exception as e:
                logger.exception(f'Error creating user via Google: {e}')
                return Response({'error': 'Failed to create user account'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # The profile and shelves are created by signals, but let's ensure they exist
        # Wait a moment for signals to complete if user was just created
        if user_created:
            import time
            time.sleep(0.1)  # Small delay to let signals complete
        
        # Verify profile exists (should be created by signal)
        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            logger.warning(f'Profile not found for user {email}, creating manually')
            profile = Profile.objects.create(user=user)

        # Create JWT tokens for the user
        try:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token), 
                'refresh': str(refresh)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f'Error creating JWT tokens: {e}')
            return Response({'error': 'Failed to generate authentication tokens'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
