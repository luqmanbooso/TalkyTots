import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import io from "socket.io-client";
import Chat from "./Chat";
import AuthPage from "./components/AuthPage";

const socket = io.connect("http://localhost:3001");

// Route protection HOC
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  // Try to load from localStorage for persistent login
  const [user, setUser] = useState(() => {
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");
    return username && token ? { username, token } : null;
  });
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);

  // Simple join logic, but could move to Chat component or a RoomList component
  const joinRoom = () => {
    if (user?.username && room !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    setUser(null);
    setShowChat(false);
    setRoom("");
  };

  return (
    <Router>
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
              {!showChat ? (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-green-50">
                  <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 flex flex-col items-center">
                    <h3 className="text-2xl font-bold mb-6 text-green-700">Join a Chat</h3>
                    <input
                      type="text"
                      placeholder="Room ID..."
                      onChange={event => setRoom(event.target.value)}
                      className="w-full px-4 py-2 mb-4 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                    <button
                      onClick={joinRoom}
                      className="w-full mb-2 py-2 text-white font-semibold rounded bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      Join A Room
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full py-2 text-green-700 font-semibold rounded border border-green-600 hover:bg-green-50 transition-colors mt-2"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Chat
                  socket={socket}
                  username={user.username}
                  room={room}
                  onLeave={() => setShowChat(false)}
                />
              )}
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
    </Router>
  );
}

export default App;