const ApiEndpoints = {
  SIGN_UP_URL: "api/v1/signup",
  LOGIN_URL: "api/v1/login",
  USER_URL: "api/v1/users",
  CHAT_URL: "api/v1/chats",
  USER_CHAT_URL: "api/v1/users/<userId>/chats",
  CHAT_MESSAGE_URL: "api/v1/chats/<chatId>/messages",
  POST_CHAT_MESSAGE_URL: "api/v1/chats/<chatId>/create-message",
  READ_CHAT_MESSAGE_URL: "api/v1/chats/<chatId>/mark-as-read",
};

export default ApiEndpoints;
