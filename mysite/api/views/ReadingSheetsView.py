from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import ReadingSheet
from api.serializers import ReadingSheetSerializer

class ReadingSheetsView(ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user

        sheets = ReadingSheet.objects.filter(user=user).select_related("book", "shelf")
        grouped_by_shelf = {}

        for sheet in sheets:
            shelf_name = sheet.shelf.name if sheet.shelf else "Fără raft"
            sheet_data = ReadingSheetSerializer(sheet).data
            grouped_by_shelf.setdefault(shelf_name, []).append(sheet_data)

        return Response(grouped_by_shelf)

    @action(detail=False, methods=["get"], url_path="latest")
    def get_latest_titles_authors(self, request):
        user = request.user

        latest_sheets = (
            ReadingSheet.objects
            .filter(user=user)
            .select_related("book")
            .order_by("-id")[:5]
        )

        data = [
            {
                "title": sheet.book.title,
                "author": sheet.book.author
            }
            for sheet in latest_sheets
            if sheet.book
        ]

        return Response(data)

    @action(detail=False, methods=["get"], url_path="simple")
    def get_all_titles_authors(self, request):
        user = request.user

        all_sheets = ReadingSheet.objects.filter(user=user).select_related("book")

        data = [
            {
                "title": sheet.book.title,
                "author": sheet.book.author
            }
            for sheet in all_sheets
            if sheet.book
        ]

        return Response(data)
