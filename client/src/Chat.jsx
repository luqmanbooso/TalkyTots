import React, { useEffect, useState, useRef } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

const Chat = ({ socket, username, room, roomId, token, onLeave }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit("join_room", roomId);
      // Optionally, log to confirm
      // console.log("Joining room via socket:", roomId);
    }
  }, [socket, roomId]);

  // Fetch chat history for this room on mount or when roomId changes
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
              senderId: msg.sender?._id, // for permission check
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
          },
        ]);
      }
    };
    socket.on("receive_message", handler);

    // Listen for message_edited and message_deleted
    socket.on("message_edited", (data) => {
      setMessageList((list) =>
        list.map((msg) =>
          msg._id === data._id ? { ...msg, message: data.content } : msg
        )
      );
    });
    socket.on("message_deleted", (data) => {
      console.log("Received message_deleted", data);
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

  // Send a message (store in DB and notify others)
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
        // Let socket.io handle real-time
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
    // Real-time update handled by socket.io
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
    // Real-time update handled by socket.io
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
          {messageList.map((msg, idx) => {
            const isYou = username === msg.author;
            return (
              <div
                key={msg._id || idx}
                className={`message flex p-2 ${
                  isYou ? "justify-end" : "justify-start"
                }`}
                id={isYou ? "you" : "other"}
              >
                <div>
                  <div
                    className={`message-content max-w-xs rounded-md flex items-center px-3 py-2 break-words
                      ${
                        isYou
                          ? "bg-green-700 text-white"
                          : "bg-blue-400 text-white"
                      }
                    `}
                  >
                    {editingId === msg._id ? (
                      <>
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="border px-2 py-1 rounded text-black"
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
                        {isYou && (
                          <>
                            <button
                              onClick={() => startEdit(msg)}
                              className="ml-2 text-xs text-blue-100 hover:text-blue-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteMessage(msg._id)}
                              className="ml-2 text-xs text-red-200 hover:text-red-400"
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
                    <span id="time">{msg.time}</span>
                    <span id="author" className="ml-2 font-bold">
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
