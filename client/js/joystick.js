// Joystick Logic
const joystickContainer = document.getElementById("joystickContainer");
const joystickCanvasEl = document.getElementById("joystickCanvas");
let joystickActive = false;
let joystickFadeOutTimer = null;
let joystickTouchIdentifier = null;
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
    ctx.beginPath();
    ctx.arc(joystickCenterX, joystickCenterY, joystickRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(128, 128, 128, 0.3)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(80, 80, 80, 0.6)";
    ctx.fill();
}

function handleJoystickTouchStart(event) {
    if (!gameInstance || gameInstance.gameState !== "playing") return;
    if (joystickActive && event.touches.length > 1) return;
    const touch = event.changedTouches[0];
    joystickTouchIdentifier = touch.identifier;
    clearTimeout(joystickFadeOutTimer);
    
    const rect = gameCanvas.getBoundingClientRect();
    let touchX = touch.clientX - rect.left;
    let touchY = touch.clientY - rect.top;

    joystickContainer.style.left = (touchX - joystickRadius) + "px";
    joystickContainer.style.top = (touchY - joystickRadius) + "px";
    joystickContainer.style.display = "block";
    joystickContainer.offsetHeight; 
    joystickContainer.style.opacity = "1";
    joystickActive = true;
    updateKnobPosition(touchX, touchY, true);
    event.preventDefault();
}

function handleJoystickTouchMove(event) {
    if (!joystickActive) return;
    let movedTouch = null;
    for (let i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier === joystickTouchIdentifier) {
            movedTouch = event.changedTouches[i];
            break;
        }
    }
    if (movedTouch) {
        const rect = gameCanvas.getBoundingClientRect();
        let touchX = movedTouch.clientX - rect.left;
        let touchY = movedTouch.clientY - rect.top;
        updateKnobPosition(touchX, touchY, false);
        event.preventDefault();
    }
}

function updateKnobPosition(touchX, touchY, isInitialTouch) {
    const containerRect = joystickContainer.getBoundingClientRect();
    const relativeX = touchX - containerRect.left - joystickCenterX;
    const relativeY = touchY - containerRect.top - joystickCenterY;
    const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
    currentJoystickAngle = Math.atan2(relativeY, relativeX);

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
    if (gameInstance && gameInstance.currentPlayer && gameInstance.gameMode === "multiplayer") {
        // Send update to firebase
        const playerRef = db.ref(`rooms/${currentRoomId}/players/${tgPlayerId}`);
        playerRef.update({ targetAngle: currentJoystickAngle });
    }
}

function handleJoystickTouchEnd(event) {
    let endedTouch = null;
    for (let i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier === joystickTouchIdentifier) {
            endedTouch = event.changedTouches[i];
            break;
        }
    }
    if (endedTouch) {
        joystickActive = false;
        currentJoystickAngle = null;
        currentJoystickIntensity = 0;
        joystickFadeOutTimer = setTimeout(() => {
            joystickContainer.style.opacity = "0";
            setTimeout(() => {
                joystickContainer.style.display = "none";
                knobX = joystickCenterX;
                knobY = joystickCenterY;
                drawJoystick();
            }, 300);
        }, 100);
        event.preventDefault();
    }
}

// Initialize joystick
function initJoystick() {
    setupJoystickCanvas();
    gameCanvas.addEventListener("touchstart", handleJoystickTouchStart, { passive: false });
    gameCanvas.addEventListener("touchmove", handleJoystickTouchMove, { passive: false });
    gameCanvas.addEventListener("touchend", handleJoystickTouchEnd, { passive: false });
    gameCanvas.addEventListener("touchcancel", handleJoystickTouchEnd, { passive: false });
}
