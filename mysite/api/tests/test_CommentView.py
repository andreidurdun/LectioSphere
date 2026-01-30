from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import UserAccount
from api.models import Book, Post, Comment


class CommentViewTests(TestCase):
    def setUp(self):
        self.user = UserAccount.objects.create_user(
            email="user@example.com",
            password="testpass123",
            username="testuser",
            first_name="Test",
            last_name="User",
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.book = Book.objects.create(
            ISBN="9781234567897",
            id="vol-123",
            title="Test Book",
            author="Author Name",
            genre="Fiction",
            rating=5,
            nr_pages=300,
            publication_year=2020,
            series="Series",
        )

        self.post = Post.objects.create(
            user=self.user,
            book=self.book,
            action=Post.ActionChoices.POST,
            description="A post to comment on",
            rating=None,
        )


    def test_add_comment_success(self):
        url = reverse("add-comment", kwargs={"pk": self.post.pk})
        payload = {"text": "Great post!"}

        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, msg=resp.json())

        data = resp.json()
        self.assertIn("id", data)
        self.assertEqual(data["text"], "Great post!")
        self.assertEqual(data["user"], self.user.id)
        self.assertEqual(data["user_username"], self.user.username)
        self.assertEqual(data["post"], self.post.id)

        self.assertTrue(Comment.objects.filter(post=self.post, user=self.user, text="Great post!").exists())

    def test_list_comments_success(self):
        Comment.objects.create(text="First", user=self.user, post=self.post)
        Comment.objects.create(text="Second", user=self.user, post=self.post)

        url = reverse("list-comments", kwargs={"pk": self.post.pk})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK, msg=resp.json())

        data = resp.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)

        texts = [c["text"] for c in data]

        self.assertCountEqual(texts, ["First", "Second"])


    def test_add_comment_unauthenticated(self):
        client = APIClient()
        url = reverse("add-comment", kwargs={"pk": self.post.pk})
        resp = client.post(url, {"text": "No auth"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_add_comment_invalid_text_too_short(self):
        url = reverse("add-comment", kwargs={"pk": self.post.pk})
        resp = self.client.post(url, {"text": "a"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("text", resp.json())

    def test_add_comment_invalid_text_too_long(self):
        url = reverse("add-comment", kwargs={"pk": self.post.pk})
        resp = self.client.post(url, {"text": "x" * 300}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("text", resp.json())

    def test_add_comment_missing_text(self):
        url = reverse("add-comment", kwargs={"pk": self.post.pk})
        resp = self.client.post(url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("text", resp.json())

    def test_add_comment_post_not_found(self):
        url = reverse("add-comment", kwargs={"pk": 999999})
        resp = self.client.post(url, {"text": "Hello"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp.json().get("error"), "Post not found")

    def test_list_comments_post_not_found(self):
        url = reverse("list-comments", kwargs={"pk": 999999})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp.json().get("error"), "Post not found")
