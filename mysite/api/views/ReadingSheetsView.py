from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import ReadingSheet, Shelf
from api.serializers import ReadingSheetSerializer

class ReadingSheetsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # toate fișele de lectur ale utilz
        sheets = ReadingSheet.objects.filter(user=user).select_related("book", "shelf")

        #  fisele de lectura pe rafturi
        grouped_by_shelf = {}

        for sheet in sheets:
            shelf_name = sheet.shelf.name if sheet.shelf else "Fără raft"
            sheet_data = ReadingSheetSerializer(sheet).data
            grouped_by_shelf.setdefault(shelf_name, []).append(sheet_data)

        return Response(grouped_by_shelf)
