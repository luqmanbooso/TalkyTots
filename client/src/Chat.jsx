import React, { useEffect, useState, useRef } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

// Telegram-inspired Chat UI with friendly touches
const Chat = ({ socket, username, room, roomId, token, onLeave }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit("join_room", roomId);
    }
  }, [socket, roomId]);

  // Fetch chat history for this room
  useEffect(() => {
    if (!roomId || !token) return;
    fetch(`http://localhost:3001/api/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessageList(
            data.messages.map((msg) => ({
              _id: msg._id,
              author: msg.sender?.username || msg.author,
              senderId: msg.sender?._id,
              message: msg.content || msg.message,
              time: new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              deleted: msg.deleted,
            }))
          );
        }
      });
  }, [roomId, token]);

  // Real-time listeners
  useEffect(() => {
    const handler = (data) => {
      if (data.roomId === roomId || data.room === room) {
        setMessageList((list) => [
          ...list,
          {
            _id: data._id,
            author: data.author,
            senderId: data.senderId,
            message: data.content || data.message,
            time:
              data.time ||
              new Date(data.createdAt || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            deleted: data.deleted,
          },
        ]);
      }
    };
    socket.on("receive_message", handler);

    socket.on("message_edited", (data) => {
      setMessageList((list) =>
        list.map((msg) =>
          msg._id === data._id
            ? { ...msg, message: data.content, deleted: false }
            : msg
        )
      );
    });
    socket.on("message_deleted", (data) => {
      setMessageList((list) =>
        list.map((msg) =>
          msg._id === data._id
            ? { ...msg, message: data.content, deleted: data.deleted }
            : msg
        )
      );
    });

    return () => {
      socket.off("receive_message", handler);
      socket.off("message_edited");
      socket.off("message_deleted");
    };
  }, [socket, room, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  // Send a message
  const sendMessage = async () => {
    if (currentMessage.trim() === "") return;
    if (roomId && token) {
      const res = await fetch(
        `http://localhost:3001/api/rooms/${roomId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: currentMessage }),
        }
      );
      const data = await res.json();
      if (data.success) {
        socket.emit("send_message", {
          _id: data.message._id,
          roomId,
          room,
          author: username,
          senderId: data.message.sender,
          content: currentMessage,
          time: new Date(data.message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }
    }
    setCurrentMessage("");
  };

  // Edit message handlers
  const startEdit = (msg) => {
    setEditingId(msg._id);
    setEditContent(msg.message);
  };

  const saveEdit = async (msgId) => {
    if (!editContent.trim()) return;
    await fetch(`http://localhost:3001/api/messages/${msgId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: editContent }),
    });
    setEditingId(null);
    setEditContent("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  // Delete message
  const deleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    await fetch(`http://localhost:3001/api/messages/${msgId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#e3f7ee] via-[#f7fafc] to-[#d2f1fc] text-[#212121] font-[Open_Sans,sans-serif] flex flex-col">
      {/* Header */}
      <div className="chat-header h-[54px] rounded-b-2xl bg-gradient-to-r from-[#0088cc] to-[#5bc6e5] relative flex items-center px-8 justify-between shadow">
        <p className="text-white font-black text-lg tracking-wide flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 240 240" fill="none">
            <circle cx="120" cy="120" r="120" fill="#fff" />
            <path
              d="M62 124.5l48.3 19.8c3.5 1.4 7.4 1.3 10.8-0.2l62.5-28c4.2-1.9 3.7-7.9-0.7-8.9L72.2 99c-4.3-1-8.4 2.7-7.8 7.1l4.1 30.2c0.4 2.8 2.2 5.2 4.7 6.2z"
              fill="#0088cc"
            />
          </svg>
          {room ? `${room}` : "Live chat"}
        </p>
        <button
          className="bg-gradient-to-r from-[#0088cc] to-[#5bc6e5] px-5 py-2 rounded-xl font-bold shadow text-white hover:from-[#007ab8] hover:to-[#30b2e2] active:scale-95 transition-all"
          onClick={onLeave}
        >
          Leave Room
        </button>
      </div>
      {/* Chat Body */}
      <div className="chat-body flex-1 border border-[#e6ecf1] bg-transparent relative overflow-hidden">
        <ScrollToBottom className="message-container w-full h-full overflow-y-scroll px-4 py-4">
          {messageList.length === 0 && (
            <div className="text-center text-gray-400 pt-6 text-sm">
              No messages yet. Start the conversation!
            </div>
          )}
          {messageList.map((msg, idx) => {
            const isYou = username === msg.author;
            return (
              <div
                key={msg._id || idx}
                className={`message flex py-2 ${
                  isYou ? "justify-end" : "justify-start"
                }`}
                id={isYou ? "you" : "other"}
              >
                <div>
                  <div
                    className={`message-content min-w-[60px] max-w-md rounded-2xl flex items-center px-4 py-2 break-words shadow-sm relative
                      ${
                        isYou
                          ? "bg-gradient-to-l from-[#63e2c6] to-[#43c6ac] text-white"
                          : "bg-gradient-to-r from-[#5bc6e5] to-[#0088cc] text-white"
                      }
                      ${msg.deleted ? "opacity-70 italic" : ""}
                    `}
                  >
                    {msg.deleted ? (
                      <p className="italic text-gray-200">Message deleted</p>
                    ) : editingId === msg._id ? (
                      <>
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="border px-2 py-1 rounded text-black"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(msg._id)}
                          className="ml-2 text-xs text-green-200 hover:text-green-500"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="ml-1 text-xs text-gray-200 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="break-words">{msg.message}</p>
                        {isYou && !msg.deleted && (
                          <>
                            <button
                              onClick={() => startEdit(msg)}
                              className="ml-2 text-xs text-blue-100 hover:text-blue-300"
                              title="Edit message"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteMessage(msg._id)}
                              className="ml-2 text-xs text-red-200 hover:text-red-400"
                              title="Delete message"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div
                    className={`message-meta flex text-xs ${
                      isYou ? "justify-end mr-1" : "justify-start ml-1"
                    }`}
                  >
                    <span id="time" className="text-gray-400">
                      {msg.time}
                    </span>
                    <span id="author" className="ml-2 font-bold text-[#0088cc]">
                      {msg.author}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </ScrollToBottom>
      </div>
      {/* Chat Footer */}
      <div className="chat-footer h-[60px] border-x border-b border-[#e6ecf1] border-t-0 flex items-center bg-white/90 rounded-t-2xl px-4">
        <input
          type="text"
          placeholder="Type a message..."
          value={currentMessage}
          onChange={(event) => setCurrentMessage(event.target.value)}
          onKeyDown={(event) => {
            event.key === "Enter" && sendMessage();
          }}
          className="flex-1 h-[44px] border-0 px-4 text-base rounded-xl bg-[#f7fafc] outline-none shadow-sm mr-2"
        />
        <button
          onClick={sendMessage}
          className="border-0 grid place-items-center cursor-pointer w-12 h-[44px] bg-gradient-to-r from-[#0088cc] to-[#5bc6e5] rounded-xl outline-none text-[25px] text-white hover:from-[#007ab8] hover:to-[#30b2e2] transition"
          title="Send"
        >
          &#9658;
        </button>
      </div>
    </div>
  );
};

export default Chat;
