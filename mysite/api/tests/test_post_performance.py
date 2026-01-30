import time
import statistics

from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from api.models import Book, Post

# Response time + err rate
class PostPerfSmokeTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()

        self.user = User.objects.create_user(
            email="perf@example.com",
            password="pass1234",
            username="perfuser",
            first_name="Perf",
            last_name="User",
        )
        self.client.force_authenticate(user=self.user)

        self.book = Book.objects.create(
            id="demo-vol-1",
            ISBN="9999999999999",
            title="Perf Book",
            author="Author",
            genre="Test",
            rating=3,
            nr_pages=123,
            publication_year=2020,
            series="N/A",
            description="",
            cover="",
        )

        posts = [
            Post(
                user=self.user,
                book=self.book,
                action=Post.ActionChoices.POST,
                description=f"Post {i}",
                rating=None,
            )
            for i in range(30)
        ]
        Post.objects.bulk_create(posts)

       
        self.url_list = reverse("list-posts") 
        self.url_feed = reverse("feed")        

    def _probe(self, url: str, repeats: int = 25):
        latencies_ms = []
        errors = 0

        for _ in range(repeats):
            t0 = time.perf_counter()
            resp = self.client.get(url)
            dt_ms = (time.perf_counter() - t0) * 1000.0

            latencies_ms.append(dt_ms)
            if resp.status_code >= 400:
                errors += 1

        latencies_ms.sort()
        return latencies_ms, errors

    def _percentile(self, sorted_vals, p: float) -> float:
        if not sorted_vals:
            return 0.0
        idx = int(p * (len(sorted_vals) - 1))
        return sorted_vals[idx]

    
    def test_list_posts_latency_smoke(self):
        lat, err = self._probe(self.url_list, repeats=25)
        self.assertEqual(err, 0, f"Errors on list-posts: {err}")

        avg = statistics.mean(lat)
        p50 = self._percentile(lat, 0.50)
        p95 = self._percentile(lat, 0.95)
        p99 = self._percentile(lat, 0.99)

        self.assertLess(avg, 800.0, f"list-posts avg too high: {avg:.1f}ms")
        self.assertLess(p95, 1500.0, f"list-posts p95 too high: {p95:.1f}ms")
        self.assertLess(p99, 2000.0, f"list-posts p99 too high: {p99:.1f}ms")

    
    def test_feed_latency_smoke(self):
        lat, err = self._probe(self.url_feed, repeats=25)
        self.assertEqual(err, 0, f"Errors on feed: {err}")

        avg = statistics.mean(lat)
        p95 = self._percentile(lat, 0.95)
        p99 = self._percentile(lat, 0.99)

        self.assertLess(avg, 1000.0, f"feed avg too high: {avg:.1f}ms")
        self.assertLess(p95, 2000.0, f"feed p95 too high: {p95:.1f}ms")
        self.assertLess(p99, 2500.0, f"feed p99 too high: {p99:.1f}ms")
