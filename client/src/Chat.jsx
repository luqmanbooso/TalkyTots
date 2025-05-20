import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

const Chat = ({ socket, username, room }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send_message", messageData);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    const handler = (data) => {
      //   console.log(data);
      setMessageList((list) => [...list, data]);
    };
    socket.on("receive_message", handler);
    return () => {
      socket.off("receive_message", handler);
    };
  }, [socket]);

  return (
    <div>
      <div className="chat-window">
        <div className="chat-header">
          <p>Live chat</p>
        </div>
        <div className="chat-body">
          {/* wrap the content u need to be scrolled inside scroll to bottom */}
          <ScrollToBottom className="message-container">
            {messageList.map((messageContent) => {
              return (
                <div
                  className="message"
                  id={username === messageContent.author ? "you" : "other"}
                >
                  <div>
                    <div className="message-content">
                      <p>{messageContent.message}</p>
                    </div>
                    <div className="message-meta">
                      <p id="time">{messageContent.time}</p>
                      <p id="author">{messageContent.author}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </ScrollToBottom>
        </div>
        <div className="chat-footer">
          <input
            type="text"
            placeholder="Hey..."
            value={currentMessage}
            onChange={(event) => setCurrentMessage(event.target.value)}
            // key enter functionality
            onKeyPress={(event) => {
              event.key === "Enter" && sendMessage();
            }}
          />
          <button onClick={sendMessage}>&#9658;</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
