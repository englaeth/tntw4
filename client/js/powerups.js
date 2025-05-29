// Powerups system
const POWERUP_TYPES = [
    {
        id: "speed",
        name: "Speed Boost",
        nameAr: "تعزيز السرعة",
        description: "Increases movement speed temporarily",
        descriptionAr: "يزيد من سرعة الحركة مؤقتًا",
        color: "#00aaff",
        icon: "fa-bolt"
    },
    {
        id: "shrink",
        name: "Shrink",
        nameAr: "تقليص",
        description: "Instantly reduces your size",
        descriptionAr: "يقلل حجمك فورًا",
        color: "#33ff33",
        icon: "fa-compress"
    },
    {
        id: "magnet",
        name: "Magnet",
        nameAr: "مغناطيس",
        description: "Attracts nearby poisons",
        descriptionAr: "يجذب السموم القريبة",
        color: "#ff9900",
        icon: "fa-magnet"
    },
    {
        id: "reverse",
        name: "Reverse Controls",
        nameAr: "عكس التحكم",
        description: "Reverses your controls temporarily",
        descriptionAr: "يعكس تحكمك مؤقتًا",
        color: "#ff00ff",
        icon: "fa-random"
    },
    {
        id: "swap",
        name: "Swap Sizes",
        nameAr: "تبديل الأحجام",
        description: "Swap sizes with a random opponent",
        descriptionAr: "تبديل الأحجام مع خصم عشوائي",
        color: "#ffff00",
        icon: "fa-exchange-alt",
        multiplayerOnly: true
    },
    {
        id: "control",
        name: "Mind Control",
        nameAr: "التحكم العقلي",
        description: "Control a random opponent temporarily",
        descriptionAr: "تحكم في خصم عشوائي مؤقتًا",
        color: "#ff00ff",
        icon: "fa-brain",
        multiplayerOnly: true
    }
];

// Get powerup info by ID
function getPowerupInfo(id) {
    return POWERUP_TYPES.find(p => p.id === id) || null;
}

// Get random powerup type
function getRandomPowerupType() {
    const availablePowerups = POWERUP_TYPES.filter(p => {
        if (p.multiplayerOnly) {
            return gameInstance && gameInstance.gameMode === "multiplayer";
        }
        return true;
    });
    
    const randomIndex = Math.floor(Math.random() * availablePowerups.length);
    return availablePowerups[randomIndex].id;
}

// Display powerup effect
function displayPowerupEffect(type) {
    const powerupInfo = getPowerupInfo(type);
    if (!powerupInfo) return;
    
    const name = currentLang === "ar" ? powerupInfo.nameAr : powerupInfo.name;
    showSystemPopup(`${name}!`, false, 2000);
    
    // Add visual effect to UI
    const powerupsContainer = document.getElementById("powerupsContainer");
    if (powerupsContainer) {
        const powerupElement = document.createElement("div");
        powerupElement.className = "powerup-indicator";
        powerupElement.style.cssText = `
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background-color: ${powerupInfo.color};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        powerupElement.innerHTML = `
            <i class="fas ${powerupInfo.icon}"></i>
            <span>${name}</span>
        `;
        
        powerupsContainer.appendChild(powerupElement);
        
        // Animate in
        setTimeout(() => {
            powerupElement.style.opacity = "1";
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            powerupElement.style.opacity = "0";
            setTimeout(() => {
                powerupsContainer.removeChild(powerupElement);
            }, 300);
        }, GAME_SETTINGS.POWERUP_DURATION);
    }
}
