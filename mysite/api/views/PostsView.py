from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import Post, Book, Media
from api.serializers import PostSerializer, BookSerializer, MediaSerializer
from rest_framework.viewsets import ViewSet
import json 
import requests
from rest_framework.decorators import action
from api.models import PostLike

from api.models import Comment
from api.serializers import CommentSerializer


class PostsView(ViewSet):
    permission_classes = [IsAuthenticated]

    # adaugam o postare la o carte
    @action(detail=True, methods=['post'])
    def add_post(self, request):

        # facem initializarile pentru user(cel care face postarea), actiunea(post, want_to_read etc) si id-ul cartii
        # pentru a face o postare pentru o carte, trebuie sa avem id-ul cartii
        user = request.user
        action = request.data.get('action')
        volume_id = request.data.get('id')


        # mai departe doar cautam cartea dupa id
        if not volume_id:
            return Response({"error": "id is required"}, status=status.HTTP_400_BAD_REQUEST)

    
        book = Book.objects.filter(id=volume_id).first()
        if not book:
            
            google_api_url = f"https://www.googleapis.com/books/v1/volumes/{volume_id}"
            response = requests.get(google_api_url)

            if response.status_code != 200:
                return Response({"error": "Failed to fetch book"}, status=status.HTTP_502_BAD_GATEWAY)

            data = response.json()
            info = data.get("volumeInfo", {})


            isbn_13 = isbn_10 = None
            for ident in info.get("industryIdentifiers", []):
                if ident["type"] == "ISBN_13":
                    isbn_13 = ident["identifier"]
                elif ident["type"] == "ISBN_10":
                    isbn_10 = ident["identifier"]
            isbn = isbn_13 or isbn_10


            # extragem info de la api si le salvam in baza de date
            book = Book.objects.create(
                id=volume_id,
                ISBN=isbn,
                title=info.get("title"),
                author=", ".join(info.get("authors", [])),
                genre=", ".join(info.get("categories", [])),
                rating="0",
                nr_pages=info.get("pageCount", 0),
                publication_year=int(info.get("publishedDate", "")[:4]) if info.get("publishedDate") else None,
                series="None",
                description=info.get("description", ""),
                cover=info.get("imageLinks", {}).get("thumbnail", ""),
            )


        # in continuare, realizam postarea  
        # gesionam si imaginilen(media) corespunzatoare postarii   
        post_data = request.data.copy()
        post_data.update({"user": user.id, "book": book.id})


        serializer = PostSerializer(data=post_data, context={"request": request, "book": book})
        if serializer.is_valid():
            post = serializer.save()
            media_files = request.FILES.getlist('media')  
            for img in media_files:
                Media.objects.create(file=img, post=post)

            return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




    # vedem informatii despre o anumita postare 
    @action(detail=True, methods=['get'])
    def read_post(self, request, pk=None):
        try:
            post = Post.objects.get(pk=pk, user=request.user)
            serializer = PostSerializer(post)
            return Response(serializer.data)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)



    # stergem o postare
    @action(detail=True, methods=['delete'])
    def delete_post(self, request, pk=None):
        try:
            post = Post.objects.get(pk=pk, user=request.user)
            post.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)



    # actualizam o postare
    @action(detail=True, methods=['put', 'patch'])
    def update_post(self, request, pk=None):
        try:
            post = Post.objects.get(pk=pk, user=request.user)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = PostSerializer(post, data=request.data, partial=True, context={"request": request, "book": post.book})
        if serializer.is_valid():
            post = serializer.save()
            return Response(PostSerializer(post).data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    # vedem TOATE postarile utilizatorului
    @action(detail=False, methods=['get'])
    def list_posts(self, request):
        posts = Post.objects.filter(user=request.user)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)



    # DOAR postarile de tip POST
    @action(detail=False, methods=['get'])
    def list_post_type_posts(self, request):
        posts = Post.objects.filter(user=request.user, action=Post.ActionChoices.POST)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)



    # TOATE postarile, DAR fărăfara cele de tip POST
    @action(detail=False, methods=['get'])
    def list_non_post_type_posts(self, request):
        posts = Post.objects.filter(user=request.user).exclude(action=Post.ActionChoices.POST)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)




    # vedem feed ul . maxim 50 de postari in ordine cronologica
    @action(detail=False, methods=["get"])
    def feed(self, request):
       
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            return Response({"detail": "Profilul nu există."}, status=400)

        followed_users = profile.following.values_list("user_id", flat=True)

        posts = (
            Post.objects
            .filter(user__in=followed_users)
            .select_related("user", "book")
            .prefetch_related("media", "comment_set")
            .order_by("-date", "-id")[:50] 
        )

        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)





    # ---------


    
    from api.models import PostLike

    @action(detail=True, methods=['post'])
    def toggle_like(self, request, pk=None):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        like, created = PostLike.objects.get_or_create(user=user, post=post)

        if not created:
           like.delete()
           liked = False
        else:
           liked = True

        like_count = PostLike.objects.filter(post=post).count()
        return Response({
        "liked": liked,
        "like_count": like_count
    }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
            try:
                post = Post.objects.get(pk=pk)
            except Post.DoesNotExist:
                  return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

            serializer = CommentSerializer(data=request.data)
            if serializer.is_valid():
             # Setăm user și post direct, fără ca ele să vină în request
              serializer.save(user=request.user, post=post)
              return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def list_comments(self, request, pk=None):
            try:
             post = Post.objects.get(pk=pk)
            except Post.DoesNotExist:
             return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

            comments = Comment.objects.filter(post=post).order_by("-date")
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
