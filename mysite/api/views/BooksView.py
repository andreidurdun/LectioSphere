from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from ..models import Book, Shelf, ShelfBooks
from ..serializers import BookSerializer, ShelfSerializer, ShelfBooksSerializer

class BooksView(ViewSet):

    @action(detail=False, methods=["post"])
    def add_to_currently_reading(self, request):
        user = request.user  # Obține utilizatorul autentificat
        book_data = request.data.get("book")  # Obține datele cărții din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # Verificăm dacă cartea există deja în baza de date
        book, created = Book.objects.get_or_create(
            ISBN=book_data.get("ISBN"),
            defaults={
                "title": book_data.get("title"),
                "author": book_data.get("author"),
                "genre": book_data.get("genre"),
                "rating": book_data.get("rating"),
                "nr_pages": book_data.get("nr_pages"),
                "publication_year": book_data.get("publication_year"),
                "series": book_data.get("series"),
                "description": book_data.get("description"),
                # "thumbnail": book_data.get("thumbnail"),
            },
        )

        # Verificăm dacă raftul "Currently Reading" există pentru utilizator
        shelf, created = Shelf.objects.get_or_create(
            user=user,
            name="Currently Reading",
        )

        # Adăugăm cartea în tabela de legătură ShelfBooks
        shelf_books, created = ShelfBooks.objects.get_or_create(shelf=shelf, book=book)

        if not created:
            return Response({"message": "Book is already in 'currently reading'"}, status=status.HTTP_200_OK)

        serializer = ShelfBooksSerializer(shelf_books)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

