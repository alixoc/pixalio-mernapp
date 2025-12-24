require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const storiesRoutes = require('./routes/stories');

const app = express();
const server = http.createServer(app);

// 🔑 Port setup
const PORT = process.env.PORT || 5000;

// ============================
// CORS CONFIG (AZURE SAFE)
// ============================
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / server-to-server

    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }

    if (origin.endsWith('.azurestaticapps.net')) {
      return callback(null, true);
    }

    if (process.env.CLIENT_ORIGIN && origin === process.env.CLIENT_ORIGIN) {
      return callback(null, true);
    }

    return callback(new Error('CORS blocked: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ============================
// MIDDLEWARE
// ============================
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// ============================
// SOCKET.IO SETUP
// ============================
const io = new Server(server, { cors: corsOptions });

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    socket.userRole = payload.role;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
    console.log('Socket connected:', socket.userId);
  }

  socket.on('typing', ({ to, typing }) => {
    if (to) {
      io.to(`user:${to}`).emit('typing', {
        from: socket.userId,
        to,
        typing
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.set('io', io);

// ============================
// ROUTES
// ============================
app.get('/', (req, res) => {
  res.json({ status: 'Pixalio API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stories', storiesRoutes);

// ============================
// SERVE REACT IN PRODUCTION
// ============================
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// ============================
// DATABASE CONNECTION + SERVER START
// ============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
