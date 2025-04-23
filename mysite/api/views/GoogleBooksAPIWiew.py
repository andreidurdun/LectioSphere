import requests
from datetime import datetime
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status

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

    
