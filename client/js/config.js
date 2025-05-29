// Game Configuration
const GAME_SETTINGS = {
    INITIAL_WORM_SIZE: 10,
    WIN_SIZE: 5,
    MAX_POISONS: 20,
    POISON_SPAWN_INTERVAL: 2000,
    POISON_SIZE: 8,
    WORM_SPEED: 2,
    WORM_TURN_SPEED: 0.1,
    SEGMENT_DISTANCE: 15,
    BOUNDARY_PADDING: 50,
    POWERUP_CHANCE: 0.1,
    POWERUP_DURATION: 10000
};

// Telegram Player Info (will be set from Telegram Web App if available)
let tgPlayerId = "guest_" + Math.floor(Math.random() * 1000000);
let tgPlayerName = "Guest";
let tgPlayerAvatarUrl = "";

// Initialize Telegram Web App if available
document.addEventListener("DOMContentLoaded", function() {
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
    
    // Initialize Socket.IO connection
    initializeSocketIO();
    
    // Initialize game components
    initializeUI();
    setupParticlesBackground();
    checkOrientation();
    
    // Listen for orientation changes
    window.addEventListener("resize", checkOrientation);
});

// Check device orientation for mobile devices
function checkOrientation() {
    const landscapePrompt = document.getElementById("landscapePrompt");
    if (window.innerWidth < window.innerHeight && window.innerWidth < 768) {
        landscapePrompt.style.display = "flex";
    } else {
        landscapePrompt.style.display = "none";
    }
}

// Setup particles background
function setupParticlesBackground() {
    tsParticles.load("tsparticles", {
        particles: {
            number: {
                value: 100,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: "#ffffff"
            },
            shape: {
                type: "circle"
            },
            opacity: {
                value: 0.5,
                random: true
            },
            size: {
                value: 3,
                random: true
            },
            move: {
                enable: true,
                speed: 0.5,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: {
                    enable: true,
                    mode: "bubble"
                },
                onclick: {
                    enable: true,
                    mode: "push"
                },
                resize: true
            },
            modes: {
                bubble: {
                    distance: 100,
                    size: 5,
                    duration: 2,
                    opacity: 0.8,
                    speed: 3
                },
                push: {
                    particles_nb: 4
                }
            }
        },
        retina_detect: true
    });
}
