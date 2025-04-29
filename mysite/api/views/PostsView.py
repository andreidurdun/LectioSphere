from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import Post, Book
from api.serializers import PostSerializer, BookSerializer
from rest_framework.viewsets import ViewSet
import json  # <-- adaugă acest import!
import requests


class PostsView(ViewSet):
    permission_classes = [IsAuthenticated]

    def add_post(self, request):
        user = request.user

        description = request.data.get('description')
        action = request.data.get('action')
        rating = request.data.get('rating')

        # pentru a ne referi la cartea despre care vrem sa postam, o vom identiifca in postare dupa ISBN (dam ca si input ISBN-ul apoi cautarea es va face automat)
        ISBN = request.data.get('ISBN')   

        if not ISBN:
            return Response({"error": "ISBN is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Cautăm cartea în baza noastră locală mai întâi
        book = Book.objects.filter(ISBN=ISBN).first()

        if not book:
            # Dacă nu există local, căutăm în Google Books API
            google_api_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{ISBN}"
            response = requests.get(google_api_url)

            if response.status_code != 200:
                return Response({"error": "Failed to fetch book from Google Books"}, status=status.HTTP_502_BAD_GATEWAY)

            data = response.json()

            if "items" not in data or len(data["items"]) == 0:
                return Response({"error": "No book found with the provided ISBN"}, status=status.HTTP_404_NOT_FOUND)

            # Extragem informațiile importante
            book_info = data["items"][0]["volumeInfo"]
            title = book_info.get("title")
            authors = ", ".join(book_info.get("authors", []))  # list to string
            published_date = book_info.get("publishedDate")
            description_book = book_info.get("description", "")
            page_count = book_info.get("pageCount", 0)
            thumbnail = book_info.get("imageLinks", {}).get("thumbnail", "")
            categories = ", ".join(book_info.get("categories", []))

            # Creăm cartea local
            book = Book.objects.create(
                title=title,
                author=authors,
                ISBN=ISBN,
                genre=categories, 
                rating="1",
                nr_pages=page_count,  
                publication_year=int(published_date[:4]) if published_date else None,
                series="None",
                description=description_book,
            )   

        # Acum avem cartea (fie existentă, fie creată acum)

        # Creăm Post-ul
        post = Post.objects.create(
            user=user,
            book=book,
            description=description,
            action=action,
            rating=rating,
        )

        serializer = PostSerializer(post)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
