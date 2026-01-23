from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from api.models import ReadingSheet, Book, Shelf
from api.models.UserPreferences import UserPreferences
from api.serializers import ReadingSheetSerializer

MODEL_SCHEMAS = {
    # model 1
    "book_review": ["summary", "rating", "favorite_quote", "themes", "characters"],
    # model 2
    "reading_notes": ["notes", "takeaways", "questions", "vocabulary"],
    # model 3
    "reading_reflections": ["days", "progress", "rewards", "reflection"],
}

class ReadingSheetsView(ViewSet):
    permission_classes = [IsAuthenticated]

    # ---------------------------
    # helpers
    # ---------------------------
    def _get_book(self, book_id):
        return Book.objects.filter(id=book_id).first()

    def _get_shelf(self, user, shelf_id):
        if not shelf_id:
            return None
        return Shelf.objects.filter(id=shelf_id, user=user).first()

    def _create_sheet(self, request, model_type: str):
        user = request.user
        prefs, _ = UserPreferences.objects.get_or_create(user=user)

        book_id = request.data.get("book")
        shelf_id = request.data.get("shelf")
        text = request.data.get("text")
        data = request.data.get("data", {}) or {}

        if not book_id:
            return Response({"error": "book is required"}, status=status.HTTP_400_BAD_REQUEST)

        book = self._get_book(book_id)
        if not book:
            return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

        shelf = self._get_shelf(user, shelf_id)
        if shelf_id and not shelf:
            return Response({"error": "Shelf not found"}, status=status.HTTP_404_NOT_FOUND)

        # validate
        if model_type == "basic":
            if not text:
                return Response({"error": "text is required for basic"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            if model_type not in MODEL_SCHEMAS:
                return Response({"error": f"Unknown model_type: {model_type}"}, status=status.HTTP_400_BAD_REQUEST)

            required_keys = MODEL_SCHEMAS[model_type]
            missing = [k for k in required_keys if k not in data or data[k] in [None, ""]]
            if missing:
                return Response(
                    {"error": f"Missing fields for {model_type}", "missing": missing},
                    status=status.HTTP_400_BAD_REQUEST
                )

        sheet = ReadingSheet.objects.create(
            user=user,
            book=book,
            shelf=shelf,
            model_type=model_type,
            text=text if model_type == "basic" else None,
            data=data if model_type != "basic" else {},
        )

        # retine modelul preferat
        prefs.preferred_model = model_type
        prefs.save()

        return Response(ReadingSheetSerializer(sheet).data, status=status.HTTP_201_CREATED)

    # ---------------------------
    # CRUD (manual, ca la posts)
    # ---------------------------

    # GET /reading-sheets/
    @action(detail=False, methods=["get"])
    def list_sheets(self, request):
        user = request.user
        sheets = ReadingSheet.objects.filter(user=user).select_related("book", "shelf")

        grouped_by_shelf = {}
        for sheet in sheets:
            shelf_name = sheet.shelf.name if sheet.shelf else "Fără raft"
            sheet_data = ReadingSheetSerializer(sheet).data
            grouped_by_shelf.setdefault(shelf_name, []).append(sheet_data)

        return Response(grouped_by_shelf)

    # GET /reading-sheets/<id>/
    @action(detail=True, methods=["get"])
    def read_sheet(self, request, pk=None):
        sheet = ReadingSheet.objects.filter(pk=pk, user=request.user).first()
        if not sheet:
            return Response({"error": "ReadingSheet not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReadingSheetSerializer(sheet).data)

    # PATCH/PUT /reading-sheets/<id>/update/
    @action(detail=True, methods=["put", "patch"])
    def update_sheet(self, request, pk=None):
        sheet = ReadingSheet.objects.filter(pk=pk, user=request.user).first()
        if not sheet:
            return Response({"error": "ReadingSheet not found"}, status=status.HTTP_404_NOT_FOUND)

        # update text (doar daca e basic sau vrei sa permiti oricum)
        if "text" in request.data:
            sheet.text = request.data.get("text")

        # update shelf
        if "shelf" in request.data:
            shelf_id = request.data.get("shelf")
            if shelf_id in [None, "", 0]:
                sheet.shelf = None
            else:
                shelf = Shelf.objects.filter(id=shelf_id, user=request.user).first()
                if not shelf:
                    return Response({"error": "Shelf not found"}, status=status.HTTP_404_NOT_FOUND)
                sheet.shelf = shelf

        # update book
        if "book" in request.data:
            book_id = request.data.get("book")
            book = Book.objects.filter(id=book_id).first()
            if not book:
                return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
            sheet.book = book

        # update data (pentru modele)
        if "data" in request.data:
            incoming = request.data.get("data") or {}
            if not isinstance(incoming, dict):
                return Response({"error": "data must be an object/dict"}, status=status.HTTP_400_BAD_REQUEST)

            # optional: validare required la update (daca vrei)
            if sheet.model_type != "basic" and sheet.model_type in MODEL_SCHEMAS:
                merged = {**(sheet.data or {}), **incoming}
                required_keys = MODEL_SCHEMAS[sheet.model_type]
                missing = [k for k in required_keys if k not in merged or merged[k] in [None, ""]]
                if missing:
                    return Response(
                        {"error": f"Missing fields for {sheet.model_type}", "missing": missing},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                sheet.data = merged
            else:
                # basic: ignora data sau o salvezi daca vrei
                sheet.data = incoming

        sheet.save()
        return Response(ReadingSheetSerializer(sheet).data)

    # DELETE /reading-sheets/<id>/delete/
    @action(detail=True, methods=["delete"])
    def delete_sheet(self, request, pk=None):
        sheet = ReadingSheet.objects.filter(pk=pk, user=request.user).first()
        if not sheet:
            return Response({"error": "ReadingSheet not found"}, status=status.HTTP_404_NOT_FOUND)

        sheet.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ---------------------------
    # Create endpoints pe modele
    # ---------------------------

    # POST /reading-sheets/basic/
    @action(detail=False, methods=["post"], url_path="basic")
    def create_basic(self, request):
        return self._create_sheet(request, "basic")

    # POST /reading-sheets/book-review/
    @action(detail=False, methods=["post"], url_path="book-review")
    def create_book_review(self, request):
        return self._create_sheet(request, "book_review")

    # POST /reading-sheets/reading-notes/
    @action(detail=False, methods=["post"], url_path="reading-notes")
    def create_reading_notes(self, request):
        return self._create_sheet(request, "reading_notes")

    # POST /reading-sheets/reading-reflections/
    @action(detail=False, methods=["post"], url_path="reading-reflections")
    def create_reading_reflections(self, request):
        return self._create_sheet(request, "reading_reflections")
    
        # GET /reading-sheets/<id>/
    @action(detail=True, methods=["get"])
    def read_sheet(self, request, pk=None):
        sheet = ReadingSheet.objects.filter(pk=pk, user=request.user).first()
        if not sheet:
            return Response({"error": "ReadingSheet not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReadingSheetSerializer(sheet).data)

