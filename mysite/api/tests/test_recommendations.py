from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from unittest.mock import patch
from api.models import Book, Shelf, ShelfBooks
from accounts.models import Profile
import numpy as np
from rest_framework.test import force_authenticate
from rest_framework.test import APIClient

User = get_user_model()

class RecommendationGeneralizedTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="tester@test.com", password="pass1234")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # facem un profil cu embedding random
        self.profile = self.user.profile
        self.profile.embedding = np.random.rand(384).tolist()

        # adaugam o carte citita
        self.book = Book.objects.create(title="Read Book", genre="fiction", ISBN="123", rating=4.5, description="A great book.", nr_pages=300)
        shelf = Shelf.objects.create(user=self.user, name="Read")
        ShelfBooks.objects.create(shelf=shelf, book=self.book)

    @patch("requests.get")
    def test_recommendation_generalized(self, mock_get):
        # Mock pentru Google Books API = nu trimite cererea reala
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "items": [
                {
                    "id": "book1",
                    "volumeInfo": {
                        "title": "New Book 1",
                        "description": "A great book.",
                        "publishedDate": "2020-01-01"
                    }
                },
                {
                    "id": "book2",
                    "volumeInfo": {
                        "title": "Read Book", 
                        "description": "Already read.",
                        "publishedDate": "2019-01-01"
                    }
                }
            ]
        }

        # apelam endpointul
        url = reverse("books-recommendation_generalized")  # în funcție de router
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn("recommendations", response.data)
     

