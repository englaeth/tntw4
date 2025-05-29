// Joystick Logic
const joystickContainer = document.getElementById("joystickContainer");
const joystickCanvasEl = document.getElementById("joystickCanvas");
let joystickActive = false;
let joystickFadeOutTimer = null;
let joystickTouchIdentifier = null; // For touch events
let isMouseDown = false; // For mouse events
let joystickCenterX, joystickCenterY, joystickRadius, knobRadius;
let knobX, knobY;
let currentJoystickAngle = null;
let currentJoystickIntensity = 0;

function setupJoystickCanvas() {
    if (!joystickCanvasEl) return;
    const dpr = window.devicePixelRatio || 1;
    joystickCanvasEl.width = 140 * dpr;
    joystickCanvasEl.height = 140 * dpr;
    joystickCanvasEl.style.width = "140px";
    joystickCanvasEl.style.height = "140px";
    const ctx = joystickCanvasEl.getContext("2d");
    ctx.scale(dpr, dpr);
    joystickRadius = 70;
    knobRadius = 30;
    joystickCenterX = joystickRadius;
    joystickCenterY = joystickRadius;
    knobX = joystickCenterX;
    knobY = joystickCenterY;
    drawJoystick();
}

function drawJoystick() {
    if (!joystickCanvasEl) return;
    const ctx = joystickCanvasEl.getContext("2d");
    ctx.clearRect(0, 0, joystickCanvasEl.width, joystickCanvasEl.height);
    // Draw outer circle (base)
    ctx.beginPath();
    ctx.arc(joystickCenterX, joystickCenterY, joystickRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(128, 128, 128, 0.3)";
    ctx.fill();
    // Draw inner circle (knob)
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(80, 80, 80, 0.6)";
    ctx.fill();
}

function showJoystickAt(x, y) {
    clearTimeout(joystickFadeOutTimer);
    joystickContainer.style.left = (x - joystickRadius) + "px";
    joystickContainer.style.top = (y - joystickRadius) + "px";
    joystickContainer.style.display = "block";
    joystickContainer.offsetHeight; // Trigger reflow to apply display style before opacity transition
    joystickContainer.style.opacity = "1";
    joystickActive = true;
}

function hideJoystick() {
    joystickActive = false;
    isMouseDown = false;
    joystickTouchIdentifier = null;
    currentJoystickAngle = null;
    currentJoystickIntensity = 0;
    joystickFadeOutTimer = setTimeout(() => {
        joystickContainer.style.opacity = "0";
        setTimeout(() => {
            joystickContainer.style.display = "none";
            // Reset knob position for next appearance
            knobX = joystickCenterX;
            knobY = joystickCenterY;
            drawJoystick();
        }, 300); // Wait for fade out transition
    }, 100); // Delay before starting fade out
}

function updateKnobPosition(currentX, currentY) {
    const containerRect = joystickContainer.getBoundingClientRect();
    // Calculate position relative to the joystick *container's* top-left corner
    const joystickOriginX = containerRect.left;
    const joystickOriginY = containerRect.top;
    // Calculate position relative to the joystick *center*
    const relativeX = currentX - joystickOriginX - joystickCenterX;
    const relativeY = currentY - joystickOriginY - joystickCenterY;
    
    const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
    currentJoystickAngle = Math.atan2(relativeY, relativeX);

    // Clamp knob position within the joystick base radius
    if (distance > joystickRadius - knobRadius) {
        knobX = joystickCenterX + Math.cos(currentJoystickAngle) * (joystickRadius - knobRadius);
        knobY = joystickCenterY + Math.sin(currentJoystickAngle) * (joystickRadius - knobRadius);
        currentJoystickIntensity = 1;
    } else {
        knobX = joystickCenterX + relativeX;
        knobY = joystickCenterY + relativeY;
        currentJoystickIntensity = distance / (joystickRadius - knobRadius);
    }
    drawJoystick();
    
    // Update player target angle in the game instance if it exists
    if (gameInstance && gameInstance.currentPlayer) {
         gameInstance.currentPlayer.targetAngle = currentJoystickAngle;
         // Note: Intensity might be used for speed in the future
    }
}

// --- Touch Event Handlers ---
function handleJoystickTouchStart(event) {
    if (!gameInstance || gameInstance.gameState !== "playing") return;
    // Only handle the first touch for the joystick
    if (joystickActive) return; 
    
    const touch = event.changedTouches[0];
    joystickTouchIdentifier = touch.identifier;
    
    const rect = gameCanvas.getBoundingClientRect();
    let touchX = touch.clientX; // Use clientX/Y for consistency
    let touchY = touch.clientY;

    showJoystickAt(touchX - rect.left, touchY - rect.top);
    updateKnobPosition(touchX, touchY);
    event.preventDefault();
}

function handleJoystickTouchMove(event) {
    if (!joystickActive || joystickTouchIdentifier === null) return;
    
    let movedTouch = null;
    for (let i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier === joystickTouchIdentifier) {
            movedTouch = event.changedTouches[i];
            break;
        }
    }
    
    if (movedTouch) {
        updateKnobPosition(movedTouch.clientX, movedTouch.clientY);
        event.preventDefault();
    }
}

function handleJoystickTouchEnd(event) {
    if (!joystickActive || joystickTouchIdentifier === null) return;

    let endedTouch = null;
    for (let i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier === joystickTouchIdentifier) {
            endedTouch = event.changedTouches[i];
            break;
        }
    }

    if (endedTouch) {
        hideJoystick();
        event.preventDefault();
    }
}

// --- Mouse Event Handlers ---
function handleJoystickMouseDown(event) {
    if (!gameInstance || gameInstance.gameState !== "playing") return;
    // Only handle left mouse button
    if (event.button !== 0) return; 
    if (joystickActive) return; // Prevent activating multiple joysticks

    isMouseDown = true;
    const rect = gameCanvas.getBoundingClientRect();
    let mouseX = event.clientX;
    let mouseY = event.clientY;

    showJoystickAt(mouseX - rect.left, mouseY - rect.top);
    updateKnobPosition(mouseX, mouseY);
    event.preventDefault();
}

function handleJoystickMouseMove(event) {
    if (!joystickActive || !isMouseDown) return;
    
    updateKnobPosition(event.clientX, event.clientY);
    event.preventDefault();
}

function handleJoystickMouseUp(event) {
    if (!joystickActive || !isMouseDown) return;
    // Only handle left mouse button release
    if (event.button !== 0) return; 

    hideJoystick();
    event.preventDefault();
}

// Initialize joystick
function initJoystick() {
    setupJoystickCanvas();
    // Touch Events
    gameCanvas.addEventListener("touchstart", handleJoystickTouchStart, { passive: false });
    gameCanvas.addEventListener("touchmove", handleJoystickTouchMove, { passive: false });
    gameCanvas.addEventListener("touchend", handleJoystickTouchEnd, { passive: false });
    gameCanvas.addEventListener("touchcancel", handleJoystickTouchEnd, { passive: false });
    
    // Mouse Events
    gameCanvas.addEventListener("mousedown", handleJoystickMouseDown, { passive: false });
    // Add mousemove and mouseup listeners to the window to capture events even if the cursor leaves the canvas
    window.addEventListener("mousemove", handleJoystickMouseMove, { passive: false });
    window.addEventListener("mouseup", handleJoystickMouseUp, { passive: false });
}

