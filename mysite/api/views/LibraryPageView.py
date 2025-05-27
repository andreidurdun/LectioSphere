from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from api.models import Shelf, ShelfBooks
from api.serializers import BookSerializer
from urllib.parse import unquote  # pentru a decoda URL-uri cu spații, %20 etc.


class LibraryPageView(ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def reading_challenge(self, request):
        user = request.user
        goal_books = int(request.query_params.get("goal_books", 0))
        goal_pages = int(request.query_params.get("goal_pages", 0))

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
        standard = {}
        for name in standard_names:
            shelf = Shelf.objects.filter(user=user, name=name).first()
            books = []
            if shelf:
                shelf_books = ShelfBooks.objects.filter(shelf=shelf).select_related("book")
                books = [BookSerializer(sb.book).data for sb in shelf_books]
            standard[name] = books

        custom = []
        others = Shelf.objects.filter(user=user).exclude(name__in=standard_names)
        for shelf in others:
            shelf_books = ShelfBooks.objects.filter(shelf=shelf).select_related("book")
            books = [BookSerializer(sb.book).data for sb in shelf_books]
            custom.append({
                "shelf_name": shelf.name,
                "books": books
            })

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

        # Decodare în caz că numele e URL-encoded
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


