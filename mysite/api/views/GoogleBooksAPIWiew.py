import requests
from datetime import datetime
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ViewSet
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import requests

#GET http://localhost:8000/api/books/search/?author=mihai eminescu HTTP/1.1
class GoogleBooksAPIView(ViewSet):
    GOOGLE_API_BASE = "https://www.googleapis.com/books/v1/volumes?q="

    def _format_books(self, items):
        results = []
        for item in items:
            book = item.get("volumeInfo", {})
            results.append({
                "title": book.get("title"),
                "authors": book.get("authors", []),
                "publisher": book.get("publisher"),
                "publishedDate": book.get("publishedDate"),
                "description": book.get("description"),
                "pageCount": book.get("pageCount"),
                "categories": book.get("categories", []),
                "thumbnail": book.get("imageLinks", {}).get("thumbnail")
            })
        return results

    @action(detail=False, methods=["get"])
    def search(self, request):
        title = request.query_params.get('title')
        author = request.query_params.get('author')
        publisher = request.query_params.get('publisher')
        isbn = request.query_params.get('isbn')
        general = request.query_params.get('q')

        if not any([title, author, publisher, general, isbn]):
            return Response({"error": "Provide at least one parameter: title, author, publisher, isbn or q."},
                            status=status.HTTP_400_BAD_REQUEST)

        query_parts = []
        if title:
            query_parts.append(f"intitle:{title}")
        if author:
            query_parts.append(f"inauthor:{author}")
        if publisher:
            query_parts.append(f"inpublisher:{publisher}")
        if isbn:
            query_parts.append(f"isbn:{isbn}")
        if general:
            query_parts.append(general)

        query = "+".join(query_parts)
        url = f"{self.GOOGLE_API_BASE}{query}&maxResults=20"

        response = requests.get(url)
        if response.status_code != 200:
            return Response({"error": "Google Books API error"}, status=response.status_code)

        items = response.json().get("items", [])
        return Response(self._format_books(items))
    
    @action(detail=False, methods=["get"])
    def category(self, request):
        category = request.query_params.get("name")

        if not category:
            return Response({"error": "Category 'name' parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        category_map = {
            "recent": "q=fiction&orderBy=newest",
            "popular": "q=bestseller&orderBy=relevance",
        }

        if category in category_map:
            url = f"https://www.googleapis.com/books/v1/volumes?{category_map[category]}&maxResults=10"
        else:
            url = f"https://www.googleapis.com/books/v1/volumes?q=subject:{category}&maxResults=10"

        response = requests.get(url)

        if response.status_code != 200:
            return Response({"error": "Google Books API error"}, status=response.status_code)

        items = response.json().get("items", [])
        return Response(self._format_books(items))


    # model = SentenceTransformer('all-MiniLM-L6-v2')
    # @action(detail=False, methods=["post"])
    # def recommendation(self, request):
    #     input_description = request.data.get("description")
    #     if not input_description:
    #         return Response({"error": "Missing 'description'"}, status=status.HTTP_400_BAD_REQUEST)

    #     # 1. Căutăm cărți de bază (poți schimba genul aici)
    #     url = "https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=20"
    #     response = requests.get(url)
    #     if response.status_code != 200:
    #         return Response({"error": "Failed to fetch from Google Books"}, status=500)

    #     books = response.json().get("items", [])
    #     formatted_books = self._format_books(books)

    #     # 2. Extragem doar cele cu descriere
    #     books_with_desc = [b for b in formatted_books if b["description"]]
    #     if not books_with_desc:
    #         return Response({"error": "No books with description found"}, status=404)

    #     # 3. Facem embeddings
    #     descriptions = [b["description"] for b in books_with_desc]
    #     book_embeddings = self.model.encode(descriptions)
    #     input_embedding = self.model.encode([input_description])

    #     # 4. Similaritate cosine
    #     sims = cosine_similarity(input_embedding, book_embeddings)[0]
    #     top_indices = np.argsort(sims)[::-1][:5]

    #     # 5. Returnăm top 5 recomandări
    #     recommended_books = [books_with_desc[i] | {"similarity": round(float(sims[i]), 3)} for i in top_indices]
    #     return Response({"recommendations": recommended_books})

    
