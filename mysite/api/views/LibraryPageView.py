from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from api.models import Shelf, ShelfBooks
from api.serializers import BookSerializer
from urllib.parse import unquote  # pentru a decoda URL-uri cu spatii
from django.db.models.functions import Lower


class LibraryPageView(ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def reading_challenge(self, request):
        user = request.user
       # goal_books = int(request.query_params.get("goal_books", 0))
       # goal_pages = int(request.query_params.get("goal_pages", 0))
        
        goal_books = int(request.query_params.get("goal_books", user.goal_books))
        goal_pages = int(request.query_params.get("goal_pages", user.goal_pages))


        books_read, pages_read = self.get_reading_progress(user)
        book_data = self.get_book_challenge_progress(books_read, goal_books)
        page_data = self.get_page_challenge_progress(pages_read, goal_pages)

        return Response({
            "books_read": books_read,
            "goal_books": book_data["goal"],
            "progress_books_percent": book_data["percent"],
            "pages_read": pages_read,
            "goal_pages": page_data["goal"],
            "progress_pages_percent": page_data["percent"]
        })
        
    @action(detail=False, methods=["post"])
    def update_reading_goals(self, request):
        user = request.user
        goal_books = request.data.get("goal_books")
        goal_pages = request.data.get("goal_pages")

        if goal_books is not None:
            user.goal_books = goal_books
        if goal_pages is not None:
            user.goal_pages = goal_pages

        user.save()
        return Response({
            "message": "Reading goals updated successfully.",
            "goal_books": user.goal_books,
            "goal_pages": user.goal_pages,
        })


    @action(detail=False, methods=["get"])
    def shelves(self, request):
        user = request.user
        standard, custom = self.get_shelves(user)
        return Response({
            "standard_shelves": standard,
            "custom_shelves": custom
        })

    @action(detail=False, methods=["get"])
    def book_status(self, request):
        user = request.user
        isbn = request.query_params.get("isbn")
        if not isbn:
            return Response({"error": "ISBN is required"}, status=status.HTTP_400_BAD_REQUEST)

        standard, _ = self.get_shelves(user)
        status_data = self.check_book_in_shelves(standard, isbn)
        return Response(status_data)

    def get_reading_progress(self, user):
        shelf = Shelf.objects.filter(user=user, name="Read").first()
        read_books = ShelfBooks.objects.filter(shelf=shelf).select_related("book") if shelf else []
        books_read = len(read_books)
        pages_read = sum([b.book.nr_pages or 0 for b in read_books])
        return books_read, pages_read

    def get_book_challenge_progress(self, books_read, goal_books):
        percent = int((books_read / goal_books) * 100) if goal_books else 0
        return {"goal": goal_books, "percent": percent}

    def get_page_challenge_progress(self, pages_read, goal_pages):
        percent = int((pages_read / goal_pages) * 100) if goal_pages else 0
        return {"goal": goal_pages, "percent": percent}

    
    def get_shelves(self, user):
        standard_names = ["Read", "Reading", "Readlist", "Favourites"]
        invalid_names = ["", "0", "null", "undefined"]
        forbidden_names = [n.lower() for n in standard_names + invalid_names]

        # Colectăm rafturile standard
        standard = {}
        for name in standard_names:
            shelf = Shelf.objects.filter(user=user, name__iexact=name).first()
            books = []
            if shelf:
                shelf_books = ShelfBooks.objects.filter(shelf=shelf).select_related("book")
                books = [BookSerializer(sb.book).data for sb in shelf_books]
            standard[name] = books

        # rafturile custom,nume nevalide sau confundabile
        custom = []
        others = Shelf.objects.annotate(lower_name=Lower("name")).filter(user=user)\
            .exclude(lower_name__in=forbidden_names)\
            .exclude(name__isnull=True)

        for shelf in others:
            shelf_books = ShelfBooks.objects.filter(shelf=shelf).select_related("book")
            books = [BookSerializer(sb.book).data for sb in shelf_books]
            if shelf.name:  # extra protecție
                custom.append({
                    "shelf_name": shelf.name,
                    "books": books
                })

        if not custom:
            custom = []

        return standard, custom

    def check_book_in_shelves(self, standard_shelves, isbn):
        result = {}
        for name, books in standard_shelves.items():
            result[f"in_{name.lower()}"] = any(b.get("ISBN") == isbn for b in books)
        return result
    
    
    #un raft singur dupa nume

    @action(detail=False, methods=["get"], url_path=r"shelf/(?P<name>[^/]+)")
    def get_shelf_by_name(self, request, name=None):
        user = request.user

        if not name:
            return Response({"error": "Shelf name is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Decodare in caz că numele e URL-encoded
        decoded_name = unquote(name)

        shelf = Shelf.objects.filter(user=user, name=decoded_name).first()

        if not shelf:
            return Response({"error": f"Shelf '{decoded_name}' not found."}, status=status.HTTP_404_NOT_FOUND)

        shelf_books = ShelfBooks.objects.filter(shelf=shelf).select_related("book")
        books_data = [BookSerializer(sb.book).data for sb in shelf_books]

        return Response({
            "shelf_name": shelf.name,
        "books": books_data
    })
        
    @action(detail=False, methods=["post"])
    def create_shelf(self, request):
        user = request.user
        name = request.data.get("name")

        if not name:
            return Response({"error": "Shelf name is required"}, status=status.HTTP_400_BAD_REQUEST)

        # verific
        if Shelf.objects.filter(user=user, name=name).exists():
           return Response({"error": "A shelf with this name already exists."}, status=status.HTTP_400_BAD_REQUEST)

        shelf = Shelf.objects.create(user=user, name=name)
        return Response({"message": "Shelf created successfully.", "shelf": {"id": shelf.id, "name": shelf.name}}, status=status.HTTP_201_CREATED)

    
     
    @action(detail=False, methods=["delete"], url_path=r"delete_shelf/(?P<name>[^/]+)")
    def delete_shelf(self, request, name=None):
        user = request.user
        standard_names = ["Read", "Reading", "Readlist", "Favourites"]

        if not name:
            return Response({"error": "Shelf name is required."}, status=status.HTTP_400_BAD_REQUEST)

        decoded_name = unquote(name)

        if decoded_name.lower() in [s.lower() for s in standard_names]:
            return Response({"error": f"Cannot delete standard shelf: '{decoded_name}'."}, status=status.HTTP_403_FORBIDDEN)

        shelf = Shelf.objects.filter(user=user, name__iexact=decoded_name).first()

        if not shelf:
            return Response({"error": f"Shelf '{decoded_name}' not found."}, status=status.HTTP_404_NOT_FOUND)

        shelf.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    
    
    #fara numele raftului in url
    @action(detail=False, methods=["post"])
    def add_book_to_shelf(self, request):
        user = request.user
        shelf_name = request.data.get("shelf_name")
        book_data = request.data.get("book")

        if not shelf_name or not book_data:
            return Response({"error": "Both shelf_name and book data are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Găsim raftul (fără create)
        shelf = Shelf.objects.filter(user=user, name__iexact=shelf_name).first()
        if not shelf:
            return Response({"error": f"Shelf '{shelf_name}' does not exist."}, status=status.HTTP_404_NOT_FOUND)

        isbn = book_data.get("ISBN")
        if not isbn:
            return Response({"error": "ISBN is required."}, status=status.HTTP_400_BAD_REQUEST)

        from api.models import Book
        book, _ = Book.objects.get_or_create(ISBN=isbn, defaults=book_data)

        if ShelfBooks.objects.filter(shelf=shelf, book=book).exists():
            return Response({"message": "Book is already in this shelf."}, status=status.HTTP_200_OK)

        ShelfBooks.objects.create(shelf=shelf, book=book)
        return Response({"message": f"Book added to shelf '{shelf.name}' successfully."}, status=status.HTTP_201_CREATED)

              
              
    @action(detail=False, methods=["post"], url_path=r"add_book_to_shelf/(?P<shelf_name>[^/]+)")
    def add_book_to_shelf_url(self, request, shelf_name=None):
        user = request.user
        book_data = request.data.get("book")

        if not shelf_name or not book_data:
            return Response({"error": "Shelf name (in URL) and book data (in body) are required."}, status=status.HTTP_400_BAD_REQUEST)

        decoded_shelf_name = unquote(shelf_name)

        shelf = Shelf.objects.filter(user=user, name__iexact=decoded_shelf_name).first()
        if not shelf:
            return Response({"error": f"Shelf '{decoded_shelf_name}' does not exist."}, status=status.HTTP_404_NOT_FOUND)

        isbn = book_data.get("ISBN")
        if not isbn:
            return Response({"error": "ISBN is required."}, status=status.HTTP_400_BAD_REQUEST)

        from api.models import Book
        book, _ = Book.objects.get_or_create(ISBN=isbn, defaults=book_data)

        if ShelfBooks.objects.filter(shelf=shelf, book=book).exists():
            return Response({"message": "Book is already in this shelf."}, status=status.HTTP_200_OK)

        ShelfBooks.objects.create(shelf=shelf, book=book)
        return Response({"message": f"Book added to shelf '{shelf.name}' successfully."}, status=status.HTTP_201_CREATED)

    
                



