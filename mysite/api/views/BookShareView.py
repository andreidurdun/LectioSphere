from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.models import UserAccount
from api.models import Notification, Book

class ShareBookView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Share a book with a friend
        Expected payload:
        {
            "recipient_id": <user_id>,
            "book_id": "<book_id>"
        }
        """
        recipient_id = request.data.get('recipient_id')
        book_id = request.data.get('book_id')
        
        if not recipient_id or not book_id:
            return Response(
                {"detail": "recipient_id and book_id are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recipient = UserAccount.objects.get(id=recipient_id)
        except UserAccount.DoesNotExist:
            return Response(
                {"detail": "Recipient user not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if they are mutual friends
        sender_profile = request.user.profile
        recipient_profile = recipient.profile
        
        is_mutual_friend = (
            sender_profile in recipient_profile.following.all() and
            recipient_profile in sender_profile.following.all()
        )
        
        if not is_mutual_friend:
            return Response(
                {"detail": "You can only share books with mutual friends."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get book information from request or database
        # book_id can be either a database ID or external ID (Google Books ID)
        book_title = request.data.get('book_title', 'a book')
        book_cover = request.data.get('book_cover', '')
        book_author = request.data.get('book_author', '')
        
        # Try to get book from database, but don't fail if it doesn't exist
        book = None
        try:
            # Try as integer database ID first
            if book_id.isdigit():
                book = Book.objects.filter(id=int(book_id)).first()
            
            # If not found, try as external ID (Google Books ID)
            if not book:
                book = Book.objects.filter(id=book_id).first()
        except (ValueError, AttributeError):
            pass
        
        # Create notification (book can be None for external books)
        message = f"{request.user.username} sent you {book_title}"
        notification = Notification.objects.create(
            user=recipient,
            notification_type='book_share',
            sender=request.user,
            book=book,  # Can be None
            message=message,
            # Store book info in notification for external books
            external_book_id=book_id,
            external_book_title=book_title,
            external_book_cover=book_cover,
            external_book_author=book_author
        )
        
        return Response(
            {
                "detail": "Book shared successfully.",
                "notification_id": notification.id
            }, 
            status=status.HTTP_201_CREATED
        )
