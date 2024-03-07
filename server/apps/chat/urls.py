from django.urls import path, include
from rest_framework import routers

from apps.chat.views import ChatRoomView, UserChatRoomView

router = routers.DefaultRouter()
router.register(r"chats", ChatRoomView)

urlpatterns = [
    path("", include(router.urls)),
    # path('chats', ChatRoomView.as_view(), name='chatRoom'),
    # path('chats/<str:roomId>/messages', MessagesView.as_view(), name='messageList'),
    path('users/<int:userId>/chats', UserChatRoomView.as_view(), name='chatRoomList'),
]
