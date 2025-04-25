from rest_framework import serializers, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Profile 
from .models import UserAccount  
from .serializers import ProfileSerializer 
from rest_framework.response import Response


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
            return Response({"detail": "Profile updated successfully."}, serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid data."}, serializer.errors, status=status.HTTP_400_BAD_REQUEST)



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