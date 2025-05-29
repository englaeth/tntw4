// Magnet Effect
function activateMagnetEffect(game) {
    console.log("Activating magnet effect");
    
    // Create a temporary magnet field around the player
    const magnetRadius = 150;
    const magnetDuration = GAME_SETTINGS.POWERUP_DURATION;
    const player = game.player;
    
    // Visual indicator
    const magnetField = {
        x: player.x,
        y: player.y,
        radius: magnetRadius,
        duration: magnetDuration,
        startTime: performance.now(),
        active: true
    };
    
    // Add magnet field to game
    if (!game.activeEffects) game.activeEffects = [];
    game.activeEffects.push(magnetField);
    
    // Update magnet field position and attract poisons
    const magnetInterval = setInterval(() => {
        if (!game.gameOver && player && magnetField.active) {
            // Update magnet field position to follow player
            magnetField.x = player.x;
            magnetField.y = player.y;
            
            // Attract poisons within radius
            game.poisons.forEach(poison => {
                const dx = magnetField.x - poison.x;
                const dy = magnetField.y - poison.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < magnetRadius) {
                    // Calculate attraction force (stronger when closer)
                    const force = 0.05 * (1 - distance / magnetRadius);
                    
                    // Move poison towards player
                    poison.x += dx * force;
                    poison.y += dy * force;
                }
            });
            
            // Check if effect has expired
            const currentTime = performance.now();
            if (currentTime - magnetField.startTime >= magnetField.duration) {
                magnetField.active = false;
                clearInterval(magnetInterval);
                
                // Remove from active effects
                const index = game.activeEffects.indexOf(magnetField);
                if (index !== -1) {
                    game.activeEffects.splice(index, 1);
                }
            }
        } else {
            clearInterval(magnetInterval);
        }
    }, 16); // ~60fps
    
    // Draw magnet field
    const originalDraw = game.gameLoop;
    game.gameLoop = function(timestamp) {
        // Call original game loop
        originalDraw.call(game, timestamp);
        
        // Draw magnet field if active
        if (magnetField.active) {
            const ctx = game.ctx;
            const currentTime = performance.now();
            const elapsedTime = currentTime - magnetField.startTime;
            const remainingTime = magnetField.duration - elapsedTime;
            
            if (remainingTime > 0) {
                // Draw pulsating field
                const pulseScale = 0.2 * Math.sin(elapsedTime / 200) + 1;
                const alpha = 0.2 + 0.1 * Math.sin(elapsedTime / 300);
                
                ctx.beginPath();
                ctx.arc(magnetField.x, magnetField.y, magnetField.radius * pulseScale, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 150, 255, ${alpha})`;
                ctx.fill();
                
                // Draw magnetic lines
                const numLines = 8;
                for (let i = 0; i < numLines; i++) {
                    const angle = (i / numLines) * Math.PI * 2 + elapsedTime / 500;
                    const innerRadius = 20;
                    const outerRadius = magnetField.radius * pulseScale;
                    
                    ctx.beginPath();
                    ctx.moveTo(
                        magnetField.x + Math.cos(angle) * innerRadius,
                        magnetField.y + Math.sin(angle) * innerRadius
                    );
                    ctx.lineTo(
                        magnetField.x + Math.cos(angle) * outerRadius,
                        magnetField.y + Math.sin(angle) * outerRadius
                    );
                    ctx.strokeStyle = `rgba(0, 200, 255, ${0.5 + 0.5 * Math.sin(elapsedTime / 200 + i)})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }
    };
    
    // Restore original game loop after effect ends
    setTimeout(() => {
        game.gameLoop = originalDraw;
    }, magnetDuration);
}
