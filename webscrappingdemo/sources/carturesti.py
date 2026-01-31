# webscrappingdemo/sources/carturesti.py

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time

def get_carturesti_events():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.binary_location = "/usr/bin/chromium"
    driver = webdriver.Chrome(options=options)
    driver.get("https://blog.carturesti.ro/category/evenimente/")
    time.sleep(3)

    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()

    events = []

    for article in soup.select("article"):
        title_tag = article.select_one("div.article__title")
        link_tag = article.select_one("a")

        if title_tag and link_tag:
            events.append({
                "title": title_tag.text.strip(),
                "link": link_tag["href"],
                "source": "Carturesti"
            })

    return events
