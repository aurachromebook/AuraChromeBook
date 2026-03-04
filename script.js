// --- 1. Boot Sequence & Init ---
window.onload = function() {
    setTimeout(() => {
        const boot = document.getElementById('boot-screen');
        boot.style.opacity = '0';
        setTimeout(() => boot.style.display = 'none', 500);

        if (localStorage.getItem('os_password')) {
            document.getElementById('lock-screen').style.display = 'flex';
        }
    }, 2500);

    const savedWallpaper = localStorage.getItem('os_wallpaper');
    if(savedWallpaper) document.getElementById('desktop').style.backgroundImage = `url('${savedWallpaper}')`;

    const savedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
    savedApps.forEach(app => {
        if(!document.getElementById('taskbar-' + app.id)) restoreAppToTaskbar(app.id, app.icon, app.name);
    });

    document.querySelectorAll('.app-icon').forEach(makeIconDraggable);
    initBattery();
};

// --- 2. System UI ---
function updateClock() {
    const now = new Date();
    let hours = now.getHours(), minutes = now.getMinutes();
    hours = hours % 12 || 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById('clock').innerText = hours + ':' + minutes;
}
setInterval(updateClock, 1000); updateClock();

function initBattery() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            function updateLevel() {
                const level = Math.round(battery.level * 100) + '%';
                document.getElementById('taskbar-battery').innerText = battery.charging ? '⚡' : '🔋';
                document.getElementById('qs-battery-text').innerText = level;
                document.getElementById('qs-battery-icon').innerText = battery.charging ? '⚡' : '🔋';
            }
            updateLevel();
            battery.addEventListener('levelchange', updateLevel);
            battery.addEventListener('chargingchange', updateLevel);
        });
    }
}

document.getElementById('brightness-slider').addEventListener('input', function(e) {
    document.getElementById('desktop').style.filter = `brightness(${e.target.value}%)`;
});

// --- 3. Context & Menus ---
const desktop = document.getElementById('desktop');
const contextMenu = document.getElementById('context-menu');
const quickSettings = document.getElementById('quick-settings');
const launcherMenu = document.getElementById('launcher-menu');

desktop.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if(e.target === desktop || e.target.id === 'desktop-icons') {
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
    }
});

document.addEventListener('click', (e) => {
    if(!contextMenu.contains(e.target)) contextMenu.style.display = 'none';
    if(!quickSettings.contains(e.target) && !document.getElementById('status-area').contains(e.target)) {
        quickSettings.style.display = 'none';
    }
    if(!launcherMenu.contains(e.target) && !document.getElementById('launcher-btn').contains(e.target)) {
        launcherMenu.style.display = 'none';
    }
});

function toggleQuickSettings() {
    quickSettings.style.display = quickSettings.style.display === 'none' ? 'block' : 'none';
    launcherMenu.style.display = 'none';
}

function toggleMenu() {
    launcherMenu.style.display = launcherMenu.style.display === 'none' ? 'flex' : 'none';
    quickSettings.style.display = 'none';
    if (launcherMenu.style.display === 'flex') {
        document.getElementById('launcher-search').focus();
    }
}

function filterLauncher() {
    const query = document.getElementById('launcher-search').value.toLowerCase();
    const items = document.querySelectorAll('.launcher-item');
    items.forEach(item => {
        const text = item.querySelector('.l-text').innerText.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
    });
}

function lockSystem() {
    if (localStorage.getItem('os_password')) document.getElementById('lock-screen').style.display = 'flex';
    else alert("Please set a password in Settings first!");
    quickSettings.style.display = 'none'; contextMenu.style.display = 'none';
}

// --- 4. Security ---
function unlockOS() {
    const input = document.getElementById('lock-password').value;
    if (input === localStorage.getItem('os_password') || input === localStorage.getItem('os_answer')) {
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('lock-password').value = '';
        document.getElementById('lock-error').style.display = 'none';
    } else document.getElementById('lock-error').style.display = 'block';
}

function showSecurityQuestion() {
    const hintDiv = document.getElementById('security-hint');
    const qText = document.getElementById('lock-question-text');
    const savedQ = localStorage.getItem('os_question');
    qText.innerText = savedQ ? "Hint: " + savedQ : "No security question set.";
    hintDiv.style.display = 'block';
}

function saveSecuritySettings() {
    const pass = document.getElementById('set-password').value;
    const q = document.getElementById('set-question').value;
    const a = document.getElementById('set-answer').value;
    if(pass) localStorage.setItem('os_password', pass);
    if(q) localStorage.setItem('os_question', q);
    if(a) localStorage.setItem('os_answer', a);
    const msg = document.getElementById('security-save-msg');
    msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 3000);
}

// --- 5. Window Memory Management (LAZY LOAD FIX) ---
let highestZ = 10;
function openApp(appId) {
    const appWindow = document.getElementById(appId);
    if(appWindow) {
        // --- MEMORY FIX: Only load the iframe when opened! ---
        const iframe = appWindow.querySelector('iframe');
        if (iframe && !iframe.src) {
            iframe.src = iframe.getAttribute('data-src'); // Fetch from data-src
        }

        appWindow.style.display = 'flex'; 
        appWindow.classList.remove('minimized');
        bringToFront(appWindow); 
        updateTaskbarIndicator(appId, true
