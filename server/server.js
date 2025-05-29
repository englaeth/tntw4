const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// إعداد الملفات الثابتة
app.use(express.static(path.join(__dirname, '../client')));

// تخزين بيانات الغرف واللاعبين
const rooms = {};

// معالجة اتصالات Socket.IO
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // إنشاء غرفة جديدة
    socket.on('createRoom', (playerData) => {
        const roomId = generateRoomCode(6);
        rooms[roomId] = {
            hostId: socket.id,
            status: 'waiting',
            createdAt: Date.now(),
            gameSettings: {
                maxPlayers: 8,
                initialSize: 10,
                winSize: 5,
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
    
    // الانضمام إلى غرفة بالكود
    socket.on('joinRoom', ({ roomId, playerData }) => {
        if (rooms[roomId] && rooms[roomId].status === 'waiting' && 
            Object.keys(rooms[roomId].players).length < rooms[roomId].gameSettings.maxPlayers) {
            
            rooms[roomId].players[socket.id] = {
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
            io.to(roomId).emit('playerListUpdated', rooms[roomId].players);
        } else {
            socket.emit('roomError', { message: 'Room not found or is full' });
        }
    });
    
    // البحث عن غرفة عشوائية
    socket.on('findRandomRoom', (playerData) => {
        let joined = false;
        
        // البحث عن غرفة متاحة
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.status === 'waiting' && 
                Object.keys(room.players).length < room.gameSettings.maxPlayers) {
                
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
        
        // إذا لم يتم العثور على غرفة، إنشاء غرفة جديدة
        if (!joined) {
            const roomId = generateRoomCode(6);
            rooms[roomId] = {
                hostId: socket.id,
                status: 'waiting',
                createdAt: Date.now(),
                gameSettings: {
                    maxPlayers: 8,
                    initialSize: 10,
                    winSize: 5,
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
    
    // تحديث حالة الاستعداد
    socket.on('toggleReady', (isReady) => {
        if (socket.roomId && rooms[socket.roomId] && rooms[socket.roomId].players[socket.id]) {
            rooms[socket.roomId].players[socket.id].isReady = isReady;
            io.to(socket.roomId).emit('playerListUpdated', rooms[socket.roomId].players);
        }
    });
    
    // بدء اللعبة (للمضيف فقط)
    socket.on('startGame', () => {
        if (socket.roomId && rooms[socket.roomId] && rooms[socket.roomId].hostId === socket.id) {
            rooms[socket.roomId].status = 'playing';
            io.to(socket.roomId).emit('gameStarted', rooms[socket.roomId]);
        }
    });
    
    // تحديث موقع اللاعب
    socket.on('updatePlayerPosition', (playerData) => {
        if (socket.roomId && rooms[socket.roomId] && rooms[socket.roomId].players[socket.id]) {
            Object.assign(rooms[socket.roomId].players[socket.id], playerData);
            socket.to(socket.roomId).emit('playerMoved', {
                id: socket.id,
                ...playerData
            });
        }
    });
    
    // إضافة سم جديد
    socket.on('addPoison', (poisonData) => {
        if (socket.roomId && rooms[socket.roomId]) {
            const poisonId = uuidv4();
            const newPoison = {
                id: poisonId,
                ...poisonData,
                createdAt: Date.now()
            };
            
            if (!rooms[socket.roomId].poisons) {
                rooms[socket.roomId].poisons = [];
            }
            
            rooms[socket.roomId].poisons.push(newPoison);
            io.to(socket.roomId).emit('poisonAdded', newPoison);
        }
    });
    
    // التقاط سم
    socket.on('collectPoison', (poisonId) => {
        if (socket.roomId && rooms[socket.roomId] && rooms[socket.roomId].poisons) {
            const poisonIndex = rooms[socket.roomId].poisons.findIndex(p => p.id === poisonId);
            if (poisonIndex !== -1) {
                const collectedPoison = rooms[socket.roomId].poisons[poisonIndex];
                rooms[socket.roomId].poisons.splice(poisonIndex, 1);
                
                // تحديث حجم اللاعب
                if (rooms[socket.roomId].players[socket.id]) {
                    rooms[socket.roomId].players[socket.id].size += 0.5;
                    
                    // التحقق من الفوز
                    if (rooms[socket.roomId].players[socket.id].size <= rooms[socket.roomId].gameSettings.winSize) {
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
            }
        }
    });
    
    // تفعيل قوة خاصة
    socket.on('activatePowerup', (powerupData) => {
        if (socket.roomId) {
            socket.to(socket.roomId).emit('powerupActivated', {
                playerId: socket.id,
                ...powerupData
            });
        }
    });
    
    // مغادرة الغرفة
    socket.on('leaveRoom', () => {
        handlePlayerDisconnect(socket);
    });
    
    // قطع الاتصال
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        handlePlayerDisconnect(socket);
    });
});

// معالجة مغادرة اللاعب
function handlePlayerDisconnect(socket) {
    if (socket.roomId && rooms[socket.roomId]) {
        // إزالة اللاعب من الغرفة
        if (rooms[socket.roomId].players[socket.id]) {
            delete rooms[socket.roomId].players[socket.id];
        }
        
        // إذا كان المضيف، تعيين مضيف جديد أو حذف الغرفة
        if (rooms[socket.roomId].hostId === socket.id) {
            const remainingPlayers = Object.keys(rooms[socket.roomId].players);
            if (remainingPlayers.length > 0) {
                rooms[socket.roomId].hostId = remainingPlayers[0];
                io.to(socket.roomId).emit('hostChanged', { newHostId: remainingPlayers[0] });
            } else {
                delete rooms[socket.roomId];
                return;
            }
        }
        
        // إعلام اللاعبين المتبقين
        io.to(socket.roomId).emit('playerListUpdated', rooms[socket.roomId].players);
        
        // إزالة اللاعب من الغرفة
        socket.leave(socket.roomId);
        socket.roomId = null;
    }
}

// إنشاء كود غرفة عشوائي
function generateRoomCode(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// بدء الخادم
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
