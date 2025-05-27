# views/ShelfByNameView.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from urllib.parse import unquote

from api.models import Shelf, ShelfBooks
from api.serializers import BookSerializer


class ShelfByNameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, name):
        user = request.user
        decoded_name = unquote(name)

        # Caută raftul doar pentru userul curent
        shelf = Shelf.objects.filter(user=user, name=decoded_name).first()

        if not shelf:
            return Response(
                {"error": f"Shelf '{decoded_name}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Obține cărțile, chiar dacă lista va fi goală
        shelf_books = ShelfBooks.objects.filter(shelf=shelf).select_related("book")
        books_data = [BookSerializer(sb.book).data for sb in shelf_books]

        return Response({
            "shelf_name": shelf.name,
            "books": books_data  # va fi [] dacă nu există cărți
        })
