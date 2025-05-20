import React, { useEffect, useState } from "react";
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
    <div className="w-screen h-screen bg-white text-[#212121] font-[Open_Sans,sans-serif] grid place-items-center">
      <div className="chat-window w-[300px] h-[420px]">
        <div className="chat-header h-[45px] rounded-md bg-[#263238] relative cursor-pointer flex items-center">
          <p className="block pl-8 pr-4 text-white font-bold leading-[45px]">
            Live chat
          </p>
        </div>
        <div className="chat-body h-[335px] border border-[#263238] bg-white relative overflow-hidden">
          {/* wrap the content you need to be scrolled inside scroll to bottom */}
          <ScrollToBottom className="message-container w-full h-full overflow-y-scroll overflow-x-hidden scrollbar-hide">
            {messageList.map((messageContent, idx) => {
              const isYou = username === messageContent.author;
              return (
                <div
                  key={idx}
                  className={`message flex p-2 ${isYou ? "justify-start" : "justify-end"}`}
                  id={isYou ? "you" : "other"}
                >
                  <div>
                    <div
                      className={`message-content w-auto h-auto min-h-[40px] max-w-[120px] rounded-md flex items-center px-2 py-2 break-words
                        ${isYou ? "bg-green-700 text-white mr-1 ml-1 justify-start" : "bg-blue-400 text-white mr-1 ml-1 justify-end"}
                      `}
                    >
                      <p className="w-full break-words">{messageContent.message}</p>
                    </div>
                    <div
                      className={`message-meta flex text-xs 
                        ${isYou ? "justify-start ml-1" : "justify-end mr-1"}
                      `}
                    >
                      <p id="time">{messageContent.time}</p>
                      <p id="author" className="ml-2 font-bold">
                        {messageContent.author}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </ScrollToBottom>
        </div>
        <div className="chat-footer h-[40px] border-x border-b border-[#263238] border-t-0 flex">
          <input
            type="text"
            placeholder="Hey..."
            value={currentMessage}
            onChange={(event) => setCurrentMessage(event.target.value)}
            onKeyPress={(event) => {
              event.key === "Enter" && sendMessage();
            }}
            className="h-full flex-[85%] border-0 px-3 text-base border-r border-dotted border-[#607d8b] outline-none font-[Open_Sans,sans-serif]"
          />
          <button
            onClick={sendMessage}
            className="border-0 grid place-items-center cursor-pointer flex-[15%] h-full bg-transparent outline-none text-[25px] text-gray-300 hover:text-green-700"
          >
            &#9658;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;