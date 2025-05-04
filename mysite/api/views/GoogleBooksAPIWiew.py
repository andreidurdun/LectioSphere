import requests
from datetime import datetime
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
from api.models import Book, Shelf, ShelfBooks

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ViewSet

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import requests

from accounts.models import Profile

#GET http://localhost:8000/api/books/search/?author=mihai eminescu HTTP/1.1
class GoogleBooksAPIView(ViewSet):
    GOOGLE_API_BASE = "https://www.googleapis.com/books/v1/volumes?q="

    

    def _format_books(self, items):
        results = []

        for item in items:
            book = item.get("volumeInfo", {})
        
            # extrage isbn_13 sau isbn_10
            industry_ids = book.get("industryIdentifiers", [])
            isbn_13 = None
            isbn_10 = None
            
            for id_info in industry_ids:
                if id_info.get("type") == "ISBN_13":
                    isbn_13 = id_info.get("identifier")
                elif id_info.get("type") == "ISBN_10":
                    isbn_10 = id_info.get("identifier")
            
            isbn = isbn_13 or isbn_10

            results.append({
                "id": item.get("id"),
                "isbn" : isbn,
                "title": book.get("title"),
                "authors": book.get("authors", []),
                "publisher": book.get("publisher"),
                "publishedDate": book.get("publishedDate"),
                "description": book.get("description"),
                "pageCount": book.get("pageCount"),
                "categories": book.get("categories", []),
                "thumbnail": book.get("imageLinks", {}).get("thumbnail")
            })
        return results
    
    def _filter_books_by_category(self, books, target_category):
        filtered = []
        for book in books:
            categories = book.get("categories", [])
            if categories and any(target_category.lower() in c.lower() for c in categories):
                filtered.append(book)
        return filtered

    @action(detail=False, methods=["get"])
    def search(self, request):
        title = request.query_params.get('title')
        author = request.query_params.get('author')
        publisher = request.query_params.get('publisher')
        isbn = request.query_params.get('isbn')
        general = request.query_params.get('q')
        id = request.query_params.get('id')

        if not any([title, author, publisher, general, isbn, id]):
            return Response({"error": "Provide at least one parameter: title, author, publisher, isbn, id or q."},
                            status=status.HTTP_400_BAD_REQUEST)

        query_parts = []
        if title:
            query_parts.append(f"intitle:{title}")
        if author:
            query_parts.append(f"inauthor:{author}")
        if publisher:
            query_parts.append(f"inpublisher:{publisher}")
        if isbn:
            query_parts.append(f"isbn:{isbn}")
        if general:
            query_parts.append(general)
        

        query = "+".join(query_parts)
        url = f"{self.GOOGLE_API_BASE}{query}&maxResults=40"

        response = requests.get(url)
        if response.status_code != 200:
            return Response({"error": "Google Books API error"}, status=response.status_code)

        items = response.json().get("items", [])
        return Response(self._format_books(items))
    
    @action(detail=False, methods=["get"])
    def category(self, request):
        category = request.query_params.get("name")

        if not category:
            return Response({"error": "Category 'name' parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        category_map = {
            "recent": "q=subject:fiction&orderBy=newest",
            "popular": "q=bestseller&orderBy=relevance",
        }

        if category in category_map:
            url = f"https://www.googleapis.com/books/v1/volumes?{category_map[category]}&maxResults=40"
        else:
            url = f"https://www.googleapis.com/books/v1/volumes?q=subject:{category}&maxResults=40"

        response = requests.get(url)

        if response.status_code != 200:
            return Response({"error": "Google Books API error"}, status=response.status_code)

        items = response.json().get("items", [])
        return Response(self._format_books(items))


    model = SentenceTransformer('all-MiniLM-L6-v2')

    def get_recommendated_books(self, user_embedding, category):
        user_embedding = np.array(user_embedding).reshape(1, -1)
        all_books = []
        books_to_fetch = 20
        page_size = 40  # Google Books API limit
        for start_index in range(0, books_to_fetch, page_size):
            if category == "bestseller":
                url = f"https://www.googleapis.com/books/v1/volumes?q=bestseller&orderBy=relevance&maxResults={page_size}&startIndex={start_index}"
            else:
                url = f"https://www.googleapis.com/books/v1/volumes?q=subject:{category}&maxResults={page_size}&startIndex={start_index}"
            response = requests.get(url)
            if response.status_code != 200:
                raise Exception("Failed to fetch from Google Books")

            books = response.json().get("items", [])
            if not books:
                break  # dacă nu mai sunt cărți, ieși din loop

            formatted_books = self._format_books(books)
            all_books.extend(formatted_books)

        if not all_books:
            raise Exception("No books found")

        books_with_desc = [b for b in all_books if b.get("description")]
        if not books_with_desc:
            raise Exception("No books with description found")

        book_descriptions = [b["description"] for b in books_with_desc]
        book_embeddings = self.model.encode(book_descriptions)

        sims = cosine_similarity(user_embedding, book_embeddings)[0]

        if len(books_with_desc) < 20:
            # Poate nu avem destule cărți, folosim tot ce avem
            top_indices = np.argsort(sims)[::-1]
        else:
            top_indices = np.argsort(sims)[::-1] #[:80]
        #top_indices = np.argsort(sims)[::-1][:20]  # top 20 similar books

        recommended_books = [books_with_desc[i] for i in top_indices]
        return recommended_books

    @action(detail=False, methods=["get"])
    def recommendation(self, request, category):
        user = request.user
        

        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=404)

        profile_embedding = profile.get_embedding()
        if not profile_embedding:
            return Response({"error": "User has no embedding yet"}, status=404)
        
        try:
            recommended_books = self.get_recommendated_books(profile_embedding, category)
            return Response({"recommendations": recommended_books})
        except Exception as e:
            return Response({"error": str(e)}, status=500)




    
    @action(detail=False, methods=["get"])
    def recommendation_generalized(self, request):
        user = request.user

        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=404)

        profile_embedding = profile.get_embedding()
        if not profile_embedding:
            return Response({"error": "User has no embedding yet"}, status=404)

        read_books = ShelfBooks.objects.filter(shelf__user=user, shelf__name="Read")
        categories = {shelf_book.book.genre for shelf_book in read_books if shelf_book.book.genre}
        recommendations = []

        if not read_books.exists() or not categories:
            # Dacă NU are cărți citite sau genuri, recomandăm din bestseller
            try:
                recommended_books = self.get_recommendated_books(profile_embedding, "bestseller")
                return Response({"recommendations": recommended_books})
            except Exception as e:
                return Response({"error": str(e)}, status=500)

        # Dacă are cărți citite, facem recomandări pe fiecare gen
        num_categories = len(categories)
        for category in categories:
            try:
                recommended_books = self.get_recommendated_books(profile_embedding, category)
            except Exception as e:
                # Dacă eșuează un gen, continuăm cu următoarele, nu oprim tot
                continue
            
            if num_categories > 5:
                recommendations.extend(recommended_books[:5])  # primele 5 recomandări
            else:
                recommendations.extend(recommended_books[:10])  # primele 10 recomandări

        # Dacă nu am găsit nicio carte validă, fallback pe "bestseller"
        if not recommendations:
            try:
                recommended_books = self.get_recommendated_books(profile_embedding, "bestseller")
                return Response({"recommendations": recommended_books})
            except Exception as e:
                return Response({"error": str(e)}, status=500)

        # Filtrăm doar cărțile care au "publishedDate"
        recommendations = [book for book in recommendations if "publishedDate" in book]
        recommendations.sort(key=lambda x: x["publishedDate"], reverse=True)

        return Response({"recommendations": recommendations})