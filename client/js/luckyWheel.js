// Lucky Wheel Logic

let wheelCanvas, wheelCtx;
let segments = [];
let currentAngle = 0;
let spinTimeout = null;
let spinAngleStart = 0;
let spinTime = 0;
let spinTimeTotal = 0;
let spinning = false;

const wheelColors = ["#FFD700", "#C0C0C0", "#CD7F32", "#A9A9A9", "#FFA500"]; // Gold, Silver, Bronze, Gray, Orange

function initLuckyWheel() {
    wheelCanvas = document.getElementById("luckyWheelCanvas");
    if (!wheelCanvas) return;
    wheelCtx = wheelCanvas.getContext("2d");

    // Define segments with values and probabilities (total 100)
    segments = [
        { value: 1, probability: 50, color: wheelColors[0] },
        { value: 5, probability: 16, color: wheelColors[1] },
        { value: 10, probability: 16, color: wheelColors[2] },
        { value: 25, probability: 16, color: wheelColors[3] },
        { value: 50, probability: 2, color: wheelColors[4] }
    ];

    // Calculate angles based on probabilities
    let cumulativeProbability = 0;
    segments.forEach(segment => {
        segment.startAngle = (cumulativeProbability / 100) * 2 * Math.PI;
        segment.endAngle = ((cumulativeProbability + segment.probability) / 100) * 2 * Math.PI;
        cumulativeProbability += segment.probability;
    });

    drawWheel();
}

function drawWheel() {
    if (!wheelCtx) return;
    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const radius = Math.min(centerX, centerY) - 5; // Leave some padding

    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    wheelCtx.font = "bold 16px Tajawal, sans-serif";
    wheelCtx.textBaseline = "middle";
    wheelCtx.textAlign = "center";

    segments.forEach((segment, index) => {
        const angle = currentAngle + segment.startAngle;
        const endAngle = currentAngle + segment.endAngle;

        // Draw segment
        wheelCtx.beginPath();
        wheelCtx.fillStyle = segment.color;
        wheelCtx.moveTo(centerX, centerY);
        wheelCtx.arc(centerX, centerY, radius, angle, endAngle);
        wheelCtx.closePath();
        wheelCtx.fill();

        // Draw segment border
        wheelCtx.lineWidth = 2;
        wheelCtx.strokeStyle = "#FFFFFF";
        wheelCtx.stroke();

        // Draw text
        const textAngle = angle + (endAngle - angle) / 2;
        const textRadius = radius * 0.7;
        const textX = centerX + Math.cos(textAngle) * textRadius;
        const textY = centerY + Math.sin(textAngle) * textRadius;

        wheelCtx.save();
        wheelCtx.translate(textX, textY);
        wheelCtx.rotate(textAngle + Math.PI / 2); // Rotate text to be upright
        wheelCtx.fillStyle = "#000000";
        wheelCtx.fillText(segment.value, 0, 0);
        wheelCtx.restore();
    });
}

function spinWheel() {
    if (spinning) return;
    spinning = true;

    document.getElementById("spinWheelButton").disabled = true;
    document.getElementById("wheelResult").classList.add("hidden");

    spinAngleStart = Math.random() * 10 + 10; // Initial speed (radians per frame)
    spinTime = 0;
    spinTimeTotal = Math.random() * 3000 + 4000; // Spin duration (4-7 seconds)

    rotateWheel();
}

function rotateWheel() {
    spinTime += 20; // Approx frame time
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }

    const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    currentAngle += (spinAngle * Math.PI / 180); // Convert degrees to radians if needed, assuming spinAngle is speed
    currentAngle %= (2 * Math.PI);

    drawWheel();
    spinTimeout = requestAnimationFrame(rotateWheel);
}

function stopRotateWheel() {
    cancelAnimationFrame(spinTimeout);
    spinning = false;
    document.getElementById("spinWheelButton").disabled = false;
    document.getElementById("closeWheelButton").classList.remove("hidden");

    // Determine winning segment
    const degrees = currentAngle * 180 / Math.PI;
    const arcd = 360 / segments.length; // Assuming equal visual segments for simplicity, actual win based on probability
    const finalAngle = (360 - degrees % 360 + 90) % 360; // Adjust for pointer position (top)

    // Calculate the winning segment based on probabilities, not visual angle
    const randomPercent = Math.random() * 100;
    let cumulativeProbability = 0;
    let winningSegment = segments[0]; // Default to first

    for (const segment of segments) {
        cumulativeProbability += segment.probability;
        if (randomPercent <= cumulativeProbability) {
            winningSegment = segment;
            break;
        }
    }

    // Display result and update coins
    const resultElement = document.getElementById("wheelResult");
    resultElement.textContent = `${translations.youWonCoins[currentLang] || "You won"} ${winningSegment.value} ${translations.currencyLabel[currentLang] || "coins"}!`;
    resultElement.classList.remove("hidden");

    // Update player coins (assuming a global function or variable exists)
    updateCoins(winningSegment.value);
}

// Easing function (easeOutExpo)
function easeOut(t, b, c, d) {
    return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
}

function showLuckyWheel() {
    const modal = document.getElementById("luckyWheelModal");
    if (modal) {
        initLuckyWheel(); // Re-initialize in case probabilities change
        modal.classList.remove("hidden");
        document.getElementById("spinWheelButton").disabled = false;
        document.getElementById("closeWheelButton").classList.add("hidden");
        document.getElementById("wheelResult").classList.add("hidden");
        currentAngle = 0; // Reset wheel position
        drawWheel();
    }
}

function closeLuckyWheel() {
    const modal = document.getElementById("luckyWheelModal");
    if (modal) {
        modal.classList.add("hidden");
        // Optionally, trigger going back to the main menu or restarting
        showMainPage(); // Example: Go back to main menu
    }
}

// Placeholder for updating coins - needs integration with main game logic
function updateCoins(amount) {
    console.log(`Adding ${amount} coins.`);
    // This function should exist in your main game logic (e.g., ui.js or main.js)
    // Example: addCoins(amount);
    if (typeof addCoins === 'function') {
         addCoins(amount);
    } else {
        console.warn("addCoins function not found. Cannot update coin balance.");
        // Fallback: Update UI directly if possible
        const coinsValueElement = document.getElementById('coinsValue');
        if (coinsValueElement) {
            let currentCoins = parseInt(coinsValueElement.textContent) || 0;
            coinsValueElement.textContent = currentCoins + amount;
        }
    }
}

// Add translations for the wheel
if (typeof translations !== 'undefined') {
    translations.luckyWheelTitle = {
        en: "Lucky Wheel!",
        ar: "عجلة الحظ!"
    };
    translations.luckyWheelDesc = {
        en: "You Won (by losing)! Spin the wheel to win coins.",
        ar: "لقد فزت (بخسارتك)! أدر العجلة لتربح عملات."
    };
    translations.spinWheel = {
        en: "Spin Wheel",
        ar: "أدر العجلة"
    };
     translations.youWonCoins = {
        en: "You won",
        ar: "لقد ربحت"
    };
    translations.close = {
        en: "Close",
        ar: "إغلاق"
    };
}

