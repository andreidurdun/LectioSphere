from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import Shelf, ShelfBooks
from api.serializers import BookSerializer

class LibraryPageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        isbn = request.query_params.get("isbn")  # opțional, pt verificare carte

        # Reading Challenge
        read_shelf = Shelf.objects.filter(user=user, name="Read").first()
        read_books = ShelfBooks.objects.filter(shelf=read_shelf).select_related("book") if read_shelf else []
        books_read = len(read_books)
        pages_read = sum([b.book.nr_pages or 0 for b in read_books])

        goal_books = 15
        goal_pages = 6500

        
        standard_names = ["Read", "Reading", "Readlist", "Favourites"]
        standard_shelves = {}

        for name in standard_names:
            shelf = Shelf.objects.filter(user=user, name=name).first()
            if shelf:
                shelf_books = ShelfBooks.objects.filter(shelf=shelf).select_related("book")
                books = [BookSerializer(sb.book).data for sb in shelf_books]
                standard_shelves[name] = books
            else:
                standard_shelves[name] = []

        # raf custom
        custom_shelves = []
        other_shelves = Shelf.objects.filter(user=user).exclude(name__in=standard_names)

        for shelf in other_shelves:
            shelf_books = ShelfBooks.objects.filter(shelf=shelf).select_related("book")
            books = [BookSerializer(sb.book).data for sb in shelf_books]
            custom_shelves.append({
                "shelf_name": shelf.name,
                "books": books
            })

        # verif carte in rafturi
        book_status = {}
        if isbn:
            for name, books in standard_shelves.items():
                book_status[f"in_{name.lower()}"] = any(b.get("ISBN") == isbn for b in books)

        # return final
        return Response({
            # Reading Challenge
            "books_read": books_read,
            "goal_books": goal_books,
            "progress_books_percent": int((books_read / goal_books) * 100) if goal_books else 0,
            "pages_read": pages_read,
            "goal_pages": goal_pages,
            "progress_pages_percent": int((pages_read / goal_pages) * 100) if goal_pages else 0,

            # rfturi
            "read": standard_shelves["Read"],
            "reading": standard_shelves["Reading"],
            "readlist": standard_shelves["Readlist"],
            "favourites": standard_shelves["Favourites"],
            "custom_shelves": custom_shelves,

            # Dc s a cerut un ISBN
            "book_status": book_status if isbn else None
        })
