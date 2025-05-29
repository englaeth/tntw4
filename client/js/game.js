// Game class - Core game logic
class Game {
    constructor(mode = "solo") {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.gameMode = mode; // "solo" or "multiplayer"
        this.player = null;
        this.poisons = [];
        this.powerups = [];
        this.gameOver = false;
        this.winner = null;
        this.lastPoisonSpawn = 0;
        this.resizeCanvas();
        this.setupEventListeners();
        this.setupJoystick();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        window.addEventListener("resize", () => this.resizeCanvas());
        
        // Keyboard controls
        window.addEventListener("keydown", (e) => {
            if (this.gameOver) return;
            
            switch (e.key) {
                case "ArrowLeft":
                    this.player.turnLeft = true;
                    break;
                case "ArrowRight":
                    this.player.turnRight = true;
                    break;
            }
        });
        
        window.addEventListener("keyup", (e) => {
            if (this.gameOver) return;
            
            switch (e.key) {
                case "ArrowLeft":
                    this.player.turnLeft = false;
                    break;
                case "ArrowRight":
                    this.player.turnRight = false;
                    break;
            }
        });
    }

    setupJoystick() {
        if (isMobile()) {
            initJoystick(this);
        }
    }

    start(playerName, initialSize = GAME_SETTINGS.INITIAL_WORM_SIZE) {
        this.gameOver = false;
        this.winner = null;
        
        // Create player
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;
        const color = `hsl(${Math.random() * 360}, 70%, 70%)`;
        this.player = new Player(socket ? socket.id : "local", playerName, x, y, color);
        this.player.size = initialSize;
        
        // Initialize poisons
        this.poisons = [];
        for (let i = 0; i < GAME_SETTINGS.MAX_POISONS; i++) {
            this.spawnPoison();
        }
        
        // Start game loop
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    startMultiplayer(players) {
        this.gameOver = false;
        this.winner = null;
        
        // Set up local player from players data
        if (players[socket.id]) {
            const playerData = players[socket.id];
            this.player = new Player(
                socket.id,
                playerData.name,
                playerData.x,
                playerData.y,
                playerData.color
            );
            this.player.size = playerData.size;
            this.player.angle = playerData.angle;
        } else {
            console.error("Local player not found in room data");
            return;
        }
        
        // Set up remote players
        remotePlayers = {};
        for (const playerId in players) {
            if (playerId !== socket.id) {
                const pData = players[playerId];
                remotePlayers[playerId] = new Player(
                    playerId,
                    pData.name,
                    pData.x,
                    pData.y,
                    pData.color
                );
                remotePlayers[playerId].size = pData.size;
                remotePlayers[playerId].angle = pData.angle;
                remotePlayers[playerId].segments = pData.segments || [];
            }
        }
        
        // Start game loop
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
        
        // Show room code if in multiplayer mode
        if (currentRoomId) {
            const roomCodeDisplay = document.getElementById("roomCodeDisplay");
            if (roomCodeDisplay) {
                roomCodeDisplay.textContent = `${translations.roomCodeLabel[currentLang] || "Room"}: ${currentRoomId}`;
                roomCodeDisplay.style.display = "block";
            }
        }
    }

    gameLoop(timestamp) {
        if (this.gameOver) return;
        
        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw poisons
        this.updatePoisons(deltaTime);
        
        // Update and draw player
        this.player.update(deltaTime);
        this.player.draw(this.ctx);
        
        // Update and draw remote players in multiplayer mode
        if (this.gameMode === "multiplayer") {
            for (const id in remotePlayers) {
                const remotePlayer = remotePlayers[id];
                remotePlayer.update(deltaTime);
                remotePlayer.draw(this.ctx);
            }
            
            // Send player position update to server
            if (socket && currentRoomId) {
                updatePlayerPosition({
                    x: this.player.x,
                    y: this.player.y,
                    angle: this.player.angle,
                    size: this.player.size,
                    segments: this.player.segments
                });
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
        
        // Continue game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    updatePoisons(deltaTime) {
        // Spawn new poisons if needed
        if (this.gameMode === "solo" || (this.gameMode === "multiplayer" && isHost)) {
            this.lastPoisonSpawn += deltaTime;
            if (this.lastPoisonSpawn > GAME_SETTINGS.POISON_SPAWN_INTERVAL) {
                this.lastPoisonSpawn = 0;
                if (this.poisons.length < GAME_SETTINGS.MAX_POISONS) {
                    this.spawnPoison();
                }
            }
        }
        
        // Draw poisons
        this.poisons.forEach(poison => {
            this.ctx.beginPath();
            this.ctx.arc(poison.x, poison.y, GAME_SETTINGS.POISON_SIZE, 0, Math.PI * 2);
            this.ctx.fillStyle = poison.isPowerup ? "#ff9900" : "#33ff33";
            this.ctx.fill();
        });
    }

    spawnPoison() {
        const padding = GAME_SETTINGS.BOUNDARY_PADDING;
        const x = Math.random() * (this.canvas.width - padding * 2) + padding;
        const y = Math.random() * (this.canvas.height - padding * 2) + padding;
        const isPowerup = Math.random() < GAME_SETTINGS.POWERUP_CHANCE;
        
        const poison = {
            x,
            y,
            isPowerup,
            type: isPowerup ? getRandomPowerupType() : "regular"
        };
        
        this.poisons.push(poison);
        
        // In multiplayer mode, notify other players
        if (this.gameMode === "multiplayer" && socket && currentRoomId) {
            addPoison(poison);
        }
    }

    checkCollisions() {
        // Check player collision with poisons
        for (let i = this.poisons.length - 1; i >= 0; i--) {
            const poison = this.poisons[i];
            const dx = this.player.x - poison.x;
            const dy = this.player.y - poison.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.size + GAME_SETTINGS.POISON_SIZE) {
                // Collect poison
                if (poison.isPowerup) {
                    this.activatePowerup(poison.type);
                } else {
                    // Regular poison decreases size
                    this.player.size -= 0.5;
                    
                    // Check lose condition (size reaches 0)
                    if (this.player.size <= 0) {
                        this.handleLose();
                    }
                }
                
                // Remove poison
                this.poisons.splice(i, 1);
                
                // In multiplayer mode, notify other players
                if (this.gameMode === "multiplayer" && socket && currentRoomId) {
                    collectPoison(poison.id);
                }
            }
        }
        
        // Check boundary collision
        const padding = GAME_SETTINGS.BOUNDARY_PADDING;
        if (
            this.player.x < padding ||
            this.player.x > this.canvas.width - padding ||
            this.player.y < padding ||
            this.player.y > this.canvas.height - padding
        ) {
            // Bounce off boundary
            if (this.player.x < padding) this.player.x = padding;
            if (this.player.x > this.canvas.width - padding) this.player.x = this.canvas.width - padding;
            if (this.player.y < padding) this.player.y = padding;
            if (this.player.y > this.canvas.height - padding) this.player.y = this.canvas.height - padding;
            
            // Reverse direction
            this.player.angle += Math.PI;
        }
    }

    activatePowerup(type) {
        console.log(`Activating powerup: ${type}`);
        
        // Apply powerup effect
        switch (type) {
            case "speed":
                this.player.speedBoost = 2;
                setTimeout(() => {
                    this.player.speedBoost = 1;
                }, GAME_SETTINGS.POWERUP_DURATION);
                break;
            case "shrink":
                this.player.size -= 1;
                break;
            case "magnet":
                activateMagnetEffect(this);
                break;
            case "reverse":
                activateReverseControlsEffect(this);
                break;
            case "swap":
                if (this.gameMode === "multiplayer") {
                    activateSwapSizesEffect(this);
                }
                break;
            case "control":
                if (this.gameMode === "multiplayer") {
                    activateControlOpponentEffect(this);
                }
                break;
        }
        
        // In multiplayer mode, notify other players
        if (this.gameMode === "multiplayer" && socket && currentRoomId) {
            activatePowerup({ type });
        }
    }

    handleLose() {
        this.gameOver = true;
        this.winner = this.player.id;
        
        if (this.gameMode === "solo") {
            showSystemPopup(translations.youWonByLosing[currentLang] || "You Won! (by reaching size 0)", false, 0, "win");
            showLuckyWheel(); // Show the lucky wheel after winning (losing)
        } else if (this.gameMode === "multiplayer") {
            // In multiplayer, the server will determine the winner
        }
    }

    handleMultiplayerGameOver(winnerId, players) {
        this.gameOver = true;
        this.winner = winnerId;
        
        if (winnerId === this.player.id) { // Check if the current player is the winner (loser)
            showSystemPopup(translations.youWonByLosing[currentLang] || "You Won! (by reaching size 0)", false, 0, "win");
            showLuckyWheel(); // Show lucky wheel for the winner (loser)
        } else {
            const winnerName = players[winnerId]?.name || "Unknown";
            showSystemPopup(`${winnerName} ${translations.wins[currentLang] || "wins!"}`, false, 0, "loss"); // Show message for other players
        }
    }

    updateUI() {
        // Update info display
        const infoElement = document.getElementById("info");
        if (infoElement) {
            infoElement.textContent = `${translations.size[currentLang] || "Size"}: ${this.player.size.toFixed(1)}`;
        }
    }

    addPoison(poison) {
        this.poisons.push(poison);
    }

    removePoison(poisonId) {
        const index = this.poisons.findIndex(p => p.id === poisonId);
        if (index !== -1) {
            this.poisons.splice(index, 1);
        }
    }

    handleRemotePowerup(powerupData) {
        // Handle powerup activated by another player
        console.log(`Remote player activated powerup: ${powerupData.type}`);
        
        switch (powerupData.type) {
            case "swap":
                // Handle size swap
                if (powerupData.targetId === socket.id) {
                    handleSwapSizesEffect(powerupData.playerId);
                }
                break;
            case "control":
                // Handle control opponent
                if (powerupData.targetId === socket.id) {
                    handleControlledByOpponent(powerupData.playerId);
                }
                break;
        }
    }
}

// Player class
class Player {
    constructor(id, name, x, y, color) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.angle = Math.random() * Math.PI * 2;
        this.size = GAME_SETTINGS.INITIAL_WORM_SIZE;
        this.color = color;
        this.segments = [];
        this.turnLeft = false;
        this.turnRight = false;
        this.speedBoost = 1;
        this.reverseControls = false;
    }

    update(deltaTime) {
        // Update angle based on controls
        if (this.turnLeft) {
            this.angle -= GAME_SETTINGS.WORM_TURN_SPEED * (this.reverseControls ? -1 : 1);
        }
        if (this.turnRight) {
            this.angle += GAME_SETTINGS.WORM_TURN_SPEED * (this.reverseControls ? -1 : 1);
        }
        
        // Update position
        const speed = GAME_SETTINGS.WORM_SPEED * this.speedBoost;
        this.x += Math.cos(this.angle) * speed;
        this.y += Math.sin(this.angle) * speed;
        
        // Update segments
        this.updateSegments();
    }

    updateSegments() {
        // Add current position to segments
        this.segments.unshift({ x: this.x, y: this.y });
        
        // Calculate number of segments based on size
        const numSegments = Math.floor(this.size * 2);
        
        // Remove excess segments
        if (this.segments.length > numSegments) {
            this.segments = this.segments.slice(0, numSegments);
        }
    }

    draw(ctx) {
        // Draw segments
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const segmentSize = this.size * (1 - i / this.segments.length * 0.5);
            
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, segmentSize, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
        // Draw head
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw eyes
        const eyeOffset = this.size * 0.3;
        const eyeSize = this.size * 0.25;
        const eyeX = Math.cos(this.angle) * eyeOffset;
        const eyeY = Math.sin(this.angle) * eyeOffset;
        
        ctx.beginPath();
        ctx.arc(this.x + eyeX - eyeY * 0.5, this.y + eyeY + eyeX * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.arc(this.x + eyeX + eyeY * 0.5, this.y + eyeY - eyeX * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        
        // Draw name
        ctx.font = "14px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.x, this.y - this.size - 10);
    }
}

// Helper functions
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getRandomPowerupType() {
    const types = ["speed", "shrink", "magnet", "reverse"];
    
    // Add multiplayer-only powerups if in multiplayer mode
    if (gameInstance && gameInstance.gameMode === "multiplayer") {
        types.push("swap", "control");
    }
    
    return types[Math.floor(Math.random() * types.length)];
}

// Game instance
let gameInstance = null;

// Initialize and start game
function initAndStartGame(playerName) {
    // Hide menus
    document.getElementById("nameMenu").style.display = "none";
    document.getElementById("main-page").style.display = "none";
    
    // Show game container
    document.getElementById("gameContainer").style.display = "block";
    
    // Create and start game
    gameInstance = new Game("solo");
    gameInstance.start(playerName);
}

// Initialize and start multiplayer game
function initAndStartActualGame(mode, players) {
    // Hide menus
    document.getElementById("nameMenu").style.display = "none";
    document.getElementById("main-page").style.display = "none";
    document.getElementById("lobby-screen").style.display = "none";
    document.getElementById("multiplayer-menu").style.display = "none";
    
    // Show game container
    document.getElementById("gameContainer").style.display = "block";
    
    // Create and start game
    gameInstance = new Game(mode);
    
    if (mode === "multiplayer") {
        gameInstance.startMultiplayer(players);
    } else {
        gameInstance.start(tgPlayerName);
    }
}
