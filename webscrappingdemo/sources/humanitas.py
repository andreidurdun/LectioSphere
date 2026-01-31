from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from bs4 import BeautifulSoup
import time

def get_humanitas_events():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.binary_location = "/usr/bin/chromium"
    driver = webdriver.Chrome(options=options)

    url = "https://humanitas.ro/grupul-humanitas/evenimente/"
    driver.get(url)

    time.sleep(5)

    # Scroll puțin ca să declanșăm încărcarea
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.PAGE_DOWN)
    time.sleep(3)

    # BeautifulSoup preia HTML-ul rulat de browser
    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()

    events = []

    for entry in soup.select("div.entry"):
        title_tag = entry.find("p") or entry.find("h2") or entry.find("h3")
        if title_tag:
            title = title_tag.text.strip()
            if title and len(title) > 10:  # filtrăm texte scurte și nefolositoare
                events.append({
                    "title": title,
                    "link": url,
                    "source": "Humanitas"
                })

    return events

# test
if __name__ == "__main__":
    events = get_humanitas_events()
    for e in events:
        print(f"[{e['source']}] {e['title']}\n🔗 {e['link']}\n")
