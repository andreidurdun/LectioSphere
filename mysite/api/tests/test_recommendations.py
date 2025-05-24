from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from unittest.mock import patch
from api.models import Book, Shelf, ShelfBooks
from accounts.models import Profile
from api.models import Post
import numpy as np
from rest_framework.test import force_authenticate
from rest_framework.test import APIClient

User = get_user_model()

class RecommendationGeneralizedTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="tester@test.com", password="pass1234")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # facem un profil
        self.profile = self.user.profile

        self.book1 = Book.objects.create(title='Book 1', description='About machine learning and AI.', rating=5, nr_pages=200, ISBN='1234567890001')
        self.book2 = Book.objects.create(title='Book 2', description='A romantic drama set in Paris.', rating=3, nr_pages=150, ISBN='1234567890002')
        self.book3 = Book.objects.create(title='Book 3', description='Exploring the depths of the ocean.', rating=3, nr_pages=150, ISBN='1234567890003')

        Post.objects.create(user=self.user, book=self.book1, rating=5, description='Loved it!')
        Post.objects.create(user=self.user, book=self.book2, rating=3, description='Pretty good!')

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
        url = reverse("books-recommendation_generalized")  # in functie de router
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn("recommendations", response.data)
     

