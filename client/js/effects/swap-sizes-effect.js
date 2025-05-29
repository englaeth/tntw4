// Swap Sizes Effect
function activateSwapSizesEffect(game) {
    console.log("Activating swap sizes effect");
    
    // Get a random opponent
    const opponent = getRandomOpponent();
    if (!opponent) {
        console.log("No opponents available for size swap");
        return;
    }
    
    // Store original sizes
    const playerOriginalSize = game.player.size;
    const opponentOriginalSize = opponent.size;
    
    // Swap sizes
    game.player.size = opponentOriginalSize;
    
    // In multiplayer mode, notify other players
    if (game.gameMode === "multiplayer" && socket && currentRoomId) {
        activatePowerup({
            type: "swap",
            targetId: opponent.id,
            originalSize: playerOriginalSize
        });
    }
    
    // Visual indicator
    showSystemPopup(
        `${translations.swappedSizesWith[currentLang] || "Swapped sizes with"} ${opponent.name}!`,
        false,
        2000
    );
    
    // Add visual effect
    const swapEffect = {
        startTime: performance.now(),
        duration: 1000,
        player1: game.player,
        player2: opponent,
        active: true
    };
    
    // Add swap effect to game
    if (!game.activeEffects) game.activeEffects = [];
    game.activeEffects.push(swapEffect);
    
    // Draw swap effect
    const originalDraw = game.gameLoop;
    game.gameLoop = function(timestamp) {
        // Call original game loop
        originalDraw.call(game, timestamp);
        
        // Draw swap effect if active
        if (swapEffect.active) {
            const ctx = game.ctx;
            const currentTime = performance.now();
            const elapsedTime = currentTime - swapEffect.startTime;
            const progress = Math.min(elapsedTime / swapEffect.duration, 1);
            
            if (progress < 1) {
                // Draw connecting line between players
                ctx.beginPath();
                ctx.moveTo(swapEffect.player1.x, swapEffect.player1.y);
                ctx.lineTo(swapEffect.player2.x, swapEffect.player2.y);
                ctx.strokeStyle = `rgba(255, 255, 0, ${1 - progress})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw pulsating circles around players
                const pulseScale = 0.2 * Math.sin(elapsedTime / 100) + 1;
                
                ctx.beginPath();
                ctx.arc(swapEffect.player1.x, swapEffect.player1.y, swapEffect.player1.size * 1.5 * pulseScale, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 0, ${0.3 * (1 - progress)})`;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(swapEffect.player2.x, swapEffect.player2.y, swapEffect.player2.size * 1.5 * pulseScale, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 0, ${0.3 * (1 - progress)})`;
                ctx.fill();
            } else {
                swapEffect.active = false;
                
                // Remove from active effects
                const index = game.activeEffects.indexOf(swapEffect);
                if (index !== -1) {
                    game.activeEffects.splice(index, 1);
                }
                
                // Restore original game loop
                game.gameLoop = originalDraw;
            }
        }
    };
}

// Handle being the target of a size swap
function handleSwapSizesEffect(sourcePlayerId) {
    if (!gameInstance || !remotePlayers[sourcePlayerId]) return;
    
    // Get source player
    const sourcePlayer = remotePlayers[sourcePlayerId];
    
    // Store original size
    const playerOriginalSize = gameInstance.player.size;
    
    // Swap sizes
    gameInstance.player.size = sourcePlayer.originalSize || playerOriginalSize;
    
    // Visual indicator
    showSystemPopup(
        `${translations.sizeSwappedBy[currentLang] || "Size swapped by"} ${sourcePlayer.name}!`,
        false,
        2000
    );
}
