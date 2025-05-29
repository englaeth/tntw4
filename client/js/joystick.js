// Joystick Logic (v4 - Interactive & Attractive)
const joystickContainer = document.getElementById("joystickContainer");
const joystickCanvasEl = document.getElementById("joystickCanvas");
let joystickCtx = null;
let joystickActive = false;
let joystickTouchIdentifier = null; // For touch events
let isMouseDown = false; // For mouse events

// Joystick visual parameters
let baseRadius = 70;
let baseColor = "rgba(100, 100, 100, 0.3)";
let baseGlowColor = "rgba(0, 245, 212, 0.3)"; // Primary color glow
let knobRadius = 30;
let knobColor = "rgba(0, 245, 212, 0.7)"; // Primary color
let knobPulseMinRadius = 28;
let knobPulseMaxRadius = 32;
let currentKnobPulseRadius = knobRadius;
let pulseSpeed = 0.1;
let pulseDirection = 1;

// Joystick state
let baseCenterX, baseCenterY; // Center of the joystick base where it appears
let knobX, knobY; // Current position of the knob relative to the canvas
let currentJoystickAngle = null;
let currentJoystickIntensity = 0;

let animationFrameId = null;

// Canvas setup
function setupJoystickCanvas() {
    if (!joystickCanvasEl) return;
    joystickCtx = joystickCanvasEl.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const canvasSize = baseRadius * 2 + 20; // Add padding for glow
    joystickCanvasEl.width = canvasSize * dpr;
    joystickCanvasEl.height = canvasSize * dpr;
    joystickCanvasEl.style.width = `${canvasSize}px`;
    joystickCanvasEl.style.height = `${canvasSize}px`;
    joystickCtx.scale(dpr, dpr);
    // Initial knob position is the center of the canvas (relative to padding)
    knobX = baseRadius + 10;
    knobY = baseRadius + 10;
    // Initial pulse radius
    currentKnobPulseRadius = knobRadius;
}

// Drawing function with animation loop
function drawJoystickLoop() {
    if (!joystickActive || !joystickCtx) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        return;
    }

    // Clear canvas
    joystickCtx.clearRect(0, 0, joystickCanvasEl.width, joystickCanvasEl.height);

    const drawX = baseRadius + 10; // Center X considering padding
    const drawY = baseRadius + 10; // Center Y considering padding

    // Update pulsing knob radius
    currentKnobPulseRadius += pulseSpeed * pulseDirection;
    if (currentKnobPulseRadius > knobPulseMaxRadius || currentKnobPulseRadius < knobPulseMinRadius) {
        pulseDirection *= -1;
        currentKnobPulseRadius += pulseSpeed * pulseDirection; // Correct overshoot
    }

    // Draw outer circle (base) with glow
    joystickCtx.shadowColor = baseGlowColor;
    joystickCtx.shadowBlur = 15;
    joystickCtx.beginPath();
    joystickCtx.arc(drawX, drawY, baseRadius, 0, 2 * Math.PI);
    joystickCtx.fillStyle = baseColor;
    joystickCtx.fill();
    joystickCtx.shadowBlur = 0; // Reset shadow for knob

    // Draw inner circle (knob) - use pulsing radius
    joystickCtx.beginPath();
    joystickCtx.arc(knobX, knobY, currentKnobPulseRadius, 0, 2 * Math.PI);
    joystickCtx.fillStyle = knobColor;
    joystickCtx.fill();

    // Request next frame
    animationFrameId = requestAnimationFrame(drawJoystickLoop);
}

// Show joystick at specific screen coordinates (relative to viewport)
function showJoystickAt(screenX, screenY) {
    const rect = gameCanvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    baseCenterX = canvasX;
    baseCenterY = canvasY;

    const containerSize = baseRadius * 2 + 20;
    joystickContainer.style.left = (baseCenterX - containerSize / 2) + "px";
    joystickContainer.style.top = (baseCenterY - containerSize / 2) + "px";

    // Reset knob to center initially
    knobX = baseRadius + 10;
    knobY = baseRadius + 10;
    currentKnobPulseRadius = knobRadius; // Reset pulse
    pulseDirection = 1;

    joystickContainer.style.display = "block";
    joystickContainer.style.opacity = "1"; // Make visible instantly
    // Add a subtle scale effect for appearance (optional, keep fast)
    joystickContainer.style.transform = "scale(0.8)";
    requestAnimationFrame(() => {
        joystickContainer.style.transition = "transform 0.1s ease-out, opacity 0.1s ease-out";
        joystickContainer.style.transform = "scale(1)";
    });

    joystickActive = true;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(drawJoystickLoop); // Start animation loop
}

// Hide joystick instantly
function hideJoystick() {
    if (!joystickActive) return;

    joystickActive = false;
    isMouseDown = false;
    joystickTouchIdentifier = null;
    currentJoystickAngle = null;
    currentJoystickIntensity = 0;

    // Stop animation loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Quick scale down and hide
    joystickContainer.style.transition = "transform 0.1s ease-in, opacity 0.1s ease-in";
    joystickContainer.style.transform = "scale(0.8)";
    joystickContainer.style.opacity = "0";

    // Use setTimeout to set display:none after transition
    setTimeout(() => {
        // Check if it's still hidden (user might have clicked again quickly)
        if (!joystickActive) {
            joystickContainer.style.display = "none";
            joystickContainer.style.transform = "scale(1)"; // Reset scale for next time
        }
    }, 100); // Match transition duration

    // Reset knob position for next time
    knobX = baseRadius + 10;
    knobY = baseRadius + 10;

    // Update game state if needed
    if (gameInstance && gameInstance.currentPlayer) {
        gameInstance.currentPlayer.targetAngle = null; // Stop turning
    }
}

// Update knob position based on current pointer/touch coordinates (screen coordinates)
function updateKnobPosition(currentScreenX, currentScreenY) {
    if (!joystickActive) return;

    const rect = gameCanvas.getBoundingClientRect();
    const currentCanvasX = currentScreenX - rect.left;
    const currentCanvasY = currentScreenY - rect.top;

    const deltaX = currentCanvasX - baseCenterX;
    const deltaY = currentCanvasY - baseCenterY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    currentJoystickAngle = Math.atan2(deltaY, deltaX);

    const maxKnobDistance = baseRadius; // Knob center can reach the base edge

    if (distance > maxKnobDistance) {
        knobX = (baseRadius + 10) + Math.cos(currentJoystickAngle) * maxKnobDistance;
        knobY = (baseRadius + 10) + Math.sin(currentJoystickAngle) * maxKnobDistance;
        currentJoystickIntensity = 1;
    } else {
        knobX = (baseRadius + 10) + deltaX;
        knobY = (baseRadius + 10) + deltaY;
        currentJoystickIntensity = distance / maxKnobDistance;
    }

    // Update player target angle in the game instance
    if (gameInstance && gameInstance.currentPlayer) {
        gameInstance.currentPlayer.targetAngle = currentJoystickAngle;
    }
}

// --- Touch Event Handlers ---
function handleJoystickTouchStart(event) {
    if (!gameInstance || gameInstance.gameState !== "playing") return;
    if (joystickActive) return;

    const touch = event.changedTouches[0];
    joystickTouchIdentifier = touch.identifier;

    showJoystickAt(touch.clientX, touch.clientY);
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
    if (event.button !== 0) return;
    if (joystickActive) return;

    isMouseDown = true;
    showJoystickAt(event.clientX, event.clientY);
    updateKnobPosition(event.clientX, event.clientY);
    event.preventDefault();
}

function handleJoystickMouseMove(event) {
    if (!joystickActive || !isMouseDown) return;
    updateKnobPosition(event.clientX, event.clientY);
    event.preventDefault();
}

function handleJoystickMouseUp(event) {
    if (!joystickActive || !isMouseDown) return;
    if (event.button !== 0) return;
    hideJoystick();
    event.preventDefault();
}

// Initialize joystick
function initJoystick() {
    setupJoystickCanvas();

    joystickContainer.style.display = "none";
    joystickContainer.style.opacity = "0";
    joystickContainer.style.position = "absolute";
    joystickContainer.style.pointerEvents = "none";
    joystickContainer.style.transformOrigin = "center center"; // For scaling effect

    // Add listeners to gameCanvas or a suitable parent element
    const interactionLayer = gameCanvas; // Or document.body if needed

    interactionLayer.addEventListener("touchstart", handleJoystickTouchStart, { passive: false });
    window.addEventListener("touchmove", handleJoystickTouchMove, { passive: false });
    window.addEventListener("touchend", handleJoystickTouchEnd, { passive: false });
    window.addEventListener("touchcancel", handleJoystickTouchEnd, { passive: false });

    interactionLayer.addEventListener("mousedown", handleJoystickMouseDown, { passive: false });
    window.addEventListener("mousemove", handleJoystickMouseMove, { passive: false });
    window.addEventListener("mouseup", handleJoystickMouseUp, { passive: false });

    console.log("Interactive Joystick Initialized");
}

