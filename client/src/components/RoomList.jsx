import { useState } from "react";

function ChatLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 240 240" fill="none">
      <circle cx="120" cy="120" r="120" fill="#fff" />
      <path
        d="M62 124.5l48.3 19.8c3.5 1.4 7.4 1.3 10.8-0.2l62.5-28c4.2-1.9 3.7-7.9-0.7-8.9L72.2 99c-4.3-1-8.4 2.7-7.8 7.1l4.1 30.2c0.4 2.8 2.2 5.2 4.7 6.2z"
        fill="#0088cc"
      />
    </svg>
  );
}

export default function RoomList({
  token,
  rooms,
  activeRoomId,
  onSelectRoom,
  onCreateRoom,
}) {
  const [newRoom, setNewRoom] = useState("");

  return (
    <div className="w-72 h-full bg-gradient-to-b from-[#e3f7ee] via-[#f7fafc] to-[#d2f1fc] border-r border-[#e6ecf1] flex flex-col shadow-lg">
      {/* Header with logo and "Rooms" */}
      <div className="p-5 border-b border-[#e6ecf1] flex items-center justify-between bg-white/70">
        <div className="flex items-center gap-2">
          <ChatLogo />
          <span className="font-extrabold text-[#0088cc] text-xl tracking-tight drop-shadow">
            Rooms
          </span>
        </div>
        <span className="text-xs text-[#8fc8b2] font-semibold uppercase tracking-wider">
          {rooms?.length || 0} active
        </span>
      </div>
      {/* Room list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {rooms.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            No rooms yet. Create one below!
          </div>
        ) : (
          rooms.map((room) => (
            <button
              key={room._id}
              onClick={() => onSelectRoom(room)}
              className={`w-full flex items-center px-6 py-3 transition rounded-lg mb-1 ${
                activeRoomId === room._id
                  ? "bg-[#d2f1fc] text-[#0088cc] font-bold shadow"
                  : "hover:bg-green-100 text-[#263238]"
              }`}
            >
              <span className="truncate">{room.name}</span>
              {activeRoomId === room._id && (
                <span className="ml-auto text-xs bg-[#0088cc] text-white px-2 py-0.5 rounded-full animate-pulse">
                  Active
                </span>
              )}
            </button>
          ))
        )}
      </div>
      {/* New room form */}
      <form
        className="p-5 border-t border-[#e6ecf1] bg-white/80 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (newRoom.trim()) {
            onCreateRoom(newRoom.trim());
            setNewRoom("");
          }
        }}
      >
        <input
          type="text"
          className="flex-1 border border-[#b8e4f0] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5bc6e5] text-base"
          placeholder="Create new room"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          maxLength={32}
        />
        <button
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0088cc] to-[#5bc6e5] text-white font-bold hover:from-[#007ab8] hover:to-[#30b2e2] transition-colors shadow"
          type="submit"
          title="Create room"
        >
          +
        </button>
      </form>
    </div>
  );
}