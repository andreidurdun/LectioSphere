from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Shelf, ShelfBooks, Book
from accounts.models import Profile
from rest_framework.test import force_authenticate
from rest_framework.test import APIClient

User = get_user_model()

class GetFriendsBooksTestCase(APITestCase):
    def setUp(self):
        # Creăm utilizatorul curent
        self.user = User.objects.create_user(
            email="testuser@example.com",
            password="testpassword",
            first_name="Test",
            last_name="User"
        )
        self.profile, _ = Profile.objects.get_or_create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Creăm un utilizator prieten
        self.friend = User.objects.create_user(
            email="friend@example.com",
            password="friendpassword",
            first_name="Friend",
            last_name="User"
        )
        self.friend_profile, _ = Profile.objects.get_or_create(user=self.friend)

        # Adăugăm prietenul la lista de urmăriți
        self.profile.following.add(self.friend_profile)

        # Creăm raftul "Read" pentru prieten
        self.friend_shelf = Shelf.objects.create(user=self.friend, name="Read")

        # Creăm o carte și o adăugăm în raftul prietenului
        self.book = Book.objects.create(
            title="Example Book",
            author="John Doe",
            ISBN="9781234567894",
            genre="Fiction",
            rating=4.5,
            nr_pages=300,
            description="This is an example book description."
        )
        ShelfBooks.objects.create(shelf=self.friend_shelf, book=self.book)

        # autentificam fortat userul curent
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_friends_books(self):
        # Trimitem cererea GET către endpoint
        response = self.client.get("/api/books/get_friends_books/")

        # Verificăm răspunsul
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Example Book")
        self.assertEqual(response.data[0]["author"], "John Doe")
        self.assertEqual(response.data[0]["ISBN"], "9781234567894")