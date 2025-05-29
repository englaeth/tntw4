// Joystick Logic (v3 - Instant Appear/Disappear)
const joystickContainer = document.getElementById("joystickContainer");
const joystickCanvasEl = document.getElementById("joystickCanvas");
let joystickActive = false;
let joystickTouchIdentifier = null; // For touch events
let isMouseDown = false; // For mouse events

// Joystick visual parameters
let baseRadius = 70;
let knobRadius = 30;

// Joystick state
let baseCenterX, baseCenterY; // Center of the joystick base where it appears
let knobX, knobY; // Current position of the knob relative to the canvas
let currentJoystickAngle = null;
let currentJoystickIntensity = 0;

// Canvas setup
function setupJoystickCanvas() {
    if (!joystickCanvasEl) return;
    const dpr = window.devicePixelRatio || 1;
    const canvasSize = baseRadius * 2;
    joystickCanvasEl.width = canvasSize * dpr;
    joystickCanvasEl.height = canvasSize * dpr;
    joystickCanvasEl.style.width = `${canvasSize}px`;
    joystickCanvasEl.style.height = `${canvasSize}px`;
    const ctx = joystickCanvasEl.getContext("2d");
    ctx.scale(dpr, dpr);
    // Initial knob position is the center of the canvas
    knobX = baseRadius;
    knobY = baseRadius;
    drawJoystick(); // Draw initial state (hidden)
}

// Drawing function
function drawJoystick() {
    if (!joystickCanvasEl) return;
    const ctx = joystickCanvasEl.getContext("2d");
    ctx.clearRect(0, 0, joystickCanvasEl.width, joystickCanvasEl.height);

    // Draw outer circle (base)
    ctx.beginPath();
    ctx.arc(baseRadius, baseRadius, baseRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(128, 128, 128, 0.3)";
    ctx.fill();

    // Draw inner circle (knob)
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(80, 80, 80, 0.6)";
    ctx.fill();
}

// Show joystick at specific screen coordinates (relative to viewport)
function showJoystickAt(screenX, screenY) {
    const rect = gameCanvas.getBoundingClientRect();
    // Calculate position relative to the game canvas top-left
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    // Set the base center coordinates
    baseCenterX = canvasX;
    baseCenterY = canvasY;

    // Position the container so the base center aligns with the touch/click point
    joystickContainer.style.left = (baseCenterX - baseRadius) + "px";
    joystickContainer.style.top = (baseCenterY - baseRadius) + "px";

    // Reset knob to center initially for the new position
    knobX = baseRadius;
    knobY = baseRadius;

    joystickContainer.style.opacity = "1"; // Make visible instantly
    joystickContainer.style.display = "block";
    joystickActive = true;
    drawJoystick();
}

// Hide joystick instantly
function hideJoystick() {
    if (!joystickActive) return;
    joystickContainer.style.display = "none";
    joystickContainer.style.opacity = "0";
    joystickActive = false;
    isMouseDown = false;
    joystickTouchIdentifier = null;
    currentJoystickAngle = null;
    currentJoystickIntensity = 0;
    // Reset knob position for next time
    knobX = baseRadius;
    knobY = baseRadius;
    // Update game state if needed (e.g., stop movement)
    if (gameInstance && gameInstance.currentPlayer) {
        // Optional: Reset targetAngle or set intensity to 0 if game uses it
        // gameInstance.currentPlayer.targetAngle = null; // Or keep last angle?
    }
}

// Update knob position based on current pointer/touch coordinates (screen coordinates)
function updateKnobPosition(currentScreenX, currentScreenY) {
    if (!joystickActive) return;

    const rect = gameCanvas.getBoundingClientRect();
    // Calculate current position relative to the game canvas top-left
    const currentCanvasX = currentScreenX - rect.left;
    const currentCanvasY = currentScreenY - rect.top;

    // Calculate vector from the base center to the current position
    const deltaX = currentCanvasX - baseCenterX;
    const deltaY = currentCanvasY - baseCenterY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    currentJoystickAngle = Math.atan2(deltaY, deltaX);

    // Max distance the knob can move from the base center
    const maxKnobDistance = baseRadius - knobRadius;

    if (distance > maxKnobDistance) {
        // Clamp knob to the edge of the base
        knobX = baseRadius + Math.cos(currentJoystickAngle) * maxKnobDistance;
        knobY = baseRadius + Math.sin(currentJoystickAngle) * maxKnobDistance;
        currentJoystickIntensity = 1;
    } else {
        // Knob is within the base radius
        // Position relative to the joystick canvas top-left (0,0)
        knobX = baseRadius + deltaX;
        knobY = baseRadius + deltaY;
        currentJoystickIntensity = distance / maxKnobDistance;
    }

    drawJoystick();

    // Update player target angle in the game instance
    if (gameInstance && gameInstance.currentPlayer) {
        gameInstance.currentPlayer.targetAngle = currentJoystickAngle;
        // You might want to use currentJoystickIntensity for speed control later
    }
}

// --- Touch Event Handlers ---
function handleJoystickTouchStart(event) {
    if (!gameInstance || gameInstance.gameState !== "playing") return;
    // Only handle the first touch to activate the joystick
    if (joystickActive) return;

    const touch = event.changedTouches[0];
    joystickTouchIdentifier = touch.identifier;

    showJoystickAt(touch.clientX, touch.clientY);
    // Update knob position based on the initial touch
    updateKnobPosition(touch.clientX, touch.clientY);
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
    if (joystickActive) return; // Prevent activating if already active (e.g., from touch)

    isMouseDown = true;
    showJoystickAt(event.clientX, event.clientY);
    updateKnobPosition(event.clientX, event.clientY);
    event.preventDefault();
}

function handleJoystickMouseMove(event) {
    // Only move if joystick is active via mouse
    if (!joystickActive || !isMouseDown) return;

    updateKnobPosition(event.clientX, event.clientY);
    event.preventDefault();
}

function handleJoystickMouseUp(event) {
    // Only hide if joystick was activated by mouse
    if (!joystickActive || !isMouseDown) return;
    // Only handle left mouse button release
    if (event.button !== 0) return;

    hideJoystick();
    event.preventDefault();
}

// Initialize joystick
function initJoystick() {
    setupJoystickCanvas();

    // Ensure the container is hidden initially
    joystickContainer.style.display = "none";
    joystickContainer.style.opacity = "0";
    joystickContainer.style.position = "absolute"; // Ensure positioning works
    joystickContainer.style.pointerEvents = "none"; // Prevent joystick from blocking underlying canvas events

    // Touch Events on the game canvas
    gameCanvas.addEventListener("touchstart", handleJoystickTouchStart, { passive: false });
    // Move and End events on the window to capture movement/release outside the canvas
    window.addEventListener("touchmove", handleJoystickTouchMove, { passive: false });
    window.addEventListener("touchend", handleJoystickTouchEnd, { passive: false });
    window.addEventListener("touchcancel", handleJoystickTouchEnd, { passive: false });

    // Mouse Events on the game canvas
    gameCanvas.addEventListener("mousedown", handleJoystickMouseDown, { passive: false });
    // Move and End events on the window
    window.addEventListener("mousemove", handleJoystickMouseMove, { passive: false });
    window.addEventListener("mouseup", handleJoystickMouseUp, { passive: false });
}

