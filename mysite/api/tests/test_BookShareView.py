from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Notification, Book
from accounts.models import Profile
from unittest.mock import patch

User = get_user_model()


class ShareBookViewTestCase(APITestCase):
    """Test cases for the ShareBookView"""

    def setUp(self):
        """Set up test data"""
        # Create users
        self.user1 = User.objects.create_user(
            email="user1@example.com",
            username="user1",
            password="testpass123"
        )
        self.user2 = User.objects.create_user(
            email="user2@example.com",
            username="user2",
            password="testpass123"
        )
        self.user3 = User.objects.create_user(
            email="user3@example.com",
            username="user3",
            password="testpass123"
        )

        # Get profiles
        self.profile1 = Profile.objects.get(user=self.user1)
        self.profile2 = Profile.objects.get(user=self.user2)
        self.profile3 = Profile.objects.get(user=self.user3)

        # Create a book
        self.book = Book.objects.create(
            title="Test Book",
            author="Test Author",
            ISBN="9781234567890",
            genre="Fiction",
            rating=4.5,
            nr_pages=300
        )

        self.client = APIClient()
        self.url = "/books/share/"

    def test_share_book_requires_authentication(self):
        """Test that sharing a book requires authentication"""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_share_book_missing_recipient_id(self):
        """Test sharing a book without recipient_id"""
        self.client.force_authenticate(user=self.user1) # type: ignore
        response = self.client.post(self.url, {
            "book_id": str(self.book.id)
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("recipient_id and book_id are required", response.data["detail"]) # type: ignore

    def test_share_book_missing_book_id(self):
        """Test sharing a book without book_id"""
        self.client.force_authenticate(user=self.user1) # type: ignore
        response = self.client.post(self.url, {
            "recipient_id": self.user2.id # type: ignore
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("recipient_id and book_id are required", response.data["detail"]) # type: ignore

    def test_share_book_recipient_not_found(self):
        """Test sharing a book with non-existent recipient"""
        self.client.force_authenticate(user=self.user1) # type: ignore
        response = self.client.post(self.url, {
            "recipient_id": 99999,
            "book_id": str(self.book.id)
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Recipient user not found", response.data["detail"]) # type: ignore

    def test_share_book_not_mutual_friends(self):
        """Test sharing a book with non-mutual friend"""
        self.client.force_authenticate(user=self.user1) # type: ignore
        
        # user1 follows user2, but user2 doesn't follow user1
        self.profile1.following.add(self.profile2) # type: ignore
        
        response = self.client.post(self.url, {
            "recipient_id": self.user2.id, # type: ignore
            "book_id": str(self.book.id),
            "book_title": self.book.title
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("mutual friends", response.data["detail"]) # type: ignore

    def test_share_book_success_with_database_book(self):
        """Test successfully sharing a book from database"""
        self.client.force_authenticate(user=self.user1) # type: ignore
        
        # Make them mutual friends
        self.profile1.following.add(self.profile2) # type: ignore
        self.profile2.following.add(self.profile1) # type: ignore
        
        response = self.client.post(self.url, {
            "recipient_id": self.user2.id,# type: ignore
            "book_id": str(self.book.id),
            "book_title": self.book.title,
            "book_author": self.book.author
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("Book shared successfully", response.data["detail"])# type: ignore
        self.assertIn("notification_id", response.data)# type: ignore
        
        # Verify notification was created
        notification = Notification.objects.get(id=response.data["notification_id"])# type: ignore
        self.assertEqual(notification.user, self.user2)
        self.assertEqual(notification.sender, self.user1)
        self.assertEqual(notification.notification_type, "book_share")
        self.assertIn(self.user1.username, notification.message)# type: ignore

    def test_share_book_success_with_external_book_id(self):
        """Test successfully sharing an external book (Google Books ID)"""
        self.client.force_authenticate(user=self.user1)# type: ignore
        
        # Make them mutual friends
        self.profile1.following.add(self.profile2)# type: ignore
        self.profile2.following.add(self.profile1)# type: ignore
        
        response = self.client.post(self.url, {
            "recipient_id": self.user2.id,# type: ignore
            "book_id": "google_book_id_123",
            "book_title": "External Book",
            "book_author": "External Author",
            "book_cover": "https://example.com/cover.jpg"
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("Book shared successfully", response.data["detail"])# type: ignore
        
        # Verify notification was created with external book info
        notification = Notification.objects.get(id=response.data["notification_id"])# type: ignore
        self.assertEqual(notification.external_book_id, "google_book_id_123")
        self.assertEqual(notification.external_book_title, "External Book")

    def test_share_book_creates_notification_with_message(self):
        """Test that sharing creates notification with proper message"""
        self.client.force_authenticate(user=self.user1)# type: ignore
        
        # Make them mutual friends
        self.profile1.following.add(self.profile2)# type: ignore
        self.profile2.following.add(self.profile1)# type: ignore
        
        book_title = "Amazing Book"
        response = self.client.post(self.url, {
            "recipient_id": self.user2.id,# type: ignore
            "book_id": "test_id",
            "book_title": book_title
        })
        
        notification = Notification.objects.get(id=response.data["notification_id"]) # type: ignore
        expected_message = f"{self.user1.username} sent you {book_title}"
        self.assertEqual(notification.message, expected_message)

    def test_share_book_with_default_book_title(self):
        """Test sharing without book_title uses default"""
        self.client.force_authenticate(user=self.user1) # type: ignore
        
        # Make them mutual friends
        self.profile1.following.add(self.profile2)# type: ignore
        self.profile2.following.add(self.profile1) # type: ignore
        
        response = self.client.post(self.url, {
            "recipient_id": self.user2.id,# type: ignore
            "book_id": "test_id"
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        notification = Notification.objects.get(id=response.data["notification_id"]) # type: ignore
        self.assertIn("a book", notification.message)# type: ignore

    def test_share_book_multiple_times(self):
        """Test sharing books multiple times creates separate notifications"""
        self.client.force_authenticate(user=self.user1) # type: ignore
        
        # Make them mutual friends
        self.profile1.following.add(self.profile2)# type: ignore
        self.profile2.following.add(self.profile1)# type: ignore
        
        # Share first book
        response1 = self.client.post(self.url, {
            "recipient_id": self.user2.id, # type: ignore
            "book_id": "book1",
            "book_title": "Book 1"
        })
        
        # Share second book
        response2 = self.client.post(self.url, {
            "recipient_id": self.user2.id,# type: ignore
            "book_id": "book2",
            "book_title": "Book 2"
        })
        
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response1.data["notification_id"], response2.data["notification_id"]) # type: ignore
        
        # Verify two separate notifications exist
        notifications = Notification.objects.filter(user=self.user2)
        self.assertEqual(notifications.count(), 2)

    def test_share_book_with_numeric_book_id(self):
        """Test sharing book with numeric string book_id"""
        self.client.force_authenticate(user=self.user1) # type: ignore
        
        # Make them mutual friends
        self.profile1.following.add(self.profile2) # type: ignore
        self.profile2.following.add(self.profile1) # type: ignore
        
        response = self.client.post(self.url, {
            "recipient_id": self.user2.id,# type: ignore
            "book_id": str(self.book.id),
            "book_title": "Test"
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
