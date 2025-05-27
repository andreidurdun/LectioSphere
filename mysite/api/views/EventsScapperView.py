import re
import time
from django.http import JsonResponse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def extract_date(text):
    luni = r"ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie"
    match = re.search(rf"\b\d{{1,2}}\s(?:{luni})(?:\s\d{{4}})?\b", text, re.IGNORECASE)
    return match.group(0) if match else "Necunoscută"

def extract_location(text):
    match = re.search(r"(la|în)\s+[A-ZĂÂÎȘȚ][\w\s,\-.]{2,50}", text)
    return match.group(0).strip() if match else "Necunoscută"

def extract_article_data(driver, url):
    driver.get(url)
    time.sleep(2)
    soup = BeautifulSoup(driver.page_source, "html.parser")

    title_tag = soup.find("h1") or soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else "Fără titlu"

    content_blocks = soup.find_all(["article", "section", "div"])
    descriere = max((block.get_text(" ", strip=True) for block in content_blocks if block.get_text(strip=True)), key=len, default="")

    return {
        "title": title,
        "link": url,
        "data": extract_date(descriere),
        "locatie": extract_location(descriere),
        "descriere": descriere,
        "source": urlparse(url).netloc
    }

def get_article_links(driver, list_url):
    driver.get(list_url)
    time.sleep(3)
    soup = BeautifulSoup(driver.page_source, "html.parser")

    links = set()

    # Carturesti
    if "carturesti" in list_url:
        for a in soup.select("article a"):
            href = a.get("href")
            if href and "/eveniment/" in href or "/festival" in href or "/carturesti" in href:
                links.add(href)

    # Bookhub
    elif "bookhub" in list_url:
        for a in soup.select("div.td-module-thumb a"):
            href = a.get("href")
            if href and "bookhub.ro" in href:
                links.add(href)

    # Eventbook
    elif "eventbook" in list_url:
        for a in soup.select("a.event-link, a[href*='/event/']"):
            href = a.get("href")
            if href and "/event/" in href:
                if not href.startswith("http"):
                    href = "https://eventbook.ro" + href
                links.add(href)

    return list(links)

def scrape_events(request):
    urls_to_scrape = [
        "https://bookhub.ro/tag/evenimente-literare/",
        "https://eventbook.ro/hall/humanitas-cismigiu-bucuresti",
        "https://blog.carturesti.ro/category/evenimente/evenimentele-saptamanii/",
        "https://blog.carturesti.ro/category/evenimente/targuri-si-festivaluri/",
    ]

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("user-agent=Mozilla/5.0")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    all_events = []

    try:
        for list_url in urls_to_scrape:
            try:
                article_links = get_article_links(driver, list_url)
                for link in article_links:
                    try:
                        event_data = extract_article_data(driver, link)
                        all_events.append(event_data)
                    except Exception as e:
                        all_events.append({
                            "title": "Eroare articol",
                            "link": link,
                            "data": "Eroare",
                            "locatie": "Eroare",
                            "descriere": str(e),
                            "source": urlparse(link).netloc
                        })
            except Exception as e:
                all_events.append({
                    "title": "Eroare pagină",
                    "link": list_url,
                    "data": "Eroare",
                    "locatie": "Eroare",
                    "descriere": str(e),
                    "source": urlparse(list_url).netloc
                })

        return JsonResponse(all_events, safe=False, json_dumps_params={"ensure_ascii": False, "indent": 2})

    finally:
        driver.quit()
