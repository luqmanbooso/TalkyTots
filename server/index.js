const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');
const dotenv = require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
// Middleware to get user from JWT
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}


app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected.'))
  .catch(err => console.error(err));

// --- AUTH ROUTES ---

// Sign up
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if(!username || !email || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
    const existing = await User.findOne({ $or: [{username}, {email}] });
    if(existing) return res.status(400).json({ success: false, message: 'Username or email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    res.status(201).json({ success: true, user: { username: user.username, email: user.email } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
    const user = await User.findOne({ username });
    if(!user) return res.status(400).json({ success: false, message: 'User not found.' });

    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400).json({ success: false, message: 'Invalid password.' });

    const token = jwt.sign({ username: user.username, userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, username: user.username });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// chat socket io
const server = http.createServer(app)   ;

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173','http://localhost:5174'],
        methods: ['GET', 'POST'],
    }
})

io.on("connection", (socket)=>{
    console.log(`user connected: ${socket.id}`);

    socket.on("join_room", (roomId)=>{
        socket.join(roomId);
        console.log(`user with id: ${socket.id} joined room: ${roomId}`);
    })

    socket.on("send_message", (data)=>{
        // console.log(data);
        io.to(data.roomId).emit("receive_message", data);
    })

    socket.on("disconnect", ()=>{
        console.log("user disconnected", socket.id);
    })
})


// Create or join a room
app.post('/api/rooms', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Room name required" });
  let room = await Room.findOne({ name });
  if (!room) {
    room = await Room.create({ name, members: [req.user.userId] });
  } else if (!room.members.includes(req.user.userId)) {
    room.members.push(req.user.userId);
    await room.save();
  }
  res.json({ success: true, room });
});

// Get user's rooms
app.get('/api/rooms', authMiddleware, async (req, res) => {
  const rooms = await Room.find({ members: req.user.userId });
  res.json({ success: true, rooms });
});

// Get messages for room
app.get('/api/rooms/:roomId/messages', authMiddleware, async (req, res) => {
  const messages = await Message.find({ room: req.params.roomId })
    .populate('sender', 'username')
    .sort({ createdAt: 1 });
  res.json({ success: true, messages });
});

// Send/store message
app.post('/api/rooms/:roomId/messages', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: "No content" });
  const message = await Message.create({
    room: req.params.roomId,
    sender: req.user.userId,
    content,
  });
  // Optionally: emit with socket.io here
  res.json({ success: true, message });
});

server.listen(3001, () => {
    console.log('Server is running on port 3001');
});

