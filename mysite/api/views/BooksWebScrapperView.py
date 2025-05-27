import time
from urllib.parse import urljoin

from django.http import JsonResponse
from django.views import View

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import re
options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")
options.add_argument("--window-size=1920,1080")
options.add_argument("user-agent=Mozilla/5.0")
options.add_argument("--disable-software-rasterizer")
options.add_argument("--disable-webgl")
options.add_argument("--disable-webgl2")
# optional dacă vrei fallback software:
options.add_argument("--enable-unsafe-swiftshader")


class BooksWebScrapperView(View):
    def get(self, request):
        urls = {
            "amazon": "https://www.amazon.com/hz/wishlist/ls/3I7REYP108L6U?ref_=wl_share",
            "freebooksy": "https://www.freebooksy.com/featured-books/"
        }

        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("user-agent=Mozilla/5.0")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)

        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        })

        try:
            amazon_books = self.scrape_books(driver, urls["amazon"])
            freebooksy_books = self.scrape_freebooksy_books(driver, urls["freebooksy"])

            return JsonResponse({
                "amazon": amazon_books,
                "freebooksy": freebooksy_books
            }, safe=False, json_dumps_params={"indent": 2, "ensure_ascii": False})
        finally:
            driver.quit()

    def scrape_books(self, driver, list_url):
        driver.get(list_url)
        time.sleep(5)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        books = []

        items = soup.select("div[id^='itemMain_']")
        for item in items:
            try:
                title_tag = item.select_one("a[href*='/dp/']")
                title = title_tag.get_text(strip=True) if title_tag else "Fără titlu"
                link = urljoin(list_url, title_tag["href"]) if title_tag else list_url
                author_tag = item.select_one("span[id^='item-byline-']")
                author_text = author_tag.get_text(strip=True) if author_tag else "Autor necunoscut"
                author = author_text.replace("by ", "").replace("(Kindle Edition)", "").strip()
                image_tag = item.find_previous("img")
                image = image_tag["src"] if image_tag else None

                books.append({
                    "title": title,
                    "author": author,
                    "link": link,
                    "image": image
                })
            except Exception:
                continue
        return books
    def scrape_freebooksy_books(self, driver, list_url):
        driver.get(list_url)
        time.sleep(5)

        soup = BeautifulSoup(driver.page_source, "html.parser")
        articles = soup.select("article.blog-post")
        books = []

        for article in articles:
                    try:
                        detail_link = article.select_one("a")["href"]
                        if detail_link:
                            book = self.scrape_freebooksy_detail(driver, detail_link)
                            books.append(book)
                    except Exception:
                        continue

        return books                

    def scrape_freebooksy_detail(self, driver, detail_url):
        driver.get(detail_url)
        time.sleep(5)
        soup = BeautifulSoup(driver.page_source, "html.parser")

        try:
            # 1. Titlu și link
            title_tag = soup.select_one("div.col-md-8 a[href*='amazon.com/dp']")
            title = title_tag.get_text(strip=True) if title_tag else "Fără titlu"
            link = title_tag["href"] if title_tag and title_tag.has_attr("href") else detail_url

            # 2. Autor: căutăm în același <p> cu titlul
            author = "Autor necunoscut"
            p_tag = title_tag.find_parent("p") if title_tag else None
            if p_tag:
                full_text = p_tag.get_text(strip=True)
                match = re.search(r'by ([^:]+)', full_text)
                if match:
                    author = match.group(1).strip()

            # 3. Imagine copertă
            img_tag = soup.select_one("img[data-lazy-src], img[src]")
            image = img_tag.get("data-lazy-src") or img_tag.get("src") if img_tag else None

            # 4. Data gratuită
            free_date_tag = soup.find("p", string=re.compile(r"This book is Free on"))
            free_date = free_date_tag.get_text(strip=True) if free_date_tag else None

            return {
                "title": title,
                "author": author,
                "link": link,
                "image": image,
                "free_date": free_date
            }

        except Exception as e:
            return {
                "error": str(e),
                "url": detail_url
            }
