// Main.js - Entry point for client-side application
document.addEventListener("DOMContentLoaded", function() {
    console.log("Initializing game application...");
    
    // Initialize game components
    initializeUI();
    setupParticlesBackground();
    checkOrientation();
    
    // Initialize Socket.IO connection
    initializeSocketIO();
    
    // Listen for orientation changes
    window.addEventListener("resize", checkOrientation);
    
    // Set default player name if using Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
        const tgWebApp = window.Telegram.WebApp;
        tgWebApp.ready();
        
        if (tgWebApp.initDataUnsafe && tgWebApp.initDataUnsafe.user) {
            const user = tgWebApp.initDataUnsafe.user;
            tgPlayerId = user.id.toString();
            tgPlayerName = user.first_name + (user.last_name ? " " + user.last_name : "");
            // Avatar URL is not directly available from WebApp
        }
        
        // Set theme based on Telegram
        if (tgWebApp.colorScheme === "dark") {
            document.body.classList.add("dark-theme");
        }
    }
    
    // Apply translations
    applyTranslations();
    
    console.log("Game application initialized successfully");
});
