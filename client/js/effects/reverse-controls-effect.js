// Reverse Controls Effect
function activateReverseControlsEffect(game) {
    console.log("Activating reverse controls effect");
    
    // Get player
    const player = game.player;
    if (!player) return;
    
    // Set reverse controls flag
    player.reverseControls = true;
    
    // Visual indicator
    showSystemPopup(translations.reverseControls[currentLang] || "Controls Reversed!", false, 2000);
    
    // Add visual effect to player
    const originalColor = player.color;
    player.color = "#ff00ff"; // Purple to indicate reversed controls
    
    // Reset after duration
    setTimeout(() => {
        if (player) {
            player.reverseControls = false;
            player.color = originalColor;
        }
    }, GAME_SETTINGS.POWERUP_DURATION);
}
