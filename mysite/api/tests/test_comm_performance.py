import time
import statistics

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from api.models import Book, Post, Comment

# Response time + err rate
class CommentPerfSmokeTest(TestCase):
  
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()

        self.user = User.objects.create_user(
            email="perf-comments@example.com",
            password="pass1234",
            username="perfcomments",
            first_name="Perf",
            last_name="Comments",
        )
        self.client.force_authenticate(user=self.user)

        book = Book.objects.create(
            id="demo-vol-comm-1",
            ISBN="8888888888888",
            title="Comments Book",
            author="Author",
            genre="Test",
            rating=3,
            nr_pages=111,
            publication_year=2021,
            series="N/A",
            description="",
            cover="",
        )

        self.post = Post.objects.create(
            user=self.user,
            book=book,
            action=Post.ActionChoices.POST,
            description="seed",
        )

        Comment.objects.bulk_create(
            [Comment(text=f"c{i}", user=self.user, post=self.post) for i in range(50)]
        )

        self.url_list = reverse("list-comments", kwargs={"pk": self.post.pk})
        self.url_add = reverse("add-comment", kwargs={"pk": self.post.pk})

    def _probe_get(self, url: str, repeats: int = 20):
        latencies = []
        errors = 0

        for _ in range(repeats):
            t0 = time.perf_counter()
            resp = self.client.get(url)
            dt_ms = (time.perf_counter() - t0) * 1000.0

            latencies.append(dt_ms)
            if resp.status_code >= 400:
                errors += 1

        latencies.sort()
        return latencies, errors

    def _probe_post(self, url: str, repeats: int = 20):
        latencies = []
        errors = 0

        for i in range(repeats):
            payload = {"text": f"perf {i}"}

            t0 = time.perf_counter()
            resp = self.client.post(url, data=payload, format="json")
            dt_ms = (time.perf_counter() - t0) * 1000.0

            latencies.append(dt_ms)
            if resp.status_code >= 400:
                errors += 1

        latencies.sort()
        return latencies, errors

    def _p(self, sorted_vals, p: float) -> float:
        idx = int(p * (len(sorted_vals) - 1))
        return sorted_vals[idx]

    def test_list_comments_latency_smoke(self):
        lat, err = self._probe_get(self.url_list, repeats=20)
        self.assertEqual(err, 0, f"Errors on list-comments: {err}")

        avg = statistics.mean(lat)
        p95 = self._p(lat, 0.95)

        self.assertLess(avg, 800.0, f"list-comments avg too high: {avg:.1f}ms")
        self.assertLess(p95, 1500.0, f"list-comments p95 too high: {p95:.1f}ms")
        # print(f"[list-comments] avg={avg:.1f}ms p95={p95:.1f}ms")

    def test_add_comment_latency_smoke(self):
        lat, err = self._probe_post(self.url_add, repeats=20)
        self.assertEqual(err, 0, f"Errors on add-comment: {err}")

        p95 = self._p(lat, 0.95)
        avg = statistics.mean(lat)

        self.assertLess(avg, 800.0, f"add-comment avg too high: {avg:.1f}ms")
        self.assertLess(p95, 1500.0, f"add-comment p95 too high: {p95:.1f}ms")
        # print(f"[add-comment] avg={avg:.1f}ms p95={p95:.1f}ms")
