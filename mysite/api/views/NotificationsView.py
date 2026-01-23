from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from api.serializers import NotificationSerializer
from api.models import Notification

class NotificationsView(ViewSet):
    permission_classes = [IsAuthenticated]

    # listă notificări user
    def list(self, request):  # <- must be 'list'
        notifications = Notification.objects.filter(
            user=request.user,
            is_deleted=False
        ).order_by("-created_at")
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    # ștergere notificare
    def destroy(self, request, pk=None):  # <- must be 'destroy'
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.is_deleted = True
        notification.save(update_fields=["is_deleted"])
        return Response(status=status.HTTP_204_NO_CONTENT)
