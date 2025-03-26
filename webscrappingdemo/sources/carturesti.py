# webscrappingdemo/sources/carturesti.py

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time

def get_carturesti_events():
    options = Options()
    options.add_argument("--headless")
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
