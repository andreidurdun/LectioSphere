from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from ..models import Book, Shelf, ShelfBooks
from ..serializers import BookSerializer, ShelfSerializer, ShelfBooksSerializer

class BooksView(ViewSet):

    @action(detail=False, methods=["post"])
    def add_to_currently_reading(self, request):
        user = request.user  # obtine utilizatorul autentificat
        book_data = request.data.get("book")  # obtine datele cartii din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # verificam daca cartea exista deja in baza de date
        book, created = Book.objects.get_or_create(
            ISBN=book_data.get("ISBN"),
            defaults={
                "id" : book_data.get("id"),
                "title": book_data.get("title"),
                "author": book_data.get("author"),
                "genre": book_data.get("genre"),
                "rating": book_data.get("rating"),
                "nr_pages": book_data.get("nr_pages"),
                "publication_year": book_data.get("publication_year"),
                "series": book_data.get("series"),
                "description": book_data.get("description"),
                "cover": book_data.get("thumbnail"),
            },
        )

        # verificam daca raftul "Currently Reading" exista pentru utilizator
        shelf, created = Shelf.objects.get_or_create(
            user=user,
            name="Currently Reading",
        )

        # adaugam cartea in tabela de legatura ShelfBooks
        shelf_books, created = ShelfBooks.objects.get_or_create(shelf=shelf, book=book)

        if not created:
            return Response({"message": "Book is already in 'currently reading'"}, status=status.HTTP_200_OK)

        serializer = ShelfBooksSerializer(shelf_books)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def add_to_read(self, request):
        user = request.user  
        book_data = request.data.get("book")  # obtine datele cartii din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # verificam daca cartea exista deja in baza de date
        book, created = Book.objects.get_or_create(
            ISBN=book_data.get("ISBN"),
            defaults={
                "id" : book_data.get("id"),
                "title": book_data.get("title"),
                "author": book_data.get("author"),
                "genre": book_data.get("genre"),
                "rating": book_data.get("rating"),
                "nr_pages": book_data.get("nr_pages"),
                "publication_year": book_data.get("publication_year"),
                "series": book_data.get("series"),
                "description": book_data.get("description"),
                "cover": book_data.get("thumbnail"),
            },
        )

        # verificam daca raftul "Read" exista pentru utilizator
        shelf, created = Shelf.objects.get_or_create(
            user=user,
            name="Read",
        )

        # adaugam cartea in tabela de legatura ShelfBooks
        shelf_books, created = ShelfBooks.objects.get_or_create(shelf=shelf, book=book)

        if not created:
            return Response({"message": "Book is already in 'read books'"}, status=status.HTTP_200_OK)

        serializer = ShelfBooksSerializer(shelf_books)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=["post"])
    def add_to_read_list(self, request):
        user = request.user  
        book_data = request.data.get("book")  # obtine datele cartii din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # verificam daca cartea exista deja in baza de date
        book, created = Book.objects.get_or_create(
            ISBN=book_data.get("ISBN"), #criteriul dupa care se cauta in bd
            defaults={
                "id" : book_data.get("id"),
                "title": book_data.get("title"),
                "author": book_data.get("author"),
                "genre": book_data.get("genre"),
                "rating": book_data.get("rating"),
                "nr_pages": book_data.get("nr_pages"),
                "publication_year": book_data.get("publication_year"),
                "series": book_data.get("series"),
                "description": book_data.get("description"),
                "cover": book_data.get("thumbnail"),
            },
        )

        # verificam daca raftul "Want to Read" exista pentru utilizator
        shelf, created = Shelf.objects.get_or_create(
            user=user,
            name="Read List",
        )

        # adaugam cartea in tabela de legatura ShelfBooks
        shelf_books, created = ShelfBooks.objects.get_or_create(shelf=shelf, book=book)

        if not created:
            return Response({"message": "Book is already in 'want to read'"}, status=status.HTTP_200_OK)

        serializer = ShelfBooksSerializer(shelf_books)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=["delete"])
    def remove_from_currently_reading(self, request):
        user = request.user  
        book_data = request.data.get("ISBN")  # obtine datele cartii din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # verificam daca raftul "Currently Reading" exista pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Currently Reading").first()

        if not shelf:
            return Response({"error": "Shelf 'Currently Reading' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # cautam cartea in tabela de legatura ShelfBooks
        shelf_books = ShelfBooks.objects.filter(shelf=shelf, book__ISBN=book_data).first()

        if not shelf_books:
            return Response({"error": "Book not found in 'currently reading'"}, status=status.HTTP_404_NOT_FOUND)

        # stergem cartea din tabela de legatura ShelfBooks
        shelf_books.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=["delete"])
    def remove_from_read(self, request):
        user = request.user  
        book_data = request.data.get("ISBN")  # obtine datele cartii din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # verificam daca raftul "Read" exista pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Read").first()

        if not shelf:
            return Response({"error": "Shelf 'Read' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # cautam cartea in tabela de legatura ShelfBooks
        shelf_books = ShelfBooks.objects.filter(shelf=shelf, book__ISBN=book_data).first()

        if not shelf_books:
            return Response({"error": "Book not found in 'read'"}, status=status.HTTP_404_NOT_FOUND)

        # stergem cartea din tabela de legatura ShelfBooks
        shelf_books.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=["delete"])
    def remove_from_read_list(self, request):
        user = request.user  
        book_data = request.data.get("ISBN")  # obtine datele cartii din cerere

        if not book_data:
            return Response({"error": "Missing 'book' data in request"}, status=status.HTTP_400_BAD_REQUEST)

        # verificam daca raftul "Read List" exista pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Read List").first()

        if not shelf:
            return Response({"error": "Shelf 'Read List' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # cautam cartea in tabela de legatura ShelfBooks
        shelf_books = ShelfBooks.objects.filter(shelf=shelf, book__ISBN=book_data).first()

        if not shelf_books:
            return Response({"error": "Book not found in 'read list'"}, status=status.HTTP_404_NOT_FOUND)

        # stergem cartea din tabela de legatura ShelfBooks
        shelf_books.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=["get"])
    def get_currently_reading(self, request):
        user = request.user  # obtine utilizatorul autentificat

        # verificam daca raftul "Currently Reading" exista pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Currently Reading").first()

        if not shelf:
            return Response({"error": "Shelf 'Currently Reading' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # obtinem toate cartile din raftul "Currently Reading"
        shelf_books = ShelfBooks.objects.filter(shelf=shelf)
        books = [shelf_book.book for shelf_book in shelf_books]
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def get_read(self, request):
        user = request.user  # obtine utilizatorul autentificat

        # verificam daca raftul "Read" exista pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Read").first()

        if not shelf:
            return Response({"error": "Shelf 'Read' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # obtinem toate cartile din raftul "Read"
        shelf_books = ShelfBooks.objects.filter(shelf=shelf)
        books = [shelf_book.book for shelf_book in shelf_books]
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def get_read_list(self, request):
        user = request.user  # obtine utilizatorul autentificat

        # verificam daca raftul "Read List" exista pentru utilizator
        shelf = Shelf.objects.filter(user=user, name="Read List").first()

        if not shelf:
            return Response({"error": "Shelf 'Read List' does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # obtinem toate cartile din raftul "Read List"
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
        

    @action(detail=False, methods=["get"])
    def get_friends_books(self, request):
        user = request.user
        
        # persoanele pe care le urmareste utilizatorul
        following_profiles = user.profile.following.all()

        if not following_profiles:
            return Response({"message": "You are not following anyone."}, status=status.HTTP_200_OK)
        
        # rafturile Read ale persoanelor urmarite
        shelves = Shelf.objects.filter(user__profile__in=following_profiles, name="Currently Reading")

        if not shelves:
            return Response({"message": "No friends are reading books."}, status=status.HTTP_200_OK)
        
        # obtinem toate cartile din rafturile Read ale persoanelor urmarite
        shelf_books = ShelfBooks.objects.filter(shelf__in=shelves)
        books = [shelf_book.book for shelf_book in shelf_books]

        if not books:
            return Response({"error": "No books found in 'Read' shelves of followed users."}, status=status.HTTP_404_NOT_FOUND)

        serializer = BookSerializer(books, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)