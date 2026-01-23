from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from django.core.mail import EmailMessage
from django.contrib.auth import get_user_model
from django.utils.html import strip_tags
from accounts.models import UserAccount

from api.models import Event
from api.models import Notification
from webscrappingdemo.sources.carturesti import get_carturesti_events
from webscrappingdemo.sources.humanitas import get_humanitas_events

User = get_user_model()


class Command(BaseCommand):
    help = "Sync events into DB and email users when NEW events are found. Includes --email-test for demo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email-test",
            action="store_true",
            help="Scrape one real event and email it to all users (FOR DEMO/EVALUATION).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        email_test = options.get("email_test", False)

        # 1) Scraping
        all_events = []
        all_events.extend(get_carturesti_events())
        all_events.extend(get_humanitas_events())

        # 2) DEMO MODE: send ONE real scraped event (even if nothing is new)
        if email_test:
            if not all_events:
                self.stdout.write(self.style.ERROR("No events scraped. Email test not sent."))
                return

            event = all_events[0]
            sent_to = self.send_single_event_email(event)
            self.stdout.write(self.style.SUCCESS(f"Email test sent to {sent_to} recipients (BCC)."))
            return

        # 3) NORMAL MODE: sync + collect new events
        new_events = []

        for e in all_events:
            link = e.get("link")
            source = e.get("source", "unknown")
            if not link:
                continue

            external_id = link  # stable dedupe key

            obj, created = Event.objects.get_or_create(
                source=source,
                external_id=external_id,
                defaults={
                    "title": e.get("title", ""),
                    "link": link,
                    "date": e.get("data") or None,
                    "description": e.get("descriere", ""),
                }
            )

            if created:
                new_events.append(obj)
                self.stdout.write(self.style.SUCCESS(f"NEW: [{obj.source}] {obj.title}"))

        self.stdout.write(self.style.WARNING(f"Total new events added: {len(new_events)}"))

        # 4) If there are NEW events -> send digest email to all users
        if new_events:
            created_n = self.create_notifications_for_all_users(new_events)
            sent_to = self.send_digest_email(new_events)
            self.stdout.write(self.style.SUCCESS(f"Digest email sent to {sent_to} recipients (BCC) and notifications created."))
        else:
            self.stdout.write(self.style.WARNING("No new events. No email sent."))


    def _all_user_emails(self):
        return list(
            User.objects
            .exclude(email__isnull=True)
            .exclude(email__exact="")
            .values_list("email", flat=True)
            .distinct()
        )
    

    # notificari app
    def create_notifications_for_all_users(self, new_events) -> int:
      users = list(User.objects.all().only("id"))
      if not users:
          return 0

      existing = set(
          Notification.objects.filter(event__in=new_events, user__in=users)
          .values_list("user_id", "event_id")
      )

      to_create = []
      for u in users:
          for ev in new_events:
              key = (u.id, ev.id)
              if key in existing:
                  continue
              to_create.append(Notification(user=u, event=ev))

      Notification.objects.bulk_create(to_create, batch_size=1000)
      return len(to_create)


    def _html_wrapper(self, inner_html: str) -> str:
        """
        Simple, email-client-friendly wrapper (inline CSS only).
        """
        return f"""
        <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f4f6f8; padding:30px;">
          <div style="max-width:640px; margin:auto; background:#ffffff; border-radius:12px; padding:28px;">
            <div style="border-bottom:1px solid #eee; padding-bottom:14px; margin-bottom:18px;">
              <div style="font-size:18px; font-weight:700; color:#111;">LectioSphere</div>
              <div style="font-size:13px; color:#666;">Events & book community</div>
            </div>

            {inner_html}

            <div style="border-top:1px solid #eee; margin-top:22px; padding-top:14px; font-size:12px; color:#888;">
              You’re receiving this because you have an account on LectioSphere.
            </div>
          </div>
        </div>
        """

    def send_single_event_email(self, event_dict) -> int:
        """
        Stylish HTML email with ONE real scraped event (for demo/evaluation).
        """
        recipients = self._all_user_emails()
        if not recipients:
            return 0

        title = (event_dict.get("title") or "New event").strip()
        link = (event_dict.get("link") or "").strip()
        source = (event_dict.get("source") or "").strip()
        date = (event_dict.get("data") or "To be announced").strip()
        description = (event_dict.get("descriere") or "More details coming soon.").strip()

        description_clean = " ".join(description.replace("\r", " ").replace("\n", " ").split())

        subject = f"✨ We think you might like this event: {title}"

        inner = f"""
        <h2 style="margin:0 0 10px; color:#111;">Hi 👋</h2>
        <p style="margin:0 0 18px; font-size:15px; color:#444;">
          We think you might be interested in this upcoming event:
        </p>

        <div style="border:1px solid #e6e6e6; border-radius:10px; padding:18px; background:#fafafa;">
          <div style="font-size:18px; font-weight:700; color:#1f2937; margin-bottom:8px;">{title}</div>

          <div style="font-size:14px; color:#374151; margin:6px 0;">
            <strong>Source:</strong> {source or '-'}
          </div>
          <div style="font-size:14px; color:#374151; margin:6px 0;">
            <strong>Date:</strong> {date}
          </div>

          <div style="font-size:14px; color:#4b5563; margin-top:12px; line-height:1.5;">
            {description_clean}
          </div>

          <div style="text-align:center; margin-top:18px;">
            <a href="{link}" target="_blank"
               style="background:#4f46e5; color:#ffffff; text-decoration:none;
                      padding:12px 18px; border-radius:8px; font-weight:700; display:inline-block;">
              View event →
            </a>
          </div>
        </div>

        <p style="margin:18px 0 0; font-size:14px; color:#555;">
          Hope to see you there 😊
        </p>
        <p style="margin:10px 0 0; font-size:13px; color:#777;">Thanks,<br/>LectioSphere</p>
        """

        html_message = self._html_wrapper(inner)
        text_message = strip_tags(html_message)

        from_addr = getattr(settings, "DEFAULT_FROM_EMAIL", "lectiosphere@gmail.com")
        from_email = f"LectioSphere Events <{from_addr}>"

        email = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=from_email,
            to=[from_addr],
            bcc=recipients,
            headers={"Reply-To": from_addr},
        )
        email.content_subtype = "html"
        email.send(fail_silently=False)

        return len(recipients)

    def send_digest_email(self, new_events) -> int:
        """
        Stylish HTML digest email with ALL new events found in this run.
        """
        recipients = self._all_user_emails()
        if not recipients:
            return 0

        subject = f"✨ {len(new_events)} new event(s) just added on LectioSphere"

        max_items = 12  # looks better in email
        shown = new_events[:max_items]
        remaining = len(new_events) - len(shown)

        items_html = ""
        for ev in shown:
            title = (ev.title or "").strip()
            source = (ev.source or "").strip()
            date = str(ev.date) if ev.date else "To be announced"
            link = (ev.link or "").strip()
            desc = (ev.description or "").replace("\r", " ").replace("\n", " ").strip()
            if len(desc) > 220:
                desc = desc[:220] + "..."

            items_html += f"""
            <div style="border:1px solid #e6e6e6; border-radius:10px; padding:16px; margin:12px 0; background:#fafafa;">
              <div style="font-size:16px; font-weight:700; color:#1f2937;">{title}</div>
              <div style="font-size:13px; color:#374151; margin-top:6px;">
                <strong>Source:</strong> {source or '-'} &nbsp; | &nbsp; <strong>Date:</strong> {date}
              </div>
              <div style="font-size:13px; color:#4b5563; margin-top:10px; line-height:1.5;">
                {desc or '-'}
              </div>
              <div style="margin-top:12px;">
                <a href="{link}" target="_blank"
                   style="background:#111827; color:#ffffff; text-decoration:none;
                          padding:10px 14px; border-radius:8px; font-weight:700; display:inline-block;">
                  Open →
                </a>
              </div>
            </div>
            """

        more_line = ""
        if remaining > 0:
            more_line = f"""
            <p style="margin:12px 0 0; font-size:13px; color:#666;">
              …and {remaining} more event(s) were added.
            </p>
            """

        inner = f"""
        <h2 style="margin:0 0 10px; color:#111;">Hi 👋</h2>
        <p style="margin:0 0 18px; font-size:15px; color:#444;">
          We just added <strong>{len(new_events)}</strong> new event(s) to LectioSphere. Here are the latest ones:
        </p>

        {items_html}

        {more_line}

        <p style="margin:18px 0 0; font-size:14px; color:#555;">
          Enjoy exploring — and have a great day 😊
        </p>
        <p style="margin:10px 0 0; font-size:13px; color:#777;">Thanks,<br/>LectioSphere</p>
        """

        html_message = self._html_wrapper(inner)

        from_addr = getattr(settings, "DEFAULT_FROM_EMAIL", "lectiosphere@gmail.com")
        from_email = f"LectioSphere Events <{from_addr}>"

        email = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=from_email,
            to=[from_addr],
            bcc=recipients,
            headers={"Reply-To": from_addr},
        )
        email.content_subtype = "html"
        email.send(fail_silently=False)

        return len(recipients)
