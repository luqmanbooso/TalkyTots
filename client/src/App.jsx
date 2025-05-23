import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import AuthPage from "./components/AuthPage";
import Chat from "./Chat";
import RoomList from "./components/RoomList";

const socket = io.connect("http://localhost:3001");

// Route protection HOC
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppContent() {
  // Persistent login
  const [user, setUser] = useState(() => {
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");
    return username && token ? { username, token } : null;
  });

  // List of user rooms
  const [rooms, setRooms] = useState([]);

  // The currently selected room (persisted)
  const [activeRoom, setActiveRoom] = useState(() => {
    return JSON.parse(localStorage.getItem("activeRoom") || "null");
  });

  const navigate = useNavigate();

  // Fetch rooms on login
  useEffect(() => {
    if (!user) return;
    fetch("http://localhost:3001/api/rooms", {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setRooms(data.rooms);
      });
  }, [user]);

  // Remember last active room
  useEffect(() => {
    if (activeRoom) {
      localStorage.setItem("activeRoom", JSON.stringify(activeRoom));
    }
  }, [activeRoom]);

  // Join socket room when activeRoom changes
  useEffect(() => {
    if (activeRoom) socket.emit("join_room", activeRoom._id);
  }, [activeRoom]);

  // Create a new room
  const handleCreateRoom = async name => {
    if (!user) return;
    const res = await fetch("http://localhost:3001/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) {
      setRooms(rms => rms.some(r => r._id === data.room._id) ? rms : [...rms, data.room]);
      setActiveRoom(data.room);
    }
  };

  // Select a room from the sidebar
  const handleSelectRoom = room => setActiveRoom(room);

  // Logout: clear all persistent info and redirect to login
  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("activeRoom");
    setUser(null);
    setRooms([]);
    setActiveRoom(null);
    navigate("/login");
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/chat" replace /> : <AuthPage onAuth={setUser} />
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute user={user}>
            <div className="min-h-screen flex">
              <RoomList
                token={user?.token}
                rooms={rooms}
                activeRoomId={activeRoom?._id}
                onSelectRoom={handleSelectRoom}
                onCreateRoom={handleCreateRoom}
              />
              <div className="flex-1 flex flex-col h-screen">
                <div className="p-3 bg-green-800 text-white flex justify-between">
                  <span>Welcome, {user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-green-600 px-4 py-1 rounded font-semibold hover:bg-green-700"
                  >
                    Logout
                  </button>
                </div>
                {activeRoom ? (
                  <Chat
                    socket={socket}
                    username={user.username}
                    room={activeRoom.name}
                    roomId={activeRoom._id}
                    token={user.token}
                    onLeave={() => setActiveRoom(null)}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-green-50 text-xl text-green-800">
                    Select or create a room to start chatting!
                  </div>
                )}
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}