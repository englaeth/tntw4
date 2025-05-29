// UI Functions
let mainPage, multiplayerMenu, lobbyScreen, lobbyPlayerList, lobbyRoomCodeDisplay, lobbyReadyButton, lobbyStartGameButton;
let nameMenu, playerNameInput, gameContainer, infoElement, statusElement, popupElement;
let profilePage, shopScreen, leaderboardScreen, settingsModal, tasksScreen;

// Initialize UI elements
function initializeUI() {
    // Get main UI elements
    mainPage = document.getElementById("main-page");
    multiplayerMenu = document.getElementById("multiplayer-menu");
    lobbyScreen = document.getElementById("lobby-screen");
    lobbyPlayerList = document.getElementById("lobbyPlayerList");
    lobbyRoomCodeDisplay = document.getElementById("lobbyRoomCodeDisplay");
    lobbyReadyButton = document.getElementById("lobbyReadyButton");
    lobbyStartGameButton = document.getElementById("lobbyStartGameButton");
    nameMenu = document.getElementById("nameMenu");
    playerNameInput = document.getElementById("playerNameInput");
    gameContainer = document.getElementById("gameContainer");
    infoElement = document.getElementById("info");
    statusElement = document.getElementById("status");
    popupElement = document.getElementById("popup");
    profilePage = document.getElementById("profile-page");
    shopScreen = document.getElementById("shopScreen");
    leaderboardScreen = document.getElementById("leaderboardScreen");
    settingsModal = document.getElementById("settingsModal");
    tasksScreen = document.getElementById("tasksScreen");
    
    // Apply translations
    applyTranslations();
}

// Show main page
function showMainPage() {
    hideAllScreens();
    mainPage.style.display = "flex";
}

// Show multiplayer menu
function showMultiplayerMenu() {
    hideAllScreens();
    multiplayerMenu.style.display = "flex";
}

// Show profile UI
function showProfileUI() {
    hideAllScreens();
    profilePage.style.display = "flex";
    updateProfileUI();
}

// Show shop UI
function showShopUI() {
    hideAllScreens();
    shopScreen.style.display = "flex";
    initializeShop();
}

// Show leaderboard UI
function showLeaderboardUI() {
    hideAllScreens();
    leaderboardScreen.style.display = "flex";
    loadLeaderboard();
}

// Show tasks UI
function showTasksUI() {
    hideAllScreens();
    tasksScreen.style.display = "flex";
    loadTasks();
}

// Hide all screens
function hideAllScreens() {
    mainPage.style.display = "none";
    multiplayerMenu.style.display = "none";
    lobbyScreen.style.display = "none";
    nameMenu.style.display = "none";
    gameContainer.style.display = "none";
    profilePage.style.display = "none";
    shopScreen.style.display = "none";
    leaderboardScreen.style.display = "none";
    settingsModal.style.display = "none";
    tasksScreen.style.display = "none";
}

// Start game UI flow
function startGameUI() {
    // Check if player name is already set
    if (tgPlayerName && tgPlayerName !== "Guest") {
        initAndStartGame(tgPlayerName);
    } else {
        // Show name input screen
        hideAllScreens();
        nameMenu.style.display = "flex";
        playerNameInput.focus();
    }
}

// Submit player name
function submitPlayerName() {
    const name = playerNameInput.value.trim();
    if (name) {
        tgPlayerName = name;
        initAndStartGame(name);
    } else {
        showSystemPopup(translations.enterValidName[currentLang] || "Please enter a valid name", true, 2000);
    }
}

// Show system popup
function showSystemPopup(message, isError = false, duration = 0, type = "") {
    const popup = document.getElementById("popup");
    if (!popup) return;
    
    // Set message and style
    popup.textContent = message;
    popup.className = isError ? "error" : "";
    
    if (type) {
        popup.classList.add(type);
    }
    
    // Show popup
    popup.style.display = "block";
    
    // Hide after duration if specified
    if (duration > 0) {
        setTimeout(() => {
            hideSystemPopup();
        }, duration);
    }
}

// Hide system popup
function hideSystemPopup() {
    const popup = document.getElementById("popup");
    if (popup) {
        popup.style.display = "none";
    }
}

// Update profile UI
function updateProfileUI() {
    const profileName = document.getElementById("profileName");
    const profileInitials = document.getElementById("profileInitials");
    const profileAvatar = document.getElementById("profileAvatar");
    
    if (profileName) profileName.textContent = tgPlayerName;
    
    if (profileInitials && tgPlayerName) {
        profileInitials.textContent = tgPlayerName.charAt(0).toUpperCase();
    }
    
    if (profileAvatar && tgPlayerAvatarUrl) {
        profileAvatar.src = tgPlayerAvatarUrl;
        profileAvatar.classList.remove("hidden");
        profileInitials.classList.add("hidden");
    } else if (profileInitials) {
        profileInitials.classList.remove("hidden");
        if (profileAvatar) profileAvatar.classList.add("hidden");
    }
}

// Change avatar
function changeAvatar() {
    // This would typically open a file picker or avatar selection UI
    // For now, just show a message
    showSystemPopup(translations.avatarChangeNotAvailable[currentLang] || "Avatar change not available in this version", true, 2000);
}

// Load leaderboard
function loadLeaderboard() {
    // In the Socket.IO version, we would request leaderboard data from the server
    // For now, just show a placeholder
    leaderboardScreen.innerHTML = `
        <h1 class="text-4xl font-bold mb-6 text-primary" data-translate-key="leaderboardTitle">لوحة المتصدرين</h1>
        <div class="w-full max-w-md bg-slate-800 bg-opacity-70 rounded-xl p-6 mb-6">
            <p class="text-center text-gray-400" data-translate-key="leaderboardEmpty">لا توجد بيانات متصدرين حالياً</p>
        </div>
        <button onclick="showMainPage()" class="mt-4 px-8 py-3 bg-transparent border-2 border-gray-500 text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition font-bold">
            <i class="fas fa-arrow-left mr-2"></i> <span data-translate-key="backToMain">العودة للرئيسية</span>
        </button>
    `;
    
    // Apply translations to the newly added content
    applyTranslations();
}

// Load tasks
function loadTasks() {
    // In the Socket.IO version, we would request tasks data from the server
    // For now, just show placeholder tasks
    const tasksContainer = document.getElementById("tasksContainer");
    if (tasksContainer) {
        tasksContainer.innerHTML = `
            <div class="task-item p-3 bg-slate-700 rounded-lg mb-3">
                <div class="flex justify-between items-center">
                    <span data-translate-key="task1">اجمع 10 سموم</span>
                    <span class="text-xs px-2 py-1 rounded bg-yellow-500">0/10</span>
                </div>
            </div>
            <div class="task-item p-3 bg-slate-700 rounded-lg mb-3">
                <div class="flex justify-between items-center">
                    <span data-translate-key="task2">فز في 3 مباريات</span>
                    <span class="text-xs px-2 py-1 rounded bg-yellow-500">0/3</span>
                </div>
            </div>
            <div class="task-item p-3 bg-slate-700 rounded-lg">
                <div class="flex justify-between items-center">
                    <span data-translate-key="task3">العب 5 مباريات متعددة اللاعبين</span>
                    <span class="text-xs px-2 py-1 rounded bg-yellow-500">0/5</span>
                </div>
            </div>
        `;
    }
    
    // Apply translations to the newly added content
    applyTranslations();
}

// Initialize shop
function initializeShop() {
    // In the Socket.IO version, we would request shop data from the server
    // For now, just show placeholder shop items
    shopScreen.innerHTML = `
        <h1 class="text-4xl font-bold mb-6 text-primary" data-translate-key="shopTitle">المتجر</h1>
        <div class="w-full max-w-md bg-slate-800 bg-opacity-70 rounded-xl p-6 mb-6">
            <div class="grid grid-cols-2 gap-4">
                <div class="shop-item p-3 bg-slate-700 rounded-lg text-center">
                    <div class="w-16 h-16 mx-auto mb-2 rounded-full bg-red-500"></div>
                    <span data-translate-key="skinRed">أحمر</span>
                    <button class="mt-2 w-full py-1 bg-primary text-dark text-sm rounded">
                        <i class="fas fa-coins mr-1"></i> 100
                    </button>
                </div>
                <div class="shop-item p-3 bg-slate-700 rounded-lg text-center">
                    <div class="w-16 h-16 mx-auto mb-2 rounded-full bg-blue-500"></div>
                    <span data-translate-key="skinBlue">أزرق</span>
                    <button class="mt-2 w-full py-1 bg-primary text-dark text-sm rounded">
                        <i class="fas fa-coins mr-1"></i> 100
                    </button>
                </div>
                <div class="shop-item p-3 bg-slate-700 rounded-lg text-center">
                    <div class="w-16 h-16 mx-auto mb-2 rounded-full bg-green-500"></div>
                    <span data-translate-key="skinGreen">أخضر</span>
                    <button class="mt-2 w-full py-1 bg-primary text-dark text-sm rounded">
                        <i class="fas fa-coins mr-1"></i> 100
                    </button>
                </div>
                <div class="shop-item p-3 bg-slate-700 rounded-lg text-center">
                    <div class="w-16 h-16 mx-auto mb-2 rounded-full bg-purple-500"></div>
                    <span data-translate-key="skinPurple">بنفسجي</span>
                    <button class="mt-2 w-full py-1 bg-primary text-dark text-sm rounded">
                        <i class="fas fa-coins mr-1"></i> 100
                    </button>
                </div>
            </div>
        </div>
        <button onclick="showMainPage()" class="mt-4 px-8 py-3 bg-transparent border-2 border-gray-500 text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition font-bold">
            <i class="fas fa-arrow-left mr-2"></i> <span data-translate-key="backToMain">العودة للرئيسية</span>
        </button>
    `;
    
    // Apply translations to the newly added content
    applyTranslations();
}
