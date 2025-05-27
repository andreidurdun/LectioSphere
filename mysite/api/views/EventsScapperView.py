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
            "https://exclusivebooks.co.za/pages/events",
           "https://www.barnesandnobleinc.com/our-stores-communities/events/",
            "https://bookscouter.com/blog/book-conventions-and-festivals/"



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
                
               
                
                if "exclusivebooks.co.za" in list_url:
                    try:
                        all_events.extend(scrape_exclusivebooks(driver, list_url))
                    except Exception as e:
                        all_events.append({
                            "title": "Eroare pagină",
                            "link": list_url,
                            "data": "Eroare",
                            "descriere": str(e),
                            "source": urlparse(list_url).netloc
                        })
                elif "barnesandnobleinc.com" in list_url:
                    try:
                        all_events.extend(scrape_bn_events(driver, list_url))
                    except Exception as e:
                        all_events.append({
                            "title": "Eroare pagină",
                            "link": list_url,
                            "data": "Eroare",
                            "locatie": "Eroare",
                            "descriere": str(e),
                            "source": urlparse(list_url).netloc
                        })
                elif "bookscouter.com" in list_url:
                    try:
                        all_events.extend(scrape_bookscouter_events(driver, list_url))
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


def scrape_exclusivebooks(driver, list_url="https://exclusivebooks.co.za/pages/events"):
    driver.get(list_url)
    time.sleep(3)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    events = []

    event_blocks = soup.select("div.ma-event")

    for block in event_blocks:
        try:
            title = block.select_one("h3.ma-title").get_text(strip=True)

            # Data din atributul div-ului părinte
            data = block.find_parent("div", attrs={"data-ma-date": True})["data-ma-date"]

            # Orar și locație
            time_tag = block.select_one("div.ma-time")
            location_tag = block.select_one("div.ma-location")

            ora = time_tag.get_text(strip=True) if time_tag else ""
            locatie = location_tag["title"] if location_tag and location_tag.has_attr("title") else location_tag.get_text(strip=True) if location_tag else "Necunoscută"

            # Poză din stilul inline
            image_div = block.select_one("div.ma-image")
            image_url = None
            if image_div and "style" in image_div.attrs:
                style = image_div["style"]
                match = re.search(r"url\(['\"]?(.*?)['\"]?\)", style)
                if match:
                    image_url = match.group(1)

            descriere = f"{ora} la {locatie}" if ora else locatie

            events.append({
                "title": title,
                "link": list_url,
                "data": data.split("T")[0],  # doar data fără timp
                "descriere": descriere,
                "imagine": image_url,
                "source": urlparse(list_url).netloc
            })

        except Exception as e:
            events.append({
                "title": "Eroare eveniment",
                "link": list_url,
                "data": "Eroare",
                "descriere": str(e),
                "imagine": None,
                "source": urlparse(list_url).netloc
            })

    return events




def scrape_bn_events(driver, list_url="https://www.barnesandnobleinc.com/our-stores-communities/events/"):
    driver.get(list_url)
    time.sleep(3)

    soup = BeautifulSoup(driver.page_source, "html.parser")
    events = []

    paragraphs = soup.find_all("p", style=lambda value: value and "text-align: center" in value)

    for p in paragraphs:
        try:
            text = p.get_text(strip=True)
            if not text or len(text) < 10:
                continue

            title = text.split(".")[0] if "." in text else text

            data = extract_date(text)
            locatie = extract_location(text)

            events.append({
                "title": title,
                "link": list_url,
                "data": data,
                "descriere": text,
                "imagine": None,
                "source": urlparse(list_url).netloc
            })
        except Exception as e:
            events.append({
                "title": "Eroare eveniment",
                "link": list_url,
                "data": "Eroare",
                "descriere": str(e),
                "imagine": None,
                "source": urlparse(list_url).netloc
            })

    return events



def scrape_bookscouter_events(driver, list_url):
    driver.get(list_url)
    time.sleep(3)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    events = []

    event_blocks = soup.select("h2")  # fiecare titlu de eveniment

    for h2 in event_blocks:
        try:
            raw_title = h2.get_text(strip=True)
            title = re.sub(r"^\d+\.\s*", "", raw_title)

            parent = h2.find_next_sibling()
            data, locatie, descriere = "Necunoscută", "Necunoscută", ""


            # Caută imagine în frații anteriori sau următori
            img_tag = h2.find_previous("img") or h2.find_next("img")
            if img_tag and img_tag.has_attr("src"):
                imagine = img_tag["src"]

            while parent and parent.name != "h2":
                text = parent.get_text(" ", strip=True)

                if "When:" in text:
                    match = re.search(r"(?<=When:\s).*", text)
                    if match:
                        data = match.group(0).strip()
                elif "Where:" in text:
                    match = re.search(r"(?<=Where:\s).*", text)
                    if match:
                        locatie = match.group(0).strip()
                else:
                    descriere += text + " "

                parent = parent.find_next_sibling()

            descriere = descriere.strip()
            if len(descriere) > 1000:
                descriere = descriere[:1000].rsplit(".", 1)[0] + "..."

            events.append({
                "title": title,
                "link": list_url,
                "data": data,
                "locatie": locatie,
                 "imagine": imagine,
                "descriere": descriere,
                "source": urlparse(list_url).netloc
            })

        except Exception as e:
            events.append({
                "title": "Eroare eveniment",
                "link": list_url,
                "data": "Eroare",
                "locatie": "Eroare",
                "descriere": str(e),
                 "imagine": None,
                "source": urlparse(list_url).netloc
            })

    return events


