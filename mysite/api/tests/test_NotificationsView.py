from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Notification
from accounts.models import Profile
from django.utils import timezone

User = get_user_model()


class NotificationsViewTestCase(APITestCase):
    """Test cases for the NotificationsView"""

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
        
        # Create notifications
        self.notif1 = Notification.objects.create(
            user=self.user,
            notification_type="follow",
            sender=self.other_user,
            message="User started following you",
            is_deleted=False
        )
        self.notif2 = Notification.objects.create(
            user=self.user,
            notification_type="like",
            sender=self.other_user,
            message="User liked your post",
            is_deleted=False
        )
        self.notif3 = Notification.objects.create(
            user=self.user,
            notification_type="comment",
            sender=self.other_user,
            message="User commented on your post",
            is_deleted=True  # This one is deleted
        )
        # Notification for other user
        self.other_notif = Notification.objects.create(
            user=self.other_user,
            notification_type="follow",
            sender=self.user,
            message="You have a new follower",
            is_deleted=False
        )
        
        self.client = APIClient()

    def test_list_notifications_requires_authentication(self):
        """Test that listing notifications requires authentication"""
        response = self.client.get("/notifications/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_notifications_success(self):
        """Test successfully listing user's notifications"""
        self.client.force_authenticate(user=self.user) # type: ignore
        response = self.client.get("/notifications/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return only non-deleted notifications
        self.assertEqual(len(response.data), 2) # type: ignore
        
        # Verify notifications are for current user
        notification_ids = [n["id"] for n in response.data] # type: ignore
        self.assertIn(self.notif1.id, notification_ids) # type: ignore
        self.assertIn(self.notif2.id, notification_ids) # type: ignore
        self.assertNotIn(self.notif3.id, notification_ids)  # type: ignore # deleted
        self.assertNotIn(self.other_notif.id, notification_ids)  # type: ignore # other user's

    def test_list_notifications_excludes_deleted(self):
        """Test that deleted notifications are not included"""
        self.client.force_authenticate(user=self.user) # type: ignore
        response = self.client.get("/notifications/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that deleted notification is not in results
        for notification in response.data: # type: ignore
            self.assertNotEqual(notification["id"], self.notif3.id)# type: ignore

    def test_list_notifications_ordered_by_created_at(self):
        """Test that notifications are ordered by created_at (newest first)"""
        self.client.force_authenticate(user=self.user) # type: ignore
                # Wait a tiny bit to ensure different timestamp
        import time
        time.sleep(0.01)
                # Create a new notification
        new_notif = Notification.objects.create(
            user=self.user,
            notification_type="message",
            sender=self.other_user,
            message="New message",
            is_deleted=False
        )
        
        response = self.client.get("/notifications/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # First notification should be the newest one
        self.assertEqual(response.data[0]["id"], new_notif.id)# type: ignore

    def test_list_notifications_empty(self):
        """Test listing notifications when user has none"""
        # Create a new user with no notifications
        new_user = User.objects.create_user(
            email="newuser@example.com",
            username="newuser",
            password="testpass123"
        )
        
        self.client.force_authenticate(user=new_user) # type: ignore
        response = self.client.get("/notifications/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)# type: ignore

    def test_delete_notification_requires_authentication(self):
        """Test that deleting a notification requires authentication"""
        response = self.client.delete(f"/notifications/{self.notif1.id}/")# type: ignore
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_notification_success(self):
        """Test successfully deleting (soft delete) a notification"""
        self.client.force_authenticate(user=self.user) # type: ignore
        response = self.client.delete(f"/notifications/{self.notif1.id}/") # type: ignore
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify notification is marked as deleted
        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.is_deleted)
        
        # Verify it no longer appears in list
        list_response = self.client.get("/notifications/")
        notification_ids = [n["id"] for n in list_response.data]# type: ignore
        self.assertNotIn(self.notif1.id, notification_ids)# type: ignore

    def test_delete_notification_not_found(self):
        """Test deleting a notification that doesn't exist"""
        self.client.force_authenticate(user=self.user)# type: ignore
        response = self.client.delete("/notifications/99999/")
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_notification_belongs_to_other_user(self):
        """Test that user cannot delete another user's notification"""
        self.client.force_authenticate(user=self.user)# type: ignore
        response = self.client.delete(f"/notifications/{self.other_notif.id}/") # type: ignore
        
        # Should return 404 because notification doesn't belong to current user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verify notification was not deleted
        self.other_notif.refresh_from_db()
        self.assertFalse(self.other_notif.is_deleted)

    def test_delete_already_deleted_notification(self):
        """Test deleting an already deleted notification"""
        self.client.force_authenticate(user=self.user)# type: ignore
        
        # notif3 is already deleted
        response = self.client.delete(f"/notifications/{self.notif3.id}/") # type: ignore
        
        # Should still return 204 (idempotent)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify it's still deleted
        self.notif3.refresh_from_db()
        self.assertTrue(self.notif3.is_deleted)

    def test_delete_multiple_notifications(self):
        """Test deleting multiple notifications sequentially"""
        self.client.force_authenticate(user=self.user)# type: ignore
        
        response1 = self.client.delete(f"/notifications/{self.notif1.id}/") # type: ignore
        response2 = self.client.delete(f"/notifications/{self.notif2.id}/") # type: ignore
        
        self.assertEqual(response1.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response2.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify both are deleted
        self.notif1.refresh_from_db()
        self.notif2.refresh_from_db()
        self.assertTrue(self.notif1.is_deleted)
        self.assertTrue(self.notif2.is_deleted)
        
        # List should be empty now
        list_response = self.client.get("/notifications/")
        self.assertEqual(len(list_response.data), 0)# type: ignore

    def test_notification_serialization(self):
        """Test that notifications are properly serialized"""
        self.client.force_authenticate(user=self.user)# type: ignore
        response = self.client.get("/notifications/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check notification structure
        notification = response.data[0]# type: ignore
        self.assertIn("id", notification)
        self.assertIn("notification_type", notification)
        self.assertIn("message", notification)

    def test_list_notifications_after_creating_new_one(self):
        """Test that newly created notifications appear in list"""
        self.client.force_authenticate(user=self.user)# type: ignore
        
        # Get initial count
        response1 = self.client.get("/notifications/")
        initial_count = len(response1.data)# type: ignore
        
        # Create new notification
        Notification.objects.create(
            user=self.user,
            notification_type="share",
            sender=self.other_user,
            message="User shared a book with you",
            is_deleted=False
        )
        
        # Get updated list
        response2 = self.client.get("/notifications/")
        self.assertEqual(len(response2.data), initial_count + 1)# type: ignore

    def test_soft_delete_preserves_notification(self):
        """Test that soft delete preserves notification in database"""
        self.client.force_authenticate(user=self.user)# type: ignore
        
        notif_id = self.notif1.id# type: ignore
        self.client.delete(f"/notifications/{notif_id}/")
        
        # Notification should still exist in database
        self.assertTrue(Notification.objects.filter(id=notif_id).exists())
        
        # But should be marked as deleted
        notif = Notification.objects.get(id=notif_id)
        self.assertTrue(notif.is_deleted)
