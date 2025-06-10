from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Shelf, ShelfBooks, Book
from accounts.models import Profile  # <-- dacă folosești Profile

User = get_user_model()

class LibraryPageViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="reader@example.com",
            username="reader",
            password="testpass",
            goal_books=5,
            goal_pages=1000
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Asigură-te că profilul există (dacă nu se creează automat)
        Profile.objects.get_or_create(user=self.user)

        # Raft standard și carte
        self.read_shelf = Shelf.objects.create(user=self.user, name="Read")
        self.book = Book.objects.create(
            title="Sample Book",
            author="Jane Author",
            ISBN="1111222233334",
            genre="Adventure",
            rating=4.2,
            nr_pages=250,
            description="This is a test book"
        )
        ShelfBooks.objects.create(shelf=self.read_shelf, book=self.book)

    def test_reading_challenge_progress(self):
        response = self.client.get("/library/reading_challenge/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["books_read"], 1)
        self.assertEqual(response.data["pages_read"], 250)
        self.assertEqual(response.data["progress_books_percent"], 20)
        self.assertEqual(response.data["progress_pages_percent"], 25)

    def test_update_reading_goals(self):
        response = self.client.post("/library/update_reading_goals/", {
            "goal_books": 10,
            "goal_pages": 2000
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(int(response.data["goal_books"]), 10)
        self.assertEqual(int(response.data["goal_pages"]), 2000)

        # Verificăm și în user
        self.user.refresh_from_db()
        self.assertEqual(self.user.goal_books, 10)
        self.assertEqual(self.user.goal_pages, 2000)

    def test_shelves_structure(self):
        response = self.client.get("/library/shelves/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("standard_shelves", response.data)
        self.assertIn("Read", response.data["standard_shelves"])
        self.assertEqual(len(response.data["standard_shelves"]["Read"]), 1)

    def test_book_status_found(self):
        response = self.client.get("/library/book_status/?isbn=1111222233334")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["in_read"])
        self.assertFalse(response.data["in_reading"])

    def test_book_status_missing_isbn(self):
        response = self.client.get("/library/book_status/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ISBN is required", response.data["error"])

    def test_get_shelf_by_name_success(self):
        response = self.client.get("/library/shelf/Read/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["shelf_name"], "Read")
        self.assertEqual(len(response.data["books"]), 1)

    def test_get_shelf_by_name_not_found(self):
        response = self.client.get("/library/shelf/Nonexistent/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_shelf_success(self):
        response = self.client.post("/library/create_shelf/", {"name": "MyCustomShelf"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["shelf"]["name"], "MyCustomShelf")

    def test_create_shelf_duplicate(self):
        Shelf.objects.create(user=self.user, name="DuplicateShelf")
        response = self.client.post("/library/create_shelf/", {"name": "DuplicateShelf"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shelf_missing_name(self):
        response = self.client.post("/library/create_shelf/", {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_custom_shelf_success(self):
        shelf = Shelf.objects.create(user=self.user, name="DeleteMe")
        response = self.client.delete(f"/library/delete_shelf/{shelf.name}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_standard_shelf_forbidden(self):
        response = self.client.delete("/library/delete_shelf/Read/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Cannot delete standard shelf", response.data["error"])

    def test_delete_shelf_not_found(self):
        response = self.client.delete("/library/delete_shelf/NoSuchShelf/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reading_challenge_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/library/reading_challenge/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
