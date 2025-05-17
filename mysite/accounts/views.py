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


def get_object(self):
    return self.request.user.profile
    
class ActivateAccountView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, uid, token, *args, **kwargs):
        if not uid or not token:
            return Response({"error": "Missing 'uid' or 'token'"}, status=status.HTTP_400_BAD_REQUEST)

        url = "http://localhost:8000/auth/users/activation/"
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
