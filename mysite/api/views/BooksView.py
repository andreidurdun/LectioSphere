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

    @action(detail=False, methods=["post"])
    def add_to_read(self, request):
        user = request.user  
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

        # Verificăm dacă raftul "Read" există pentru utilizator
        shelf, created = Shelf.objects.get_or_create(
            user=user,
            name="Read",
        )

        # Adăugăm cartea în tabela de legătură ShelfBooks
        shelf_books, created = ShelfBooks.objects.get_or_create(shelf=shelf, book=book)

        if not created:
            return Response({"message": "Book is already in 'read books'"}, status=status.HTTP_200_OK)

        serializer = ShelfBooksSerializer(shelf_books)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=["post"])
    def add_to_read_list(self, request):
        user = request.user  
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

        # Verificăm dacă raftul "Want to Read" există pentru utilizator
        shelf, created = Shelf.objects.get_or_create(
            user=user,
            name="Read List",
        )

        # Adăugăm cartea în tabela de legătură ShelfBooks
        shelf_books, created = ShelfBooks.objects.get_or_create(shelf=shelf, book=book)

        if not created:
            return Response({"message": "Book is already in 'want to read'"}, status=status.HTTP_200_OK)

        serializer = ShelfBooksSerializer(shelf_books)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=["delete"])
    def remove_from_currently_reading(self, request):
        user = request.user  
        book_data = request.data.get("ISBN")  # Obține datele cărții din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # Verificăm dacă raftul "Currently Reading" există pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Currently Reading").first()

        if not shelf:
            return Response({"error": "Shelf 'Currently Reading' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Căutăm cartea în tabela de legătură ShelfBooks
        shelf_books = ShelfBooks.objects.filter(shelf=shelf, book__ISBN=book_data).first()

        if not shelf_books:
            return Response({"error": "Book not found in 'currently reading'"}, status=status.HTTP_404_NOT_FOUND)

        # Ștergem cartea din tabela de legătură ShelfBooks
        shelf_books.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=["delete"])
    def remove_from_read(self, request):
        user = request.user  
        book_data = request.data.get("ISBN")  # Obține datele cărții din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # Verificăm dacă raftul "Read" există pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Read").first()

        if not shelf:
            return Response({"error": "Shelf 'Read' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Căutăm cartea în tabela de legătură ShelfBooks
        shelf_books = ShelfBooks.objects.filter(shelf=shelf, book__ISBN=book_data).first()

        if not shelf_books:
            return Response({"error": "Book not found in 'read'"}, status=status.HTTP_404_NOT_FOUND)

        # Ștergem cartea din tabela de legătură ShelfBooks
        shelf_books.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=["delete"])
    def remove_from_read_list(self, request):
        user = request.user  
        book_data = request.data.get("ISBN")  # Obține datele cărții din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # Verificăm dacă raftul "Read List" există pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Read List").first()

        if not shelf:
            return Response({"error": "Shelf 'Read List' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Căutăm cartea în tabela de legătură ShelfBooks
        shelf_books = ShelfBooks.objects.filter(shelf=shelf, book__ISBN=book_data).first()

        if not shelf_books:
            return Response({"error": "Book not found in 'read list'"}, status=status.HTTP_404_NOT_FOUND)

        # Ștergem cartea din tabela de legătură ShelfBooks
        shelf_books.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=["get"])
    def get_currently_reading(self, request):
        user = request.user  # Obține utilizatorul autentificat

        # Verificăm dacă raftul "Currently Reading" există pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Currently Reading").first()

        if not shelf:
            return Response({"error": "Shelf 'Currently Reading' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Obținem toate cărțile din raftul "Currently Reading"
        shelf_books = ShelfBooks.objects.filter(shelf=shelf)
        books = [shelf_book.book for shelf_book in shelf_books]
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def get_read(self, request):
        user = request.user  # Obține utilizatorul autentificat

        # Verificăm dacă raftul "Read" există pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Read").first()

        if not shelf:
            return Response({"error": "Shelf 'Read' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Obținem toate cărțile din raftul "Read"
        shelf_books = ShelfBooks.objects.filter(shelf=shelf)
        books = [shelf_book.book for shelf_book in shelf_books]
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def get_read_list(self, request):
        user = request.user  # Obține utilizatorul autentificat

        # Verificăm dacă raftul "Read List" există pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Read List").first()

        if not shelf:
            return Response({"error": "Shelf 'Read List' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Obținem toate cărțile din raftul "Read List"
        shelf_books = ShelfBooks.objects.filter(shelf=shelf)
        books = [shelf_book.book for shelf_book in shelf_books]
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def get_book(self, request, isbn):
        try:
            book = Book.objects.get(ISBN=isbn)
            serializer = BookSerializer(book)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Book.DoesNotExist:
            return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
        

        