import re
import time
from django.http import JsonResponse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def extract_date(text):
    luni = r"ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie"
    match = re.search(rf"\b\d{{1,2}}\s(?:{luni})(?:\s\d{{4}})?\b", text, re.IGNORECASE)
    return match.group(0) if match else "Necunoscută"

def extract_location(text):
    match = re.search(r"(la|în)\s+[A-ZĂÂÎȘȚ][\w\s,\-.]{2,50}", text)
    return match.group(0).strip() if match else "Necunoscută"
def scrape_carturesti(driver, list_url):
    driver.get(list_url)
    time.sleep(3)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    events = []

    articles = soup.select("article.article--grid")
    for article in articles:
        try:
            content_div = article.select_one("div.article__content")
            descriere = content_div.get_text(" ", strip=True) if content_div else ""
            title = descriere.split(".")[0] if descriere else "Fără titlu"

            if len(descriere) > 1000:
                descriere = descriere[:1000].rsplit(".", 1)[0] + "..."
                descriere = descriere.replace("Read more", "").replace("Citește mai mult", "").strip()


            events.append({
                "title": title,
                "link": list_url,  # Linkul articolului complet nu apare aici
                "data": extract_date(descriere),
                "locatie": extract_location(descriere),
                "descriere": descriere,
                "source": urlparse(list_url).netloc
            })

        except Exception as e:
            events.append({
                "title": "Eroare articol",
                "link": list_url,
                "data": "Eroare",
                "locatie": "Eroare",
                "descriere": str(e),
                "source": urlparse(list_url).netloc
            })

    return events

def extract_article_data(driver, url):
    driver.get(url)
    time.sleep(2)
    soup = BeautifulSoup(driver.page_source, "html.parser")

    title_tag = soup.find("h1") or soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else "Fără titlu"

    content_block = soup.select_one(".post-content.entry-content")
    if content_block:
        descriere = content_block.get_text(" ", strip=True)
        descriere = descriere.replace("Read more", "").replace("Citește mai mult", "").strip()

    else:
        descriere = soup.get_text(" ", strip=True)
        descriere = descriere.replace("Read more", "").replace("Citește mai mult", "").strip()


    if len(descriere) > 1000:
        descriere = descriere[:1000].rsplit(".", 1)[0] + "..."
        descriere = descriere.replace("Read more", "").replace("Citește mai mult", "").strip()


    return {
        "title": title,
        "link": url,
        "data": extract_date(descriere),
        "locatie": extract_location(descriere),
        "descriere": descriere,
        "source": urlparse(url).netloc
    }



def scrape_events(request):
    urls_to_scrape = [
        "https://blog.carturesti.ro/category/evenimente/",
         "https://bookhub.ro/tag/evenimente-literare/",
    "https://humanitas.ro/",

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
                if "humanitas.ro" in list_url:
                    try:
                        all_events.extend(scrape_humanitas(driver, list_url))
                    except Exception as e:
                        all_events.append({
                            "title": "Eroare pagină",
                            "link": list_url,
                            "data": "Eroare",
                            "locatie": "Eroare",
                            "descriere": str(e),
                            "source": urlparse(list_url).netloc
                        })

                elif "bookhub.ro" in list_url:
                    try:
                        all_events.extend(scrape_bookhub(driver, list_url))
                    except Exception as e:
                        all_events.append({
                            "title": "Eroare pagină",
                            "link": list_url,
                            "data": "Eroare",
                            "locatie": "Eroare",
                            "descriere": str(e),
                            "source": urlparse(list_url).netloc
                        })
                
                elif "carturesti.ro" in list_url:
                    try:
                        all_events.extend(scrape_carturesti(driver, list_url))
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

def scrape_bookhub(driver, list_url):
    driver.get(list_url)
    time.sleep(3)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    events = []

    articles = soup.select("article.post")
    for article in articles:
        try:
            # Extragere link și titlu din <a.image-link>
            link_tag = article.select_one("a.image-link")
            link = link_tag["href"] if link_tag else None
            title = link_tag.get_text(strip=True) if link_tag else "Fără titlu"

            # Descriere din <div class="content">
            content_div = article.select_one("div.content")
            descriere = content_div.get_text(" ", strip=True) if content_div else ""
            descriere = descriere.replace("Read more", "").replace("Citește mai mult", "").strip()


            if len(descriere) > 1000:
                descriere = descriere[:1000].rsplit(".", 1)[0] + "..."
                descriere = descriere.replace("Read more", "").replace("Citește mai mult", "").strip()


            events.append({
                "title": title,
                "link": link or list_url,
                "data": extract_date(descriere),
                "locatie": extract_location(descriere),
                "descriere": descriere,
                "source": urlparse(link or list_url).netloc
            })

        except Exception as e:
            events.append({
                "title": "Eroare articol",
                "link": list_url,
                "data": "Eroare",
                "locatie": "Eroare",
                "descriere": str(e),
                "source": urlparse(list_url).netloc
            })

    return events
def scrape_humanitas(driver, list_url="https://humanitas.ro/"):
    driver.get(list_url)
    time.sleep(3)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    events = []

    # Selectează containerul mare de evenimente
    container = soup.select_one("div.big_events")
    if not container:
        return []

    # Fiecare bloc de eveniment e un <p> sau <div> cu text simplu
    event_blocks = container.find_all("p") + container.find_all("div", recursive=False)
    for block in event_blocks:
        try:
            text = block.get_text(" ", strip=True)
            if not text or len(text) < 10:
                continue

            title = text.split(":", 1)[-1].strip() if ":" in text else text
            data = extract_date(text)
            locatie = extract_location(text)

            events.append({
                "title": title,
                "link": list_url,
                "data": data,
                "locatie": locatie,
                "descriere": text,
                "source": urlparse(list_url).netloc
            })

        except Exception as e:
            events.append({
                "title": "Eroare articol",
                "link": list_url,
                "data": "Eroare",
                "locatie": "Eroare",
                "descriere": str(e),
                "source": urlparse(list_url).netloc
            })

    return events
