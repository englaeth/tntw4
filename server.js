// ================== 1. استيراد الحزم المطلوبة ==================
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ================== 2. إعداد التطبيق ==================
const app = express();
const server = http.createServer(app);

// ================== 3. إعداد Socket.IO ==================
const io = socketIO(server, {
  cors: {
    origin: "*", // يمكنك تحديد نطاق معين في الإنتاج
    methods: ["GET", "POST"]
  }
});

// ================== 4. استضافة الملفات العميلية ==================
app.use(express.static(path.join(__dirname, '../client')));

// ================== 5. تخزين بيانات الغرف واللاعبين ==================
const rooms = {};

// ================== 6. معالجة اتصالات Socket.IO ==================
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // ==== إنشاء غرفة جديدة ====
  socket.on('createRoom', (playerData) => {
    const roomId = generateRoomCode(6);
    rooms[roomId] = {
      hostId: socket.id,
      status: 'waiting',
      createdAt: Date.now(),
      gameSettings: {
        maxPlayers: 8,
        initialSize: 10,
        winSize: 50,
        maxPoisons: 20
      },
      players: {
        [socket.id]: {
          ...playerData,
          isReady: false,
          isAlive: true,
          isWinner: false,
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          angle: Math.random() * Math.PI * 2,
          targetAngle: 0,
          size: 10,
          color: `hsl(${Math.random() * 360}, 70%, 70%)`,
          segments: [],
          lastUpdate: Date.now()
        }
      },
      poisons: []
    };
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, isHost: true });
    socket.roomId = roomId;
  });

  // ==== الانضمام إلى غرفة ====
  socket.on('joinRoom', ({ roomId, playerData }) => {
    if (!rooms[roomId]) {
      return socket.emit('roomError', { message: 'Room not found' });
    }

    const room = rooms[roomId];
    if (room.status !== 'waiting') {
      return socket.emit('roomError', { message: 'Game has already started' });
    }

    if (Object.keys(room.players).length >= room.gameSettings.maxPlayers) {
      return socket.emit('roomError', { message: 'Room is full' });
    }

    room.players[socket.id] = {
      ...playerData,
      isReady: false,
      isAlive: true,
      isWinner: false,
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      angle: Math.random() * Math.PI * 2,
      targetAngle: 0,
      size: 10,
      color: `hsl(${Math.random() * 360}, 70%, 70%)`,
      segments: [],
      lastUpdate: Date.now()
    };

    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('roomJoined', { roomId, isHost: false });
    io.to(roomId).emit('playerListUpdated', room.players);
  });

  // ==== البحث عن غرفة عشوائية ====
  socket.on('findRandomRoom', (playerData) => {
    let joined = false;
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.status === 'waiting' && Object.keys(room.players).length < room.gameSettings.maxPlayers) {
        room.players[socket.id] = {
          ...playerData,
          isReady: false,
          isAlive: true,
          isWinner: false,
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          angle: Math.random() * Math.PI * 2,
          targetAngle: 0,
          size: 10,
          color: `hsl(${Math.random() * 360}, 70%, 70%)`,
          segments: [],
          lastUpdate: Date.now()
        };
        socket.join(roomId);
        socket.roomId = roomId;
        socket.emit('roomJoined', { roomId, isHost: false });
        io.to(roomId).emit('playerListUpdated', room.players);
        joined = true;
        break;
      }
    }

    if (!joined) {
      const roomId = generateRoomCode(6);
      rooms[roomId] = {
        hostId: socket.id,
        status: 'waiting',
        createdAt: Date.now(),
        gameSettings: {
          maxPlayers: 8,
          initialSize: 10,
          winSize: 50,
          maxPoisons: 20
        },
        players: {
          [socket.id]: {
            ...playerData,
            isReady: false,
            isAlive: true,
            isWinner: false,
            x: Math.random() * 800 + 100,
            y: Math.random() * 600 + 100,
            angle: Math.random() * Math.PI * 2,
            targetAngle: 0,
            size: 10,
            color: `hsl(${Math.random() * 360}, 70%, 70%)`,
            segments: [],
            lastUpdate: Date.now()
          }
        },
        poisons: []
      };
      socket.join(roomId);
      socket.roomId = roomId;
      socket.emit('roomCreated', { roomId, isHost: true });
    }
  });

  // ==== تحديث حالة الاستعداد ====
  socket.on('toggleReady', (isReady) => {
    if (socket.roomId && rooms[socket.roomId]?.players[socket.id]) {
      rooms[socket.roomId].players[socket.id].isReady = isReady;
      io.to(socket.roomId).emit('playerListUpdated', rooms[socket.roomId].players);
    }
  });

  // ==== بدء اللعبة (للمضيف فقط) ====
  socket.on('startGame', () => {
    if (socket.roomId && rooms[socket.roomId] && rooms[socket.roomId].hostId === socket.id) {
      rooms[socket.roomId].status = 'playing';
      io.to(socket.roomId).emit('gameStarted', rooms[socket.roomId]);
    }
  });

  // ==== تحديث موقع اللاعب ====
  socket.on('updatePlayerPosition', (playerData) => {
    if (socket.roomId && rooms[socket.roomId]?.players[socket.id]) {
      Object.assign(rooms[socket.roomId].players[socket.id], playerData);
      socket.to(socket.roomId).emit('playerMoved', {
        id: socket.id,
        ...playerData
      });
    }
  });

  // ==== التقاط سم ====
  socket.on('collectPoison', (poisonId) => {
    if (!socket.roomId || !rooms[socket.roomId]?.poisons) return;

    const poisonIndex = rooms[socket.roomId].poisons.findIndex(p => p.id === poisonId);
    if (poisonIndex === -1) return;

    const collectedPoison = rooms[socket.roomId].poisons.splice(poisonIndex, 1)[0];

    if (rooms[socket.roomId].players[socket.id]) {
      rooms[socket.roomId].players[socket.id].size += 0.5;

      if (rooms[socket.roomId].players[socket.id].size >= rooms[socket.roomId].gameSettings.winSize) {
        rooms[socket.roomId].status = 'finished';
        rooms[socket.roomId].winner = socket.id;
        io.to(socket.roomId).emit('gameOver', {
          winnerId: socket.id,
          players: rooms[socket.roomId].players
        });
      }
    }

    io.to(socket.roomId).emit('poisonCollected', {
      poisonId,
      playerId: socket.id,
      playerSize: rooms[socket.roomId].players[socket.id].size
    });
  });

  // ==== مغادرة اللاعب للغرفة ====
  socket.on('leaveRoom', () => {
    handlePlayerDisconnect(socket);
  });

  // ==== قطع الاتصال ====
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    handlePlayerDisconnect(socket);
  });
});

// ================== 7. معالجة مغادرة اللاعب ==================
function handlePlayerDisconnect(socket) {
  if (!socket.roomId || !rooms[socket.roomId]) return;

  delete rooms[socket.roomId].players[socket.id];

  if (rooms[socket.roomId].hostId === socket.id) {
    const remainingPlayers = Object.keys(rooms[socket.roomId].players);
    if (remainingPlayers.length > 0) {
      rooms[socket.roomId].hostId = remainingPlayers[0];
      io.to(socket.roomId).emit('hostChanged', { newHostId: remainingPlayers[0] });
    } else {
      delete rooms[socket.roomId]; // حذف الغرفة إذا لم يكن هناك لاعبين
      return;
    }
  }

  io.to(socket.roomId).emit('playerListUpdated', rooms[socket.roomId].players);
  socket.leave(socket.roomId);
  socket.roomId = null;
}

// ================== 8. إنشاء كود غرفة عشوائي ==================
function generateRoomCode(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ================== 9. تشغيل السيرفر ==================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
