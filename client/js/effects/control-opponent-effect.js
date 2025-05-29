// Control Opponent Effect
function activateControlOpponentEffect(game) {
    console.log("Activating control opponent effect");
    
    // Get a random opponent
    const opponent = getRandomOpponent();
    if (!opponent) {
        console.log("No opponents available for control");
        return;
    }
    
    // In multiplayer mode, notify other players
    if (game.gameMode === "multiplayer" && socket && currentRoomId) {
        activatePowerup({
            type: "control",
            targetId: opponent.id
        });
    }
    
    // Visual indicator
    showSystemPopup(
        `${translations.controllingPlayer[currentLang] || "Controlling"} ${opponent.name}!`,
        false,
        2000
    );
    
    // Add visual effect
    const controlEffect = {
        startTime: performance.now(),
        duration: GAME_SETTINGS.POWERUP_DURATION,
        player: game.player,
        opponent: opponent,
        active: true
    };
    
    // Add control effect to game
    if (!game.activeEffects) game.activeEffects = [];
    game.activeEffects.push(controlEffect);
    
    // Draw control effect
    const originalDraw = game.gameLoop;
    game.gameLoop = function(timestamp) {
        // Call original game loop
        originalDraw.call(game, timestamp);
        
        // Draw control effect if active
        if (controlEffect.active) {
            const ctx = game.ctx;
            const currentTime = performance.now();
            const elapsedTime = currentTime - controlEffect.startTime;
            const remainingTime = controlEffect.duration - elapsedTime;
            
            if (remainingTime > 0) {
                // Draw mind control waves
                const waveCount = 3;
                const maxRadius = 50;
                
                for (let i = 0; i < waveCount; i++) {
                    const waveProgress = (elapsedTime / 500 + i / waveCount) % 1;
                    const radius = waveProgress * maxRadius;
                    
                    ctx.beginPath();
                    ctx.arc(controlEffect.opponent.x, controlEffect.opponent.y, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 0, 255, ${1 - waveProgress})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                // Draw connecting line between players
                ctx.beginPath();
                ctx.moveTo(controlEffect.player.x, controlEffect.player.y);
                ctx.lineTo(controlEffect.opponent.x, controlEffect.opponent.y);
                ctx.strokeStyle = "rgba(255, 0, 255, 0.5)";
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                controlEffect.active = false;
                
                // Remove from active effects
                const index = game.activeEffects.indexOf(controlEffect);
                if (index !== -1) {
                    game.activeEffects.splice(index, 1);
                }
                
                // Restore original game loop
                game.gameLoop = originalDraw;
            }
        }
    };
}

// Handle being controlled by another player
function handleControlledByOpponent(sourcePlayerId) {
    if (!gameInstance || !remotePlayers[sourcePlayerId]) return;
    
    // Get source player
    const sourcePlayer = remotePlayers[sourcePlayerId];
    
    // Visual indicator
    showSystemPopup(
        `${translations.controlledBy[currentLang] || "Controlled by"} ${sourcePlayer.name}!`,
        false,
        2000
    );
    
    // Reverse controls for duration
    gameInstance.player.reverseControls = true;
    
    // Add visual effect
    const originalColor = gameInstance.player.color;
    gameInstance.player.color = "#ff00ff"; // Purple to indicate being controlled
    
    // Reset after duration
    setTimeout(() => {
        if (gameInstance && gameInstance.player) {
            gameInstance.player.reverseControls = false;
            gameInstance.player.color = originalColor;
        }
    }, GAME_SETTINGS.POWERUP_DURATION);
}
