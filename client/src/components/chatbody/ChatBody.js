import React, { useEffect, useState } from "react";
import ApiConnector from "../../api/apiConnector";
import ApiEndpoints from "../../api/apiEndpoints";
import ServerUrl from "../../api/serverUrl";
import Constants from "../../lib/constants";
import SocketActions from "../../lib/socketActions";
import CommonUtil from "../../util/commonUtil";
import "./chatBodyStyle.css";

let socket = new WebSocket(
  ServerUrl.WS_BASE_URL + `ws/users/${CommonUtil.getUserId()}/chat/`
);
let typingTimer = 0;
let isTypingSignalSent = false;

const ChatBody = ({ match, currentChattingMember, setOnlineUserList }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState({});
  const [typing, setTyping] = useState(false);
  const [isRead, setIsRead] = useState(false);

  // useEffect(() => {
  //   if (currentChattingMember.isOnline) {
  //     sendIsReadSignal();
  //   }
  // }, [currentChattingMember]);

  const fetchChatMessage = async () => {
    const currentChatId = CommonUtil.getActiveChatId(match);
    if (currentChatId) {
      const url =
        ApiEndpoints.CHAT_MESSAGE_URL.replace(
          Constants.CHAT_ID_PLACE_HOLDER,
          currentChatId
        ) + "?limit=20&offset=0";
      const chatMessages = await ApiConnector.sendGetRequest(url);
      setMessages(chatMessages);
    }
  };

  useEffect(() => {
    fetchChatMessage();
  }, [CommonUtil.getActiveChatId(match)]);

  const loggedInUserId = CommonUtil.getUserId();
  const getChatMessageClassName = (userId) => {
    return loggedInUserId === userId
      ? "chat-message-right pb-3"
      : "chat-message-left pb-3";
  };

  const sendMarkAsReadRequest = async () => {
    const currentChatId = CommonUtil.getActiveChatId(match);
    const markChatAsReadURL = ApiEndpoints.READ_CHAT_MESSAGE_URL.replace(
      Constants.CHAT_ID_PLACE_HOLDER, currentChatId
    );
    const postUrl = markChatAsReadURL;
    const postBody = JSON.stringify({});
    const postIsAuth = true;
    const postIsFormData = false;
    const chatMessages = await ApiConnector.sendPatchRequest(
      postUrl,
      postBody,
      postIsAuth,
      postIsFormData
    );
    console.log("MARK AS READ", chatMessages);
  }

  socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    const chatId = CommonUtil.getActiveChatId(match);
    const userId = CommonUtil.getUserId();
    if (chatId === data.roomId) {
      if (data.action === SocketActions.MESSAGE) {
        data["userImage"] = ServerUrl.BASE_URL.slice(0, -1) + data.userImage;
        setMessages((prevState) => {
          let messagesState = JSON.parse(JSON.stringify(prevState));
          // messagesState.results.unshift(data);
          messagesState.unshift(data);
          return messagesState;
        });
        setTyping(false);
        sendIsReadSignal();
      } else if (data.action === SocketActions.TYPING && data.user !== userId) {
        setTyping(data.typing);
      } else if (data.action === SocketActions.MARK_AS_READ && data.user !== userId) {
        sendMarkAsReadRequest();
        fetchChatMessage();

        setIsRead(true);
      }
    }
    if (data.action === SocketActions.ONLINE_USER) {
      setOnlineUserList(data.userList);
    }
  };

  const messageSubmitHandler = async (event) => {
    event.preventDefault();

    // Prepare the fetch arguments
    const currentChatId = CommonUtil.getActiveChatId(match);
    const createChatURL = ApiEndpoints.POST_CHAT_MESSAGE_URL.replace(
      Constants.CHAT_ID_PLACE_HOLDER, currentChatId
    );

    if (inputMessage) {
      const postUrl = createChatURL;
      const postBody = JSON.stringify({
        action: SocketActions.MESSAGE,
        message: inputMessage,
        isRead: currentChattingMember.isOnline ? true : false,
        user: CommonUtil.getUserId(),
        roomId: CommonUtil.getActiveChatId(match),
      });
      const postIsAuth = true;
      const postIsFormData = false;
      const chatMessages = await ApiConnector.sendPostRequest(
        postUrl,
        postBody,
        postIsAuth,
        postIsFormData
      );
      console.log(chatMessages);
      // socket.send(
      //   JSON.stringify({
      //     action: SocketActions.MESSAGE,
      //     message: inputMessage,
      //     isRead: currentChattingMember.isOnline ? true : false,
      //     user: CommonUtil.getUserId(),
      //     roomId: CommonUtil.getActiveChatId(match),
      //   })
      // );
    }
    setInputMessage("");
  };

  const sendTypingSignal = (typing) => {
    socket.send(
      JSON.stringify({
        action: SocketActions.TYPING,
        typing: typing,
        user: CommonUtil.getUserId(),
        roomId: CommonUtil.getActiveChatId(match),
      })
    );
  };

  const sendIsReadSignal = () => {
    if (socket.OPEN) {
      socket.send(
        JSON.stringify({
          action: SocketActions.MARK_AS_READ,
          user: CommonUtil.getUserId(),
          roomId: CommonUtil.getActiveChatId(match),
        })
      );
    }
  }

  const chatMessageTypingHandler = (event) => {
    if (event.keyCode !== Constants.ENTER_KEY_CODE) {
      if (!isTypingSignalSent) {
        sendTypingSignal(true);
        isTypingSignalSent = true;
      }
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        sendTypingSignal(false);
        isTypingSignalSent = false;
      }, 3000);
    } else {
      clearTimeout(typingTimer);
      isTypingSignalSent = false;
    }
  };

  return (
    <div className="col-12 col-sm-8 col-md-8 col-lg-8 col-xl-10 pl-0 pr-0">
      <div className="py-2 px-4 border-bottom d-none d-lg-block">
        <div className="d-flex align-items-center py-1">
          <div className="position-relative">
            <img
              src={currentChattingMember?.image}
              className="rounded-circle mr-1"
              alt="User"
              width="40"
              height="40"
            />
          </div>
          <div className="flex-grow-1 pl-3">
            <strong>{currentChattingMember?.name}</strong>
          </div>
        </div>
      </div>
      <div className="position-relative">
        <div
          id="chat-message-container"
          className="chat-messages pl-4 pt-4 pr-4 pb-1 d-flex flex-column-reverse"
        >
          {typing && (
            <div className="chat-message-left chat-bubble mb-1">
              <div className="typing">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
          {/* {console.log("MESSAGES ON PAGE", messages)} */}
          {messages.length > 0 && messages?.map((message, index) => (
            <div key={index} className={getChatMessageClassName(message.user)}>
              <div>
                <img
                  src={message.userImage}
                  className="rounded-circle mr-1"
                  alt={message.userName}
                  width="40"
                  height="40"
                />
                <div className="text-muted small text-nowrap mt-2">
                  {CommonUtil.getTimeFromDate(message.timestamp)}
                </div>
              </div>
              <div className="flex-shrink-1 bg-light ml-1 rounded py-2 px-3 mr-3">
                <div className="font-weight-bold mb-1">{message.userName}</div>
                {message.message}
                <div className="text-sm">
                  {
                    currentChattingMember.id === message.user && currentChattingMember.isOnline
                      ? (
                        message.is_read ? "read" : "unread"
                      )
                      : null
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-grow-0 py-3 px-4 border-top">
        <form onSubmit={messageSubmitHandler}>
          <div className="input-group">
            <input
              onChange={(event) => setInputMessage(event.target.value)}
              onKeyUp={chatMessageTypingHandler}
              value={inputMessage}
              id="chat-message-input"
              type="text"
              className="form-control"
              placeholder="Type your message"
              autoComplete="off"
            />
            <button
              id="chat-message-submit"
              className="btn btn-outline-warning"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBody;
