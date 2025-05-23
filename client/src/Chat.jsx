import React, { useEffect, useState, useRef } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

/**
 * Chat component: Modern chat UI with persistent chat history.
 * 
 * Props:
 *  - socket: socket.io client instance
 *  - username: logged in user's username
 *  - room: room name (display)
 *  - roomId: (optional) room _id for fetching history
 *  - token: JWT auth token
 *  - onLeave: callback to leave room
 */
const Chat = ({ socket, username, room, roomId, token, onLeave }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch chat history for this room on mount or when roomId changes
  useEffect(() => {
    if (!roomId || !token) return;
    // Fetch messages from backend
    fetch(`http://localhost:3001/api/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Map history to messageList format used in this component
          setMessageList(
            data.messages.map((msg) => ({
              author: msg.sender?.username || msg.author,
              message: msg.content || msg.message,
              time: new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))
          );
        }
      });
  }, [roomId, token]);

  // Listen for real-time incoming messages via socket.io
  useEffect(() => {
    const handler = (data) => {
      // Only append if message is for this room
      if (data.roomId === roomId || data.room === room) {
        setMessageList((list) => [
          ...list,
          {
            author: data.author,
            message: data.content || data.message,
            time:
              data.time ||
              new Date(data.createdAt || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
        ]);
      }
    };
    socket.on("receive_message", handler);
    return () => {
      socket.off("receive_message", handler);
    };
  }, [socket, room, roomId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  // Send a message (store in DB and notify others)
  const sendMessage = async () => {
    if (currentMessage.trim() === "") return;
    // Save to backend for persistence
    if (roomId && token) {
      await fetch(`http://localhost:3001/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: currentMessage }),
      });
    }
    // Emit real-time message
    await socket.emit("send_message", {
      roomId,
      room,
      author: username,
      content: currentMessage,
      time: new Date(Date.now()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    setCurrentMessage("");
  };

  return (
    <div className="w-full h-full bg-white text-[#212121] font-[Open_Sans,sans-serif] flex flex-col">
      {/* Header */}
      <div className="chat-header h-[45px] rounded-md bg-[#263238] relative cursor-pointer flex items-center px-6 justify-between">
        <p className="text-white font-bold leading-[45px]">
          {room ? `${room}` : "Live chat"}
        </p>
        <button
          className="text-green-100 hover:text-white px-2 py-1 rounded bg-green-800 text-sm"
          onClick={onLeave}
        >
          Leave
        </button>
      </div>
      {/* Chat Body with history */}
      <div className="chat-body flex-1 border border-[#263238] bg-white relative overflow-hidden">
        <ScrollToBottom className="message-container w-full h-full overflow-y-scroll overflow-x-hidden scrollbar-hide px-2 py-2">
          {messageList.map((messageContent, idx) => {
            const isYou = username === messageContent.author;
            return (
              <div
                key={idx}
                className={`message flex p-2 ${isYou ? "justify-end" : "justify-start"}`}
                id={isYou ? "you" : "other"}
              >
                <div>
                  <div
                    className={`message-content max-w-xs rounded-md flex items-center px-3 py-2 break-words
                      ${isYou ? "bg-green-700 text-white" : "bg-blue-400 text-white"}
                    `}
                  >
                    <p className="break-words">{messageContent.message}</p>
                  </div>
                  <div
                    className={`message-meta flex text-xs ${
                      isYou ? "justify-end mr-1" : "justify-start ml-1"
                    }`}
                  >
                    <span id="time">{messageContent.time}</span>
                    <span id="author" className="ml-2 font-bold">
                      {messageContent.author}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Always scroll to bottom */}
          <div ref={messagesEndRef} />
        </ScrollToBottom>
      </div>
      {/* Chat Footer (input/send) */}
      <div className="chat-footer h-[50px] border-x border-b border-[#263238] border-t-0 flex items-center bg-white">
        <input
          type="text"
          placeholder="Type a message..."
          value={currentMessage}
          onChange={(event) => setCurrentMessage(event.target.value)}
          onKeyDown={(event) => {
            event.key === "Enter" && sendMessage();
          }}
          className="flex-1 h-[40px] border-0 px-3 text-base border-r border-dotted border-[#607d8b] outline-none"
        />
        <button
          onClick={sendMessage}
          className="border-0 grid place-items-center cursor-pointer w-12 h-[40px] bg-transparent outline-none text-[25px] text-gray-300 hover:text-green-700"
        >
          &#9658;
        </button>
      </div>
    </div>
  );
};

export default Chat;