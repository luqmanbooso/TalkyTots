import { useEffect, useState } from "react";

export default function RoomList({ token, rooms, activeRoomId, onSelectRoom, onCreateRoom }) {
  const [newRoom, setNewRoom] = useState("");

  return (
    <div className="w-64 h-full bg-green-50 border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <span className="font-bold text-green-800 text-lg">Rooms</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rooms.map(room => (
          <button
            key={room._id}
            onClick={() => onSelectRoom(room)}
            className={`w-full text-left px-4 py-3 hover:bg-green-100 transition ${
              activeRoomId === room._id ? "bg-green-200 font-semibold" : ""
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>
      <form
        className="p-4 border-t flex"
        onSubmit={e => {
          e.preventDefault();
          if (newRoom.trim()) {
            onCreateRoom(newRoom.trim());
            setNewRoom("");
          }
        }}
      >
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1 focus:outline-none"
          placeholder="New room"
          value={newRoom}
          onChange={e => setNewRoom(e.target.value)}
        />
        <button className="ml-2 px-3 py-1 rounded bg-green-600 text-white" type="submit">
          +
        </button>
      </form>
    </div>
  );
}