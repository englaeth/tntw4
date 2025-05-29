// Effects Integration
function initializeEffects() {
    console.log("Initializing effects system");
    // This function would be called during game initialization
}

// Helper function to get a random player that isn't the current player
function getRandomOpponent() {
    if (!gameInstance || gameInstance.gameMode !== "multiplayer") return null;
    
    const opponents = Object.keys(remotePlayers);
    if (opponents.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * opponents.length);
    return remotePlayers[opponents[randomIndex]];
}
