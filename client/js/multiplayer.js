// Multiplayer Functions with Socket.IO
let socket;
let currentRoomId = null;
let isHost = false;
let localPlayerReady = false;
let remotePlayers = {};

// تهيئة Socket.IO
function initializeSocketIO() {
    // الاتصال بالخادم على المنفذ 3000 بغض النظر عن منفذ العميل
    socket = io();
    
    // معالجة الأحداث الواردة من الخادم
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showSystemPopup(translations.connectionLost[currentLang] || "Connection lost. Please refresh.", true, 3000);
    });
    
    socket.on('roomCreated', ({ roomId, isHost: host }) => {
        currentRoomId = roomId;
        isHost = host;
        hideSystemPopup();
        showLobbyScreen(roomId, host);
    });
    
    socket.on('roomJoined', ({ roomId, isHost: host }) => {
        currentRoomId = roomId;
        isHost = host;
        hideSystemPopup();
        showLobbyScreen(roomId, host);
    });
    
    socket.on('roomError', ({ message }) => {
        hideSystemPopup();
        showSystemPopup(message, true, 3000);
    });
    
    socket.on('playerListUpdated', (players) => {
        updateLobbyPlayerList(players);
    });
    
    socket.on('gameStarted', (roomData) => {
        console.log("Game starting, transitioning from lobby...");

        // Create a new Game instance specifically for this multiplayer session
        // This avoids relying on a potentially uninitialized global instance
        gameInstance = new Game("multiplayer"); // Create/overwrite the instance

        // Hide lobby and show game canvas
        hideAllScreens();
        if(gameContainer) gameContainer.style.display = "block";

        // Start the multiplayer game logic using the newly created instance
        gameInstance.startMultiplayer(roomData.players);
    });
    
    socket.on('playerMoved', (playerData) => {
        if (gameInstance && gameInstance.gameMode === "multiplayer") {
            if (!remotePlayers[playerData.id]) {
                // إنشاء لاعب جديد إذا لم يكن موجودًا
                remotePlayers[playerData.id] = new Player(playerData.id, playerData.name, playerData.x, playerData.y, playerData.color);
            }
            // تحديث بيانات اللاعب
            Object.assign(remotePlayers[playerData.id], playerData);
        }
    });
    
    socket.on('poisonAdded', (poison) => {
        if (gameInstance) {
            gameInstance.addPoison(poison);
        }
    });
    
    socket.on('poisonCollected', ({ poisonId, playerId, playerSize }) => {
        if (gameInstance) {
            gameInstance.removePoison(poisonId);
            if (remotePlayers[playerId]) {
                remotePlayers[playerId].size = playerSize;
            }
        }
    });
    
    socket.on('powerupActivated', (powerupData) => {
        if (gameInstance) {
            gameInstance.handleRemotePowerup(powerupData);
        }
    });
    
    socket.on('gameOver', ({ winnerId, players }) => {
        if (gameInstance) {
            gameInstance.handleMultiplayerGameOver(winnerId, players);
        }
    });
    
    socket.on('hostChanged', ({ newHostId }) => {
        if (socket.id === newHostId) {
            isHost = true;
            showSystemPopup(translations.youAreNowHost[currentLang] || "You are now the host", false, 2000);
            if (lobbyScreen.style.display === "flex") {
                updateLobbyUI();
            }
        }
    });
}

// إنشاء غرفة جديدة
function createRoom() {
    console.log("Creating new room...");
    showSystemPopup(translations.creatingRoom[currentLang] || "Creating room...");
    
    const playerData = {
        name: tgPlayerName,
        avatarUrl: tgPlayerAvatarUrl
    };
    
    socket.emit('createRoom', playerData);
}

// الانضمام إلى غرفة بالكود
function joinRoomWithCode() {
    const roomCodeInput = document.getElementById("joinRoomCodeInput");
    const roomId = roomCodeInput.value.trim();
    if (!roomId) {
        showSystemPopup(translations.alertEnterRoomCode[currentLang] || "Please enter room code", true, 2000);
        return;
    }
    console.log(`Attempting to join room: ${roomId}`);
    showSystemPopup(translations.joiningRoom[currentLang] || "Joining room...");
    
    const playerData = {
        name: tgPlayerName,
        avatarUrl: tgPlayerAvatarUrl
    };
    
    socket.emit('joinRoom', { roomId, playerData });
    roomCodeInput.value = ""; // مسح الإدخال
}

// الانضمام إلى غرفة عشوائية
function joinRandomRoom() {
    console.log("Attempting to join random room...");
    showSystemPopup(translations.findingMatch[currentLang] || "Finding match...");
    
    // في هذه الحالة، سنطلب من الخادم إيجاد غرفة عشوائية
    socket.emit('findRandomRoom', {
        name: tgPlayerName,
        avatarUrl: tgPlayerAvatarUrl
    });
}

// تبديل حالة استعداد اللاعب
function togglePlayerReady() {
    if (!currentRoomId) return;
    localPlayerReady = !localPlayerReady;
    socket.emit('toggleReady', localPlayerReady);
    updateReadyButtonUI();
}

// تحديث واجهة زر الاستعداد
function updateReadyButtonUI() {
    if (!lobbyReadyButton) return;
    if (localPlayerReady) {
        lobbyReadyButton.classList.remove("bg-green-500", "hover:bg-green-400");
        lobbyReadyButton.classList.add("bg-yellow-500", "hover:bg-yellow-400");
        lobbyReadyButton.querySelector("span").textContent = translations.notReady[currentLang] || "Not Ready";
        lobbyReadyButton.querySelector("i").className = "fas fa-times-circle mr-2";
    } else {
        lobbyReadyButton.classList.remove("bg-yellow-500", "hover:bg-yellow-400");
        lobbyReadyButton.classList.add("bg-green-500", "hover:bg-green-400");
        lobbyReadyButton.querySelector("span").textContent = translations.ready[currentLang] || "Ready";
        lobbyReadyButton.querySelector("i").className = "fas fa-check-circle mr-2";
    }
}

// تحديث قائمة اللاعبين في الغرفة
function updateLobbyPlayerList(playersData) {
    if (!lobbyPlayerList) return;
    lobbyPlayerList.innerHTML = ""; // مسح القائمة الحالية
    let allReady = true;
    let playerCount = 0;
    
    for (const playerId in playersData) {
        playerCount++;
        const player = playersData[playerId];
        const li = document.createElement("li");
        li.className = `py-1 px-2 rounded ${player.isReady ? 'bg-green-600' : 'bg-gray-600'} flex justify-between items-center`;
        
        const nameSpan = document.createElement("span");
        nameSpan.textContent = player.name + (playerId === socket.id ? " (You)" : "");
        
        const statusSpan = document.createElement("span");
        statusSpan.textContent = player.isReady ? (translations.ready[currentLang] || "Ready") : (translations.notReady[currentLang] || "Not Ready");
        statusSpan.className = `text-xs px-2 py-1 rounded ${player.isReady ? 'bg-green-400' : 'bg-red-400'}`;

        li.appendChild(nameSpan);
        li.appendChild(statusSpan);
        lobbyPlayerList.appendChild(li);
        if (!player.isReady) {
            allReady = false;
        }
    }
    
    // إظهار/إخفاء زر بدء اللعبة للمضيف
    if (isHost && lobbyStartGameButton) {
        lobbyStartGameButton.style.display = (playerCount >= 1 && allReady) ? "flex" : "none";
    }
}

// بدء اللعبة (للمضيف فقط)
function hostStartGame() {
    if (!isHost || !currentRoomId) return;
    console.log("Host starting game...");
    socket.emit('startGame');
}

// مغادرة الغرفة
function leaveRoom() {
    if (!currentRoomId) {
        showMainPage();
        return;
    }
    console.log(`Player leaving room ${currentRoomId}`);
    socket.emit('leaveRoom');
    resetLobbyState();
    showMainPage();
}

// إعادة تعيين حالة الغرفة
function resetLobbyState() {
    currentRoomId = null;
    isHost = false;
    localPlayerReady = false;
    remotePlayers = {};
    if(lobbyPlayerList) lobbyPlayerList.innerHTML = "";
    if(lobbyRoomCodeDisplay) lobbyRoomCodeDisplay.textContent = "-----";
}

// تحديث موقع اللاعب
function updatePlayerPosition(playerData) {
    if (!currentRoomId || !socket) return;
    socket.emit('updatePlayerPosition', playerData);
}

// إضافة سم جديد
function addPoison(poisonData) {
    if (!currentRoomId || !socket) return;
    socket.emit('addPoison', poisonData);
}

// التقاط سم
function collectPoison(poisonId) {
    if (!currentRoomId || !socket) return;
    socket.emit('collectPoison', poisonId);
}

// تفعيل قوة خاصة
function activatePowerup(powerupData) {
    if (!currentRoomId || !socket) return;
    socket.emit('activatePowerup', powerupData);
}

// إظهار شاشة الغرفة
function showLobbyScreen(roomId, host) {
    currentRoomId = roomId;
    isHost = host;
    
    // إخفاء الشاشات الأخرى
    mainPage.style.display = "none";
    multiplayerMenu.style.display = "none";
    
    // إظهار شاشة الغرفة
    lobbyScreen.style.display = "flex";
    
    // تحديث كود الغرفة
    if (lobbyRoomCodeDisplay) {
        lobbyRoomCodeDisplay.textContent = roomId;
    }
    
    // تحديث واجهة المضيف
    updateLobbyUI();
}

// تحديث واجهة الغرفة
function updateLobbyUI() {
    if (isHost && lobbyStartGameButton) {
        lobbyStartGameButton.style.display = "none"; // سيتم تحديثه بناءً على حالة استعداد اللاعبين
    } else if (lobbyStartGameButton) {
        lobbyStartGameButton.style.display = "none";
    }
}
