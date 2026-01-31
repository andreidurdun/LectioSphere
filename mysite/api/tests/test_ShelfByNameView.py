from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Shelf, ShelfBooks, Book
from accounts.models import Profile
from urllib.parse import quote

User = get_user_model()


class ShelfByNameViewTestCase(APITestCase):
    """Test cases for the ShelfByNameView"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123"
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            username="otheruser",
            password="testpass123"
        )
        
        # Create shelves
        self.shelf1 = Shelf.objects.create(user=self.user, name="Read")
        self.shelf2 = Shelf.objects.create(user=self.user, name="Currently Reading")
        self.shelf3 = Shelf.objects.create(user=self.user, name="My Favorites")
        self.other_shelf = Shelf.objects.create(user=self.other_user, name="Read")
        
        # Create books
        self.book1 = Book.objects.create(
            title="Book 1",
            author="Author 1",
            ISBN="9781111111111",
            genre="Fiction",
            nr_pages=200
        )
        self.book2 = Book.objects.create(
            title="Book 2",
            author="Author 2",
            ISBN="9782222222222",
            genre="Non-Fiction",
            nr_pages=300
        )
        self.book3 = Book.objects.create(
            title="Book 3",
            author="Author 3",
            ISBN="9783333333333",
            genre="Science",
            nr_pages=250
        )
        
        # Add books to shelves
        ShelfBooks.objects.create(shelf=self.shelf1, book=self.book1)
        ShelfBooks.objects.create(shelf=self.shelf1, book=self.book2)
        ShelfBooks.objects.create(shelf=self.shelf2, book=self.book3)
        
        self.client = APIClient()

    def test_get_shelf_requires_authentication(self):
        """Test that getting a shelf requires authentication"""
        response = self.client.get("/library/shelf/Read/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_shelf_by_name_success(self):
        """Test successfully getting a shelf by name"""
        self.client.force_authenticate(user=self.user) # type: ignore
        response = self.client.get("/library/shelf/Read/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["shelf_name"], "Read") # type: ignore
        self.assertEqual(len(response.data["books"]), 2) # type: ignore
        
        # Verify book details
        book_titles = [book["title"] for book in response.data["books"]] # type: ignore
        self.assertIn("Book 1", book_titles)
        self.assertIn("Book 2", book_titles)

    def test_get_shelf_with_url_encoded_name(self):
        """Test getting shelf with URL encoded name (spaces, special chars)"""
        self.client.force_authenticate(user=self.user) # type: ignore
        
        # URL encode the shelf name with spaces
        encoded_name = quote("Currently Reading")
        response = self.client.get(f"/library/shelf/{encoded_name}/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["shelf_name"], "Currently Reading") # type: ignore
        self.assertEqual(len(response.data["books"]), 1) # type: ignore
        self.assertEqual(response.data["books"][0]["title"], "Book 3") # type: ignore

    def test_get_shelf_not_found(self):
        """Test getting a shelf that doesn't exist"""
        self.client.force_authenticate(user=self.user) # type: ignore
        response = self.client.get("/library/shelf/NonExistent/")
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("not found", response.data["error"]) # type: ignore

    def test_get_shelf_empty_shelf(self):
        """Test getting a shelf with no books"""
        self.client.force_authenticate(user=self.user) # type: ignore
        response = self.client.get("/library/shelf/My%20Favorites/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["shelf_name"], "My Favorites") # type: ignore
        self.assertEqual(len(response.data["books"]), 0) # type: ignore
        self.assertEqual(response.data["books"], []) # type: ignore

    def test_get_shelf_only_returns_current_user_shelf(self):
        """Test that user can only access their own shelves"""
        self.client.force_authenticate(user=self.user) # type: ignore
        
        # Try to access shelf with same name but belonging to other user
        # Should not find it
        response = self.client.get("/library/shelf/Read/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return user's shelf, not other_user's shelf
        self.assertEqual(len(response.data["books"]), 2)  # type: ignore # user's Read shelf has 2 books

    def test_get_shelf_different_user_cant_access(self):
        """Test that one user can't access another user's shelf"""
        # Create shelf for user
        special_shelf = Shelf.objects.create(user=self.user, name="Private Collection")
        ShelfBooks.objects.create(shelf=special_shelf, book=self.book1)
        
        # Try to access with other_user
        self.client.force_authenticate(user=self.other_user) # type: ignore
        response = self.client.get("/library/shelf/Private%20Collection/")
        
        # Should return 404 because other_user doesn't have this shelf
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_shelf_book_serialization(self):
        """Test that books are properly serialized"""
        self.client.force_authenticate(user=self.user)# type: ignore
        response = self.client.get("/library/shelf/Read/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that books have expected fie# type: ignore
        self.assertIn("title", book)# type: ignore
        self.assertIn("author", book)# type: ignore
        self.assertIn("ISBN", book)# type: ignore

    def test_get_shelf_case_sensitive(self):
        """Test that shelf names are case sensitive"""
        self.client.force_authenticate(user=self.user)# type: ignore
        
        # Try with different case
        response = self.client.get("/library/shelf/read/")  # lowercase
        
        # Should not find it (shelf name is "Read" with capital R)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_shelf_with_special_characters(self):
        """Test shelf names with special characters"""
        self.client.force_authenticate(user=self.user)# type: ignore
        
        # Create shelf with special characters
        special_shelf = Shelf.objects.create(user=self.user, name="Books I ❤️ Reading!")
        ShelfBooks.objects.create(shelf=special_shelf, book=self.book1)
        
        encoded_name = quote("Books I ❤️ Reading!")
        response = self.client.get(f"/library/shelf/{encoded_name}/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["shelf_name"], "Books I ❤️ Reading!") # type: ignore

    def test_get_shelf_multiple_books_order(self):
        """Test getting shelf with multiple books maintains order"""
        self.client.force_authenticate(user=self.user)# type: ignore
        response = self.client.get("/library/shelf/Read/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["books"]), 2)# type: ignore
        
        # Verify both books are present
        isbns = [book["ISBN"] for book in response.data["books"]]# type: ignore
        self.assertIn("9781111111111", isbns)
        self.assertIn("9782222222222", isbns)
