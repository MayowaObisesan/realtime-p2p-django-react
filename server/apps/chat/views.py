from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.chat.models import ChatRoom, ChatMessage
from apps.chat.serializers import ChatRoomSerializer, ChatMessageSerializer, ListChatMessageSerializer, \
    ReadChatRoomSerializer


class ChatRoomView(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.filter()
    serializer_class = ChatRoomSerializer
    http_method_names = ['get', 'post', 'patch']
    lookup_field = "roomId"

    @action(
        methods=["GET"], detail=False, permission_classes=[IsAuthenticated],
        url_path=r"(?P<roomId>[^/.]+)/messages", serializer_class=ListChatMessageSerializer
    )
    def messages(self, request, roomId):
        _roomId = roomId
        message_obj = ChatMessage.objects.filter(chat__roomId=_roomId).order_by('-timestamp')
        serializer = ListChatMessageSerializer(
            instance=message_obj, many=True, context={'request': request}
        )
        return Response(data=serializer.data, status=status.HTTP_200_OK)

    @action(
        methods=["POST"], detail=False, permission_classes=[IsAuthenticated],
        url_path=r"(?P<roomId>[^/.]+)/create-message", serializer_class=ChatMessageSerializer
    )
    def create_message(self, request, roomId):
        _roomId = roomId
        serializer = ChatMessageSerializer(
            data=request.data, context={'request': request, 'roomId': _roomId}
        )
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(data={'success': True, 'detail': serializer.data}, status=status.HTTP_200_OK)

    @action(
        methods=["PATCH"], detail=False, permission_classes=[IsAuthenticated],
        url_path=r"(?P<roomId>[^/.]+)/mark-as-read", serializer_class=ReadChatRoomSerializer
    )
    def mark_as_read(self, request, roomId):
        _roomId = roomId
        room_obj = ChatRoom.objects.filter(roomId=_roomId).first()
        ReadChatRoomSerializer(
            data=request.data, instance=room_obj, context={'request': request, 'roomId': roomId}
        )
        return Response(data={'success': True, 'message': 'Chat room read'}, status=status.HTTP_200_OK)


class UserChatRoomView(ListAPIView):
    serializer_class = ChatRoomSerializer

    def get(self, request, userId):
        chatRooms = ChatRoom.objects.filter(member=userId)
        serializer = ChatRoomSerializer(
            chatRooms, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
