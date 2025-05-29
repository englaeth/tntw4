// Joystick controls for mobile devices
let joystickContainer;
let joystickCanvas;
let joystickCtx;
let joystickActive = false;
let joystickPos = { x: 0, y: 0 };
let joystickTouch = { x: 0, y: 0 };
let joystickRadius = 60;
let joystickHandleRadius = 30;
let currentGame = null;

function initJoystick(game) {
    currentGame = game;
    joystickContainer = document.getElementById("joystickContainer");
    joystickCanvas = document.getElementById("joystickCanvas");
    joystickCtx = joystickCanvas.getContext("2d");
    
    // Set canvas size
    joystickCanvas.width = joystickRadius * 2 + 20;
    joystickCanvas.height = joystickRadius * 2 + 20;
    
    // Center position
    joystickPos = {
        x: joystickCanvas.width / 2,
        y: joystickCanvas.height / 2
    };
    
    // Initial touch position (center)
    joystickTouch = { ...joystickPos };
    
    // Setup touch events
    setupJoystickEvents();
    
    // Draw initial joystick
    drawJoystick();
}

function setupJoystickEvents() {
    // Touch start event
    document.addEventListener("touchstart", function(e) {
        if (joystickActive) return;
        
        // Position joystick at touch location
        const touch = e.touches[0];
        joystickContainer.style.left = (touch.clientX - joystickCanvas.width / 2) + "px";
        joystickContainer.style.top = (touch.clientY - joystickCanvas.height / 2) + "px";
        
        // Show joystick
        joystickContainer.style.display = "block";
        setTimeout(() => {
            joystickContainer.style.opacity = "1";
        }, 10);
        
        joystickActive = true;
        joystickTouch = { ...joystickPos };
        drawJoystick();
    });
    
    // Touch move event
    joystickCanvas.addEventListener("touchmove", function(e) {
        if (!joystickActive) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joystickCanvas.getBoundingClientRect();
        
        // Calculate touch position relative to joystick center
        joystickTouch.x = touch.clientX - rect.left;
        joystickTouch.y = touch.clientY - rect.top;
        
        // Limit distance from center
        const dx = joystickTouch.x - joystickPos.x;
        const dy = joystickTouch.y - joystickPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > joystickRadius) {
            joystickTouch.x = joystickPos.x + (dx / distance) * joystickRadius;
            joystickTouch.y = joystickPos.y + (dy / distance) * joystickRadius;
        }
        
        // Calculate angle for player control
        const angle = Math.atan2(dy, dx);
        
        // Update player controls
        if (currentGame && currentGame.player) {
            // Reset both controls first
            currentGame.player.turnLeft = false;
            currentGame.player.turnRight = false;
            
            // Set turn direction based on angle
            if (distance > joystickHandleRadius * 0.5) {
                // Convert angle to player's perspective
                const playerAngle = currentGame.player.angle;
                const relativeAngle = normalizeAngle(angle - playerAngle);
                
                if (relativeAngle > 0.1 && relativeAngle < Math.PI) {
                    currentGame.player.turnRight = true;
                } else if (relativeAngle < -0.1 || relativeAngle > Math.PI) {
                    currentGame.player.turnLeft = true;
                }
            }
        }
        
        drawJoystick();
    });
    
    // Touch end event
    joystickCanvas.addEventListener("touchend", function() {
        resetJoystick();
    });
    
    joystickCanvas.addEventListener("touchcancel", function() {
        resetJoystick();
    });
}

function resetJoystick() {
    joystickActive = false;
    joystickTouch = { ...joystickPos };
    
    // Hide joystick
    joystickContainer.style.opacity = "0";
    setTimeout(() => {
        joystickContainer.style.display = "none";
    }, 300);
    
    // Reset player controls
    if (currentGame && currentGame.player) {
        currentGame.player.turnLeft = false;
        currentGame.player.turnRight = false;
    }
    
    drawJoystick();
}

function drawJoystick() {
    // Clear canvas
    joystickCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);
    
    // Draw outer circle
    joystickCtx.beginPath();
    joystickCtx.arc(joystickPos.x, joystickPos.y, joystickRadius, 0, Math.PI * 2);
    joystickCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
    joystickCtx.fill();
    joystickCtx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    joystickCtx.lineWidth = 2;
    joystickCtx.stroke();
    
    // Draw handle
    joystickCtx.beginPath();
    joystickCtx.arc(joystickTouch.x, joystickTouch.y, joystickHandleRadius, 0, Math.PI * 2);
    joystickCtx.fillStyle = "rgba(0, 245, 212, 0.8)";
    joystickCtx.fill();
    joystickCtx.strokeStyle = "white";
    joystickCtx.lineWidth = 2;
    joystickCtx.stroke();
    
    // Draw direction indicator
    if (joystickActive) {
        const dx = joystickTouch.x - joystickPos.x;
        const dy = joystickTouch.y - joystickPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > joystickHandleRadius * 0.5) {
            const arrowLength = joystickHandleRadius * 0.7;
            const arrowWidth = joystickHandleRadius * 0.3;
            
            // Calculate arrow direction
            const angle = Math.atan2(dy, dx);
            const arrowX = joystickTouch.x + Math.cos(angle) * arrowLength;
            const arrowY = joystickTouch.y + Math.sin(angle) * arrowLength;
            
            // Draw arrow
            joystickCtx.beginPath();
            joystickCtx.moveTo(joystickTouch.x, joystickTouch.y);
            joystickCtx.lineTo(arrowX, arrowY);
            joystickCtx.strokeStyle = "white";
            joystickCtx.lineWidth = 3;
            joystickCtx.stroke();
            
            // Draw arrow head
            joystickCtx.beginPath();
            joystickCtx.moveTo(arrowX, arrowY);
            joystickCtx.lineTo(
                arrowX - Math.cos(angle - Math.PI / 6) * arrowWidth,
                arrowY - Math.sin(angle - Math.PI / 6) * arrowWidth
            );
            joystickCtx.lineTo(
                arrowX - Math.cos(angle + Math.PI / 6) * arrowWidth,
                arrowY - Math.sin(angle + Math.PI / 6) * arrowWidth
            );
            joystickCtx.closePath();
            joystickCtx.fillStyle = "white";
            joystickCtx.fill();
        }
    }
}

// Helper function to normalize angle to range [-PI, PI]
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}
