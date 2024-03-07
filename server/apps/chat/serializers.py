from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from rest_framework import serializers

from apps.chat.models import ChatRoom, ChatMessage
from apps.user.models import User
from apps.user.serializers import UserSerializer


class ChatRoomSerializer(serializers.ModelSerializer):
    member = UserSerializer(many=True, read_only=True)
    members = serializers.ListField(write_only=True)

    def create(self, validatedData):
        memberObject = validatedData.pop('members')
        chatRoom = ChatRoom.objects.create(**validatedData)
        chatRoom.member.set(memberObject)
        return chatRoom

    class Meta:
        model = ChatRoom
        exclude = ['id']


class ListChatMessageSerializer(serializers.ModelSerializer):
    userName = serializers.SerializerMethodField()
    userImage = serializers.ImageField(source='user.image')

    class Meta:
        model = ChatMessage
        exclude = ['id', 'chat']

    def get_userName(self, Obj):
        return Obj.user.first_name + ' ' + Obj.user.last_name


class ChatMessageSerializer(serializers.ModelSerializer):
    userName = serializers.SerializerMethodField()
    userImage = serializers.ImageField(source='user.image', read_only=True)

    class Meta:
        model = ChatMessage
        exclude = ['id', 'chat']

    def get_userName(self, Obj):
        return Obj.user.first_name + ' ' + Obj.user.last_name

    @transaction.atomic
    def create(self, validated_data):
        _roomId = self.context.get('roomId')
        _request = self.context.get('request')
        chatroom_obj = ChatRoom.objects.filter(roomId=_roomId).first()
        chat_message_obj = self.Meta.model.objects.create(**validated_data, chat=chatroom_obj)
        channel_layer = get_channel_layer()

        userObj = User.objects.filter(id=_request.user.id).first()
        chatMessage = {
            'action': 'message',
            'user': _request.user.id,
            'roomId': _roomId,
            'message': validated_data.get('message'),
            'userImage': userObj.image.url,
            'userName': userObj.first_name + " " + userObj.last_name,
            'timestamp': str(validated_data.get('timestamp')),
            'isRead': validated_data.get('is_read')
        }
        async_to_sync(channel_layer.group_send)(_roomId, {
            'type': 'chat_message',
            'message': chatMessage
        })
        return chat_message_obj


class ReadChatRoomSerializer(serializers.Serializer):

    @transaction.atomic
    def update(self, instance, validated_data):
        res = ChatMessage.objects.filter(chat__roomId=instance.roomId).update(is_read=True)
        return validated_data
