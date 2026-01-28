import re
import time
from django.http import Http404, JsonResponse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from urllib.parse import urlparse


# ================= HELPERS =================

def extract_date(text):
    luni = r"ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie"
    match = re.search(rf"\b\d{{1,2}}\s(?:{luni})(?:\s\d{{4}})?\b", text, re.IGNORECASE)
    return match.group(0) if match else "Necunoscută"


def extract_location(text):
    match = re.search(r"(la|în)\s+[A-ZĂÂÎȘȚ][\w\s,\-.]{2,50}", text)
    return match.group(0).strip() if match else "Necunoscută"


# ================= SCRAPERS =================

def scrape_exclusivebooks(driver, list_url):
    driver.get(list_url)
    time.sleep(3)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    events = []

    for block in soup.select("div.ma-event"):
        try:
            title = block.select_one("h3.ma-title").get_text(strip=True)
            date = block.find_parent("div", attrs={"data-ma-date": True})["data-ma-date"].split("T")[0]

            time_tag = block.select_one("div.ma-time")
            location_tag = block.select_one("div.ma-location")
            location = location_tag.get_text(strip=True) if location_tag else "Unknown"

            # Build description with newlines
            description_parts = []
            if time_tag:
                description_parts.append(time_tag.get_text(strip=True))
            if location:
                description_parts.append(f"at {location}")
            description = "\n".join(description_parts) if description_parts else location

            events.append({
                "title": title,
                "link": list_url,
                "date": date,
                "location": location,
                "description": description,
                "image": None,
                "source": urlparse(list_url).netloc
            })
        except Exception:
            pass

    return events


def scrape_bn_events(driver, list_url):
    driver.get(list_url)
    time.sleep(3)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    events = []

    for p in soup.find_all("p", style=lambda v: v and "text-align: center" in v):
        text = p.get_text(strip=True)
        if len(text) < 10:
            continue

        events.append({
            "title": text.split(".")[0],
            "link": list_url,
            "date": extract_date(text),
            "location": extract_location(text),
            "description": text,
            "image": None,
            "source": urlparse(list_url).netloc
        })

    return events

def scrape_bookscouter_events(driver, list_url):
    driver.get(list_url)
    time.sleep(3)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    events = []

    event_blocks = soup.select("h2")

    for h2 in event_blocks:
        try:
            raw_title = h2.get_text(strip=True)
            title = re.sub(r"^\d+\.\s*", "", raw_title)

            parent = h2.find_next_sibling()
            date, location, description = "Unknown", "Unknown", ""
            image = None

            # imagine (daca exista)
            img_tag = h2.find_previous("img") or h2.find_next("img")
            if img_tag and img_tag.has_attr("src"):
                image = img_tag["src"]

            # parcurge blocul pana la urmatorul h2
            description_parts = []
            while parent and parent.name != "h2":
                text = parent.get_text("\n", strip=True)

                if "When:" in text:
                    match = re.search(r"(?<=When:\s).*", text)
                    if match:
                        date = match.group(0).strip()
                elif "Where:" in text:
                    match = re.search(r"(?<=Where:\s).*", text)
                    if match:
                        location = match.group(0).strip()
                else:
                    if text and not text.startswith(("When:", "Where:")):
                        description_parts.append(text.strip())

                parent = parent.find_next_sibling()

            description = "\n\n".join(description_parts)

            # limita ca inainte
            if len(description) > 1000:
                description = description[:1000].rsplit(".", 1)[0] + "..."

            # daca description e gol, macar title
            if not description:
                description = title

            events.append({
                "title": title,
                "link": list_url,
                "date": date,
                "location": location,
                "image": image,
                "description": description,
                "source": urlparse(list_url).netloc
            })

        except Exception as e:
            events.append({
                "title": "Event error",
                "link": list_url,
                "date": "Error",
                "location": "Error",
                "description": str(e),
                "image": None,
                "source": urlparse(list_url).netloc
            })

    return events



# ================= CORE LOGIC =================

def collect_all_events():
    urls = [
        "https://exclusivebooks.co.za/pages/events",
        "https://www.barnesandnobleinc.com/our-stores-communities/events/",
        "https://bookscouter.com/blog/book-conventions-and-festivals/"
    ]

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-software-rasterizer")
    options.add_argument("--remote-debugging-port=9222")

    # Use system chromium-driver instead of ChromeDriverManager
    try:
        # Try to use system chromium-driver first (for Docker)
        driver = webdriver.Chrome(options=options)
    except Exception as e:
        # Fallback to ChromeDriverManager if system driver not found
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=options
        )

    all_events = []
    try:
        for url in urls:
            if "exclusivebooks" in url:
                all_events.extend(scrape_exclusivebooks(driver, url))
            elif "barnesandnoble" in url:
                all_events.extend(scrape_bn_events(driver, url))
            elif "bookscouter" in url:
                all_events.extend(scrape_bookscouter_events(driver, url))
    finally:
        driver.quit()

    for idx, ev in enumerate(all_events):
        ev["id"] = idx

    return all_events


# ================= VIEWS =================

def scrape_events(request):
    return JsonResponse(
        collect_all_events(),
        safe=False,
        json_dumps_params={"ensure_ascii": False, "indent": 2}
    )


def scrape_event_by_id(request, event_id: int):
    for ev in collect_all_events():
        if ev["id"] == event_id:
            return JsonResponse(
                ev,
                safe=False,
                json_dumps_params={"ensure_ascii": False, "indent": 2}
            )
    raise Http404("Event not found")
