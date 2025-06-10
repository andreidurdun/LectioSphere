from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import ReadingSheet, Book, Shelf

User = get_user_model()

class ReadingSheetsViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass"
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.shelf1 = Shelf.objects.create(name="Raft 1", user=self.user)
        self.shelf2 = Shelf.objects.create(name="Raft 2", user=self.user)

        self.books = [
            Book.objects.create(
                title=f"Carte {i}",
                author=f"Autor {i}",
                nr_pages=100,
                rating=4.5,
                ISBN=f"97800000000{i}",
                description="Carte de test"
            )
            for i in range(6)
        ]

        for i, book in enumerate(self.books):
            shelf = self.shelf1 if i % 2 == 0 else self.shelf2
            ReadingSheet.objects.create(user=self.user, book=book, shelf=shelf)

    def test_list_grouped_by_shelf(self):
        response = self.client.get("/api/reading-sheets/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("Raft 1", data)
        self.assertIn("Raft 2", data)

    def test_get_latest_titles_authors(self):
        response = self.client.get("/api/reading-sheets/latest/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 5)
        for entry in data:
            self.assertIn("title", entry)
            self.assertIn("author", entry)

    def test_get_all_titles_authors(self):
        response = self.client.get("/api/reading-sheets/simple/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 6)
        for entry in data:
            self.assertIn("title", entry)
            self.assertIn("author", entry)
