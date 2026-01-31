from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models import Event
from datetime import date, timedelta

User = get_user_model()


class EventModelTestCase(TestCase):
    """Test cases for the Event model"""

    def setUp(self):
        """Set up test data"""
        self.event_data = {
            "title": "Book Launch Event",
            "link": "https://example.com/event",
            "date": date.today() + timedelta(days=10),
            "description": "A great book launch event",
            "location": "New York",
            "source": "eventbrite",
            "external_id": "evt_12345"
        }

    def test_event_creation(self):
        """Test creating a basic event"""
        event = Event.objects.create(**self.event_data)
        self.assertEqual(event.title, "Book Launch Event")
        self.assertEqual(event.location, "New York")
        self.assertEqual(event.source, "eventbrite")
        self.assertIsNotNone(event.created_at)

    def test_event_string_representation(self):
        """Test the __str__ method of Event"""
        event = Event.objects.create(**self.event_data)
        expected_str = "[eventbrite] Book Launch Event"
        self.assertEqual(str(event), expected_str)

    def test_event_with_minimal_data(self):
        """Test creating an event with only required fields"""
        event = Event.objects.create()
        self.assertIsNone(event.title)
        self.assertIsNone(event.link)
        self.assertIsNone(event.date)
        self.assertIsNone(event.description)
        self.assertIsNotNone(event.created_at)

    def test_event_with_all_fields(self):
        """Test creating an event with all fields populated"""
        event = Event.objects.create(**self.event_data)
        self.assertEqual(event.title, self.event_data["title"])
        self.assertEqual(event.link, self.event_data["link"])
        self.assertEqual(event.date, self.event_data["date"])
        self.assertEqual(event.description, self.event_data["description"])
        self.assertEqual(event.location, self.event_data["location"])
        self.assertEqual(event.source, self.event_data["source"])
        self.assertEqual(event.external_id, self.event_data["external_id"])

    def test_unique_constraint_source_external_id(self):
        """Test the unique constraint on (source, external_id)"""
        Event.objects.create(
            title="Event 1",
            source="eventbrite",
            external_id="evt_001"
        )
        
        # Attempting to create another event with the same source and external_id should fail
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Event.objects.create(
                title="Event 2",
                source="eventbrite",
                external_id="evt_001"
            )

    def test_unique_constraint_allows_same_external_id_different_source(self):
        """Test that same external_id is allowed if source is different"""
        Event.objects.create(
            title="Event 1",
            source="eventbrite",
            external_id="evt_001"
        )
        
        # This should succeed because source is different
        event2 = Event.objects.create(
            title="Event 2",
            source="facebook",
            external_id="evt_001"
        )
        self.assertEqual(event2.source, "facebook")

    def test_event_url_field(self):
        """Test the URL field validation"""
        valid_urls = [
            "https://example.com",
            "http://example.com/event",
            "https://example.com/event?id=123",
        ]
        
        for url in valid_urls:
            event = Event.objects.create(
                title=f"Event with {url}",
                link=url
            )
            self.assertEqual(event.link, url)

    def test_event_date_field(self):
        """Test the date field"""
        event_date = date(2026, 12, 25)
        event = Event.objects.create(
            title="Christmas Event",
            date=event_date
        )
        self.assertEqual(event.date, event_date)

    def test_event_long_title(self):
        """Test event with maximum length title"""
        long_title = "A" * 500  # max_length=500
        event = Event.objects.create(
            title=long_title,
            source="test"
        )
        self.assertEqual(event.title, long_title)
        self.assertEqual(len(event.title), 500) # type: ignore

    def test_event_long_url(self):
        """Test event with long URL"""
        long_url = "https://example.com/" + "path/" * 50  # Should be within max_length=1000
        event = Event.objects.create(
            title="Event",
            link=long_url
        )
        self.assertEqual(event.link, long_url)

    def test_event_blank_fields(self):
        """Test that fields can be blank"""
        event = Event.objects.create(
            title="Event",
            description="",
            location="",
            source="",
        )
        self.assertEqual(event.description, "")
        self.assertEqual(event.location, "")
        self.assertEqual(event.source, "")

    def test_event_null_fields(self):
        """Test that fields can be null"""
        event = Event.objects.create(
            title="Event",
            description=None,
            location=None,
            source=None,
        )
        self.assertIsNone(event.description)
        self.assertIsNone(event.location)
        self.assertIsNone(event.source)

    def test_event_update(self):
        """Test updating an event"""
        event = Event.objects.create(**self.event_data)
        original_created_at = event.created_at
        
        event.title = "Updated Title"
        event.location = "Los Angeles"
        event.save()
        
        refreshed_event = Event.objects.get(pk=event.pk)
        self.assertEqual(refreshed_event.title, "Updated Title")
        self.assertEqual(refreshed_event.location, "Los Angeles")
        self.assertEqual(refreshed_event.created_at, original_created_at)

    def test_event_delete(self):
        """Test deleting an event"""
        event = Event.objects.create(**self.event_data)
        event_id = event.pk
        
        event.delete()
        
        with self.assertRaises(Event.DoesNotExist):
            Event.objects.get(pk=event_id)

    def test_event_queryset_filtering(self):
        """Test filtering events by various fields"""
        Event.objects.create(title="Event A", source="eventbrite")
        Event.objects.create(title="Event B", source="facebook")
        Event.objects.create(title="Event C", source="eventbrite")
        
        eventbrite_events = Event.objects.filter(source="eventbrite")
        self.assertEqual(eventbrite_events.count(), 2)
        
        facebook_events = Event.objects.filter(source="facebook")
        self.assertEqual(facebook_events.count(), 1)

    def test_event_queryset_ordering(self):
        """Test ordering events by date"""
        date1 = date(2026, 1, 15)
        date2 = date(2026, 2, 15)
        date3 = date(2026, 3, 15)
        
        event3 = Event.objects.create(title="Event 3", date=date3)
        event1 = Event.objects.create(title="Event 1", date=date1)
        event2 = Event.objects.create(title="Event 2", date=date2)
        
        ordered_events = list(Event.objects.order_by("date").values_list("title", flat=True))
        self.assertEqual(ordered_events, ["Event 1", "Event 2", "Event 3"])

    def test_event_count(self):
        """Test counting total events"""
        Event.objects.create(title="Event 1", source="src1", external_id="id1")
        Event.objects.create(title="Event 2", source="src2", external_id="id2")
        Event.objects.create(title="Event 3", source="src3", external_id="id3")
        
        self.assertEqual(Event.objects.count(), 3)

    def test_event_bulk_create(self):
        """Test creating multiple events at once"""
        events = [
            Event(title="Event 1", source="src1", external_id="id1"),
            Event(title="Event 2", source="src2", external_id="id2"),
            Event(title="Event 3", source="src3", external_id="id3"),
        ]
        
        Event.objects.bulk_create(events)
        self.assertEqual(Event.objects.count(), 3)

    def test_event_none_values_allowed(self):
        """Test that None values are allowed for nullable fields"""
        event = Event.objects.create(
            title="Test Event",
            link=None,
            date=None,
            description=None,
            location=None,
            source=None,
            external_id=None
        )
        
        self.assertIsNone(event.link)
        self.assertIsNone(event.date)
        self.assertIsNone(event.description)
        self.assertIsNone(event.location)
        self.assertIsNone(event.source)
        self.assertIsNone(event.external_id)

    def test_event_source_and_external_id_only(self):
        """Test creating event with only source and external_id (for scraping)"""
        event = Event.objects.create(
            source="web_scraper",
            external_id="item_12345"
        )
        
        self.assertEqual(event.source, "web_scraper")
        self.assertEqual(event.external_id, "item_12345")
        self.assertIsNone(event.title)
        self.assertIsNotNone(event.created_at)

    def test_event_created_at_auto_now_add(self):
        """Test that created_at is automatically set on creation"""
        from django.utils import timezone
        before_create = timezone.now()
        
        event = Event.objects.create(title="Test Event")
        
        after_create = timezone.now()
        
        self.assertGreaterEqual(event.created_at, before_create) # type: ignore
        self.assertLessEqual(event.created_at, after_create) # type: ignore

    def test_event_field_max_lengths(self):
        """Test field maximum lengths"""
        # Title max_length=500
        title_500 = "A" * 500
        event1 = Event.objects.create(title=title_500)
        self.assertEqual(len(event1.title), 500) # type: ignore
        
        # Link max_length=1000
        link_1000 = "https://example.com/" + "a" * 980
        event2 = Event.objects.create(link=link_1000)
        self.assertEqual(len(event2.link), 1000) # type: ignore
        
        # Source max_length=100
        source_100 = "S" * 100
        event3 = Event.objects.create(source=source_100)
        self.assertEqual(len(event3.source), 100) # type: ignore
        
        # Location max_length=255
        location_255 = "L" * 255
        event4 = Event.objects.create(location=location_255)
        self.assertEqual(len(event4.location), 255) # type: ignore

    def test_event_exists(self):
        """Test the exists() method"""
        Event.objects.create(title="Test Event", source="test", external_id="1")
        
        exists = Event.objects.filter(source="test", external_id="1").exists()
        self.assertTrue(exists)
        
        not_exists = Event.objects.filter(source="test", external_id="999").exists()
        self.assertFalse(not_exists)

    def test_event_get_or_create(self):
        """Test get_or_create functionality"""
        event_data = {"source": "test", "external_id": "unique_123"}
        
        event1, created1 = Event.objects.get_or_create(
            source="test",
            external_id="unique_123",
            defaults={"title": "Created Event"}
        )
        
        self.assertTrue(created1)
        self.assertEqual(event1.title, "Created Event")
        
        event2, created2 = Event.objects.get_or_create(
            source="test",
            external_id="unique_123",
            defaults={"title": "Another Title"}
        )
        
        self.assertFalse(created2)
        self.assertEqual(event2.id, event1.id) # type: ignore
        self.assertEqual(event2.title, "Created Event")  # Should keep original title
