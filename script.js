// ===== ECHO OS ACCOUNT SYSTEM =====
// All user data is stored in localStorage with account-specific prefixes

const ECHO_DOMAIN = '@echoos.com';
let currentAccount = null; // { email, username, name, password }

// Initialize account database
function initAccountDB() {
    if (!localStorage.getItem('echo_accounts_db')) {
        localStorage.setItem('echo_accounts_db', JSON.stringify({}));
    }
}

// Get all accounts from database
function getAllAccounts() {
    const db = localStorage.getItem('echo_accounts_db');
    return db ? JSON.parse(db) : {};
}

// Save account to database
function saveAccountToDB(account) {
    const accounts = getAllAccounts();
    accounts[account.email] = account;
    localStorage.setItem('echo_accounts_db', JSON.stringify(accounts));
}

// Get account by email
function getAccountByEmail(email) {
    const accounts = getAllAccounts();
    return accounts[email] || null;
}

// Delete account from database
function deleteAccountFromDB(email) {
    const accounts = getAllAccounts();
    delete accounts[email];
    localStorage.setItem('echo_accounts_db', JSON.stringify(accounts));
    // Also clear all account-specific data
    clearAccountData(email);
}

// Get account-specific storage key prefix
function getAccountPrefix(email) {
    return 'echo_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '') + '_';
}

// Save data for current account
function saveAccountData(key, value) {
    if (!currentAccount) return;
    const prefix = getAccountPrefix(currentAccount.email);
    localStorage.setItem(prefix + key, value);
}

// Get data for current account
function getAccountData(key, defaultValue = null) {
    if (!currentAccount) return defaultValue;
    const prefix = getAccountPrefix(currentAccount.email);
    return localStorage.getItem(prefix + key) || defaultValue;
}

// Clear all data for an account
function clearAccountData(email) {
    const prefix = getAccountPrefix(email);
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            localStorage.removeItem(key);
        }
    }
}

// Show account modal
function showAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('account-signin-view').style.display = 'block';
        document.getElementById('account-create-view').style.display = 'none';
        document.getElementById('account-error').innerText = '';
    }
}

function showAccountModalFromLock() {
    showAccountModal();
}

function hideAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) modal.style.display = 'none';
}

function showCreateAccount() {
    document.getElementById('account-signin-view').style.display = 'none';
    document.getElementById('account-create-view').style.display = 'block';
    document.getElementById('account-error').innerText = '';
}

function showSignIn() {
    document.getElementById('account-signin-view').style.display = 'block';
    document.getElementById('account-create-view').style.display = 'none';
    document.getElementById('account-error').innerText = '';
}

function updateEmailPreview() {
    const username = document.getElementById('create-username-input').value.trim();
    const preview = document.getElementById('email-preview');
    if (username) {
        preview.innerText = 'Your email will be: ' + username + ECHO_DOMAIN;
    } else {
        preview.innerText = '';
    }
}

function createAccount() {
    const name = document.getElementById('create-name-input').value.trim();
    const username = document.getElementById('create-username-input').value.trim().toLowerCase();
    const password = document.getElementById('create-password-input').value;
    const confirm = document.getElementById('create-confirm-input').value;
    const errorDiv = document.getElementById('account-error');

    // Validation
    if (!name || !username || !password) {
        errorDiv.innerText = 'Please fill in all fields.';
        return;
    }

    if (username.length < 3) {
        errorDiv.innerText = 'Username must be at least 3 characters.';
        return;
    }

    if (!/^[a-z0-9._-]+$/.test(username)) {
        errorDiv.innerText = 'Username can only contain letters, numbers, dots, hyphens, and underscores.';
        return;
    }

    if (password.length < 4) {
        errorDiv.innerText = 'Password must be at least 4 characters.';
        return;
    }

    if (password !== confirm) {
        errorDiv.innerText = 'Passwords do not match.';
        return;
    }

    const email = username + ECHO_DOMAIN;

    // Check if account already exists
    if (getAccountByEmail(email)) {
        errorDiv.innerText = 'An account with this username already exists.';
        return;
    }

    // Create account
    const account = {
        email: email,
        username: username,
        name: name,
        password: password,
        createdAt: new Date().toISOString()
    };

    saveAccountToDB(account);

    // Set as current account
    currentAccount = account;
    localStorage.setItem('echo_current_account', email);

    // Hide modal and continue setup
    hideAccountModal();

    // Continue to OOBE setup
    const setupScreen = document.getElementById('setup-screen');
    if (setupScreen) {
        setupScreen.style.display = 'flex';
        // Pre-fill name
        const nameInput = document.getElementById('setup-name-input');
        if (nameInput) nameInput.value = name;
    }
}

function signInAccount() {
    const emailInput = document.getElementById('account-email-input').value.trim().toLowerCase();
    const password = document.getElementById('account-password-input').value;
    const errorDiv = document.getElementById('account-error');

    if (!emailInput || !password) {
        errorDiv.innerText = 'Please enter both email and password.';
        return;
    }

    // Ensure @echoos.com suffix
    let email = emailInput;
    if (!email.includes('@')) {
        email = email + ECHO_DOMAIN;
    }

    const account = getAccountByEmail(email);
    if (!account) {
        errorDiv.innerText = 'Account not found. Please check your email or create a new account.';
        return;
    }

    if (account.password !== password) {
        errorDiv.innerText = 'Incorrect password. Please try again.';
        return;
    }

    // Sign in successful
    currentAccount = account;
    localStorage.setItem('echo_current_account', email);

    hideAccountModal();

    // Show loading screen and load account data
    showAccountLoadingScreen();
}

function showAccountLoadingScreen() {
    const loadingScreen = document.getElementById('account-loading-screen');
    const emailEl = document.getElementById('loading-email');
    const progressEl = document.getElementById('loading-progress');
    const detailsEl = document.getElementById('loading-details');

    if (loadingScreen) loadingScreen.style.display = 'flex';
    if (emailEl && currentAccount) emailEl.innerText = currentAccount.email;

    // Simulate loading steps
    const steps = [
        { progress: 15, text: 'Authenticating...' },
        { progress: 30, text: 'Loading profile...' },
        { progress: 45, text: 'Restoring apps and games...' },
        { progress: 60, text: 'Loading files and data...' },
        { progress: 75, text: 'Restoring settings...' },
        { progress: 90, text: 'Finalizing...' },
        { progress: 100, text: 'Welcome back!' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex >= steps.length) {
            clearInterval(interval);
            setTimeout(() => {
                if (loadingScreen) loadingScreen.style.display = 'none';
                initializeDesktopWithAccount();
            }, 500);
            return;
        }

        const step = steps[stepIndex];
        if (progressEl) progressEl.style.width = step.progress + '%';
        if (detailsEl) detailsEl.innerText = step.text;
        stepIndex++;
    }, 400);
}

function initializeDesktopWithAccount() {
    if (!currentAccount) return;

    // Load account-specific data
    const savedSetup = getAccountData('setup_complete');

    if (!savedSetup) {
        // First time for this account - show setup
        const setupScreen = document.getElementById('setup-screen');
        if (setupScreen) {
            setupScreen.style.display = 'flex';
            const nameInput = document.getElementById('setup-name-input');
            if (nameInput) nameInput.value = currentAccount.name;
        }
    } else {
        // Returning account - initialize desktop directly
        initializeDesktop();

        // Check if password is set for this account
        const accountPassword = getAccountData('password');
        if (accountPassword) {
            const lockScreen = document.getElementById('lock-screen');
            if (lockScreen) {
                updateLockScreenForAccount();
                lockScreen.style.display = 'flex';
            }
        } else {
            showCreatorScreen();
        }
    }
}

function updateLockScreenForAccount() {
    if (!currentAccount) return;

    const usernameEl = document.getElementById('lock-username');
    const emailEl = document.getElementById('lock-email');
    const avatarImg = document.getElementById('lock-avatar-img');

    if (usernameEl) usernameEl.innerText = currentAccount.name;
    if (emailEl) emailEl.innerText = currentAccount.email;
    if (avatarImg) {
        // Generate avatar based on username
        avatarImg.src = 'https://www.gravatar.com/avatar/' + btoa(currentAccount.email).replace(/[^a-zA-Z0-9]/g, '') + '?d=mp&s=128';
    }

    // Update accounts list on lock screen
    updateLockScreenAccountsList();
}

function updateLockScreenAccountsList() {
    const listEl = document.getElementById('lock-accounts-list');
    if (!listEl) return;

    const accounts = getAllAccounts();
    const currentEmail = currentAccount ? currentAccount.email : '';

    listEl.innerHTML = '';

    Object.values(accounts).forEach(account => {
        const isActive = account.email === currentEmail;
        const item = document.createElement('div');
        item.className = 'lock-account-item' + (isActive ? ' active' : '');
        item.onclick = () => switchToAccount(account.email);
        item.innerHTML = `
            <div class="lock-account-avatar">${account.name.charAt(0).toUpperCase()}</div>
            <div class="lock-account-info">
                <div class="lock-account-name">${account.name}</div>
                <div class="lock-account-email">${account.email}</div>
            </div>
            <button class="lock-account-remove" onclick="event.stopPropagation(); removeAccount('${account.email}')">×</button>
        `;
        listEl.appendChild(item);
    });
}

function switchToAccount(email) {
    const account = getAccountByEmail(email);
    if (!account) return;

    // Save current session data if any
    if (currentAccount) {
        // Save any unsaved data here if needed
    }

    // Switch to new account
    currentAccount = account;
    localStorage.setItem('echo_current_account', email);

    // Hide lock screen and show loading
    const lockScreen = document.getElementById('lock-screen');
    if (lockScreen) lockScreen.style.display = 'none';

    // Reload with new account
    showAccountLoadingScreen();
}

function removeAccount(email) {
    if (!confirm('Remove this account? All data for this account will be deleted.')) return;

    const wasCurrent = currentAccount && currentAccount.email === email;

    deleteAccountFromDB(email);

    if (wasCurrent) {
        currentAccount = null;
        localStorage.removeItem('echo_current_account');
        location.reload();
    } else {
        updateLockScreenAccountsList();
    }
}

function switchAccount() {
    // Show account modal to switch
    showAccountModal();
    // Pre-fill with current account hint
    if (currentAccount) {
        document.getElementById('account-email-input').value = currentAccount.email;
    }
}

function signOutAccount() {
    if (!confirm('Sign out of ' + (currentAccount ? currentAccount.email : 'your account') + '?')) return;

    currentAccount = null;
    localStorage.removeItem('echo_current_account');
    location.reload();
}

// Override the original finalizeSetup to save to account
let highestZ = 10;
function openApp(appId) {
    const appWindow = document.getElementById(appId);
    if(appWindow) {
        const iframe = appWindow.querySelector('iframe');
        if (iframe) {
            const currentSrc = iframe.src || "";
            if (currentSrc === "" || currentSrc.includes("about:blank") || currentSrc.includes(window.location.href)) {
                iframe.src = iframe.getAttribute('data-src');
            }
        }
        appWindow.style.display = 'flex'; 
        appWindow.classList.remove('minimized');
        bringToFront(appWindow); 
        updateTaskbarIndicator(appId, true);
    }
    if (launcherMenu) launcherMenu.style.display = 'none';
}

function minimizeApp(appId) { 
    const appWindow = document.getElementById(appId);
    if (appWindow) appWindow.classList.add('minimized'); 
    updateTaskbarIndicator(appId, false); 
}

function maximizeApp(appId) { 
    const appWindow = document.getElementById(appId);
    if (appWindow) appWindow.classList.toggle('fullscreen'); 
}

function closeApp(appId) {
    const appWindow = document.getElementById(appId);
    if (!appWindow) return;

    appWindow.style.display = 'none'; 
    appWindow.classList.remove('minimized');
    appWindow.classList.remove('fullscreen');
    updateTaskbarIndicator(appId, false);

    const iframe = appWindow.querySelector('iframe');
    if(iframe) iframe.src = 'about:blank'; 
}

function toggleApp(appId) {
    const appWindow = document.getElementById(appId);
    if (!appWindow) return;

    if (appWindow.style.display === 'flex' && !appWindow.classList.contains('minimized')) {
        if (appWindow.style.zIndex == highestZ) minimizeApp(appId); 
        else bringToFront(appWindow);
    } else openApp(appId);
}

function bringToFront(elmnt) { 
    highestZ++; 
    // Cap z-index so windows never go above launcher/quick settings
    if (highestZ >= 9990) highestZ = 11;
    elmnt.style.zIndex = highestZ; 
    const iframe = elmnt.querySelector('iframe');
    if(iframe && iframe.contentWindow) {
        iframe.focus();
    }
}


// --- IFRAME FOCUS & KEYBOARD FIX ---
// Track the currently active window for keyboard forwarding
let activeGameWindow = null;

// Override bringToFront to also track active window and focus iframe properly
const originalBringToFront = bringToFront;
bringToFront = function(elmnt) {
    originalBringToFront ? originalBringToFront(elmnt) : undefined;
    activeGameWindow = elmnt.id;

    // Focus the iframe content window for keyboard capture
    const iframe = elmnt.querySelector('iframe');
    if (iframe) {
        // Use contentWindow.focus() instead of iframe.focus()
        try {
            iframe.contentWindow.focus();
        } catch(e) {
            // Cross-origin might block this, fallback to iframe element focus
            iframe.focus();
        }

        // Also ensure the iframe is clickable by adding a one-time click handler
        // that refocuses it (for games that lose focus)
        const contentArea = elmnt.querySelector('.window-content');
        if (contentArea) {
            contentArea.onclick = function(e) {
                // Only focus if clicking on the content area background, not buttons
                if (e.target === contentArea || e.target.tagName === 'IFRAME') {
                    try {
                        iframe.contentWindow.focus();
                    } catch(err) {
                        iframe.focus();
                    }
                }
            };
        }
    }
};

// Global keyboard event forwarding to active iframe
// This captures keys at the document level and sends them to the active game
document.addEventListener('keydown', function(e) {
    if (!activeGameWindow) return;

    const win = document.getElementById(activeGameWindow);
    if (!win || win.style.display === 'none' || win.classList.contains('minimized')) {
        activeGameWindow = null;
        return;
    }

    const iframe = win.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return;

    // Don't forward if user is typing in an input/textarea in the parent
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
    }

    // Forward the keyboard event to the iframe
    try {
        // Try to focus the iframe first
        iframe.contentWindow.focus();

        // For same-origin iframes, we can dispatch the event
        // For cross-origin, focusing is the best we can do
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
            const evt = new KeyboardEvent('keydown', {
                key: e.key,
                code: e.code,
                keyCode: e.keyCode,
                which: e.which,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey,
                bubbles: true
            });
            iframeDoc.dispatchEvent(evt);

            // Prevent default browser actions for game keys (WASD, Space, etc.)
            if (['w','a','s','d','W','A','S','D',' ','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift','Control'].includes(e.key) || 
                [87,65,83,68,32,38,40,37,39,16,17].includes(e.keyCode)) {
                e.preventDefault();
            }
        }
    } catch(err) {
        // Cross-origin restriction - just ensure focus is there
        iframe.focus();
    }
}, true); // Use capture phase to get events before they bubble

// Also handle keyup for games that need it
document.addEventListener('keyup', function(e) {
    if (!activeGameWindow) return;

    const win = document.getElementById(activeGameWindow);
    if (!win || win.style.display === 'none' || win.classList.contains('minimized')) return;

    const iframe = win.querySelector('iframe');
    if (!iframe) return;

    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
            const evt = new KeyboardEvent('keyup', {
                key: e.key,
                code: e.code,
                keyCode: e.keyCode,
                which: e.which,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey,
                bubbles: true
            });
            iframeDoc.dispatchEvent(evt);
        }
    } catch(err) {
        // Cross-origin - ignore
    }
}, true);

// Make all windows focusable by adding tabindex
// This allows the window itself to receive focus events
document.querySelectorAll('.window').forEach(win => {
    win.setAttribute('tabindex', '-1');
    win.style.outline = 'none';
});

// When clicking on a window header, focus the window and its iframe
document.querySelectorAll('.window-header').forEach(header => {
    header.addEventListener('click', function() {
        const win = this.closest('.window');
        if (win) {
            win.focus();
            const iframe = win.querySelector('iframe');
            if (iframe) {
                try { iframe.contentWindow.focus(); } catch(e) { iframe.focus(); }
            }
        }
    });
});

function updateTaskbarIndicator(appId, isActive) {
    const icon = document.querySelector(`button[onclick*="'${appId}'"]`);
    if(icon) {
        if (isActive) icon.classList.add('active');
        else icon.classList.remove('active');
    }
}

// Window Dragging 
const snapPreview = document.getElementById('snap-preview');
let currentSnap = null;

document.querySelectorAll('.window').forEach(win => {
    dragElement(win); 
    win.addEventListener('mousedown', () => bringToFront(win));
});

function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById(elmnt.id + "-header");
    if (header) header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if(e.target.tagName === 'BUTTON') return;
        if(elmnt.classList.contains('fullscreen')) return; 
        e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
        elmnt.classList.add('dragging');
    }
    function elementDrag(e) {
        e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px"; elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        const th = 20; 
        if (e.clientX < th) { showPreview(0, 0, '50%', '100%'); currentSnap = 'left'; } 
        else if (e.clientX > window.innerWidth - th) { showPreview('50%', 0, '50%', '100%'); currentSnap = 'right'; } 
        else if (e.clientY < th) { showPreview(0, 0, '100%', '100%'); currentSnap = 'top'; } 
        else { 
            if (snapPreview) snapPreview.style.display = 'none'; 
            currentSnap = null; 
        }
    }
    function showPreview(l, t, w, h) { 
        if (!snapPreview) return;
        snapPreview.style.display = 'block'; 
        snapPreview.style.left = l; 
        snapPreview.style.top = t; 
        snapPreview.style.width = w; 
        snapPreview.style.height = h; 
    }
    function closeDragElement() {
        document.onmouseup = null; 
        document.onmousemove = null; 
        elmnt.classList.remove('dragging'); 
        if (snapPreview) snapPreview.style.display = 'none';
        if (currentSnap === 'left') { 
            elmnt.style.left = '0'; 
            elmnt.style.top = '0'; 
            elmnt.style.width = '50vw'; 
            elmnt.style.height = '100vh'; 
        } else if (currentSnap === 'right') { 
            elmnt.style.left = '50vw'; 
            elmnt.style.top = '0'; 
            elmnt.style.width = '50vw'; 
            elmnt.style.height = '100vh'; 
        } else if (currentSnap === 'top') { 
            elmnt.classList.add('fullscreen'); 
            elmnt.style.width=''; 
            elmnt.style.height=''; 
            elmnt.style.top=''; 
            elmnt.style.left=''; 
        }
        currentSnap = null;
    }
}

function dragDesktopIcon(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px"; elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
    function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
}

// --- Local File Explorer & Notepad ---
let currentNotepadFile = null;

function notepadSaveAs() {
    let name = prompt("Enter file name (e.g. MyNotes):");
    if(!name) return;
    if(!name.endsWith('.txt')) name += '.txt';
    currentNotepadFile = name;
    notepadSave();
}

function notepadSave() {
    if(!currentNotepadFile) { notepadSaveAs(); return; }
    let content = document.getElementById('wordpad-editor').innerHTML;
    let files = JSON.parse(localStorage.getItem('echo_files') || '{}');
    files[currentNotepadFile] = content;
    localStorage.setItem('echo_files', JSON.stringify(files));
    notificationMgr.showNotification({ title: "File Saved", message: `${currentNotepadFile} was saved successfully!`, icon: "sparkles" });
    renderFiles();
}

function notepadOpen() {
    let name = prompt("Enter the exact file name to open:");
    if(!name) return;
    if(!name.endsWith('.txt')) name += '.txt';

    let files = JSON.parse(localStorage.getItem('echo_files') || '{}');
    if(files[name]) {
        document.getElementById('wordpad-editor').innerHTML = files[name];
        currentNotepadFile = name;
    } else { alert("File not found!"); }
}

function renderFiles() {
    const grid = document.getElementById('file-explorer-grid');
    if(!grid) return;
    let files = JSON.parse(localStorage.getItem('echo_files') || '{}');
    grid.innerHTML = '';
    for(let name in files) {
        grid.innerHTML += `<div class="file-item" ondblclick="window.openFileFromExplorer('${name}')"><div class="f-icon">📄</div><span>${name}</span></div>`;
    }
}

window.openFileFromExplorer = function(name) {
    let files = JSON.parse(localStorage.getItem('echo_files') || '{}');
    document.getElementById('wordpad-editor').innerHTML = files[name];
    currentNotepadFile = name;
    openApp('wordpad-window'); 
};

// --- Applications Logic ---
let calcInput = "";
function calcPress(val) { 
    calcInput += val; 
    const display = document.getElementById('calc-display');
    if (display) display.value = calcInput; 
}
function calcClear() { 
    calcInput = ""; 
    const display = document.getElementById('calc-display');
    if (display) display.value = "0"; 
}
function calcEval() { 
    try { 
        calcInput = eval(calcInput).toString(); 
        const display = document.getElementById('calc-display');
        if (display) display.value = calcInput; 
    } catch(e) { 
        const display = document.getElementById('calc-display');
        if (display) display.value = "Error"; 
        calcInput = ""; 
    } 
}

function setWallpaper(url) {
    let highResUrl = url.replace("w=400", "w=2000");
    const desktop = document.getElementById('desktop');
    if (desktop) desktop.style.backgroundImage = `url('${highResUrl}')`;
    localStorage.setItem('echo_wallpaper', highResUrl);
}

// Wallpaper upload
document.addEventListener('DOMContentLoaded', function() {
    const wallpaperUpload = document.getElementById('wallpaper-upload');
    if (wallpaperUpload) {
        wallpaperUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const desktop = document.getElementById('desktop');
                    if (desktop) desktop.style.backgroundImage = `url('${ev.target.result}')`;
                    try { 
                        localStorage.setItem('echo_wallpaper', ev.target.result); 
                    } catch(err) { 
                        alert("Image applied for this session."); 
                    }
                }; 
                reader.readAsDataURL(file);
            }
        });
    }
});

// --- Taskbar & Play Store Logic ---
function switchStoreTab(tabId) {
    document.querySelectorAll('.play-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.store-tab-content').forEach(content => content.classList.remove('active'));
    const tabBtn = document.querySelector(`[onclick="switchStoreTab('${tabId}')"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const tabContent = document.getElementById(`store-${tabId}-tab`);
    if (tabContent) tabContent.classList.add('active');
}

const taskbarIconsContainer = document.getElementById('app-icons');
let draggedIcon = null;

function makeIconDraggable(icon) {
    icon.addEventListener('dragstart', function() { 
        draggedIcon = this; 
        setTimeout(() => this.classList.add('dragging-icon'), 0); 
    });
    icon.addEventListener('dragend', function() { 
        setTimeout(() => { 
            this.classList.remove('dragging-icon'); 
            draggedIcon = null; 
        }, 0); 
    });
    icon.addEventListener('dragover', (e) => e.preventDefault());
    icon.addEventListener('drop', function(e) {
        e.preventDefault();
        if (draggedIcon !== this && taskbarIconsContainer) {
            let allIcons = [...taskbarIconsContainer.children];
            allIcons.indexOf(draggedIcon) < allIcons.indexOf(this) ? this.after(draggedIcon) : this.before(draggedIcon);
        }
    });
}

function installApp(appId, iconSymbol, appName, buttonElement) {
    const launcherList = document.getElementById('launcher-list');
    const existingItem = launcherList ? launcherList.querySelector(`[data-app-id="${appId}"]`) : null;
    if (existingItem) {
        notificationMgr.showNotification({ 
            title: "Already Installed", 
            message: `${appName} is already in your launcher.`, 
            icon: "sparkles" 
        });
        return;
    }

    const pCont = document.getElementById('progress-container-' + appId);
    const pBar = document.getElementById('progress-bar-' + appId);

    buttonElement.innerText = 'Installing...'; 
    buttonElement.disabled = true; 
    if(pCont) pCont.style.display = 'block';

    let progress = 0;
    const dlInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10; 
        if (progress >= 100) {
            progress = 100; 
            clearInterval(dlInterval);
            if(pBar) pBar.style.width = '100%';
            buttonElement.innerText = 'Installed'; 
            if(pCont) setTimeout(() => pCont.style.display = 'none', 500);

            restoreAppToLauncher(appId, iconSymbol, appName); 
            saveAppToStorage(appId, iconSymbol, appName);

            notificationMgr.showNotification({ 
                title: "Installation Complete", 
                message: `${appName} has been added to your launcher. Right-click to add to shelf.`, 
                icon: "sparkles" 
            });
        } else if(pBar) {
            pBar.style.width = progress + '%';
        }
    }, 300); 
}

function restoreAppToLauncher(appId, iconSymbol, appName) {
    const launcherList = document.getElementById('launcher-list');
    if (!launcherList || launcherList.querySelector(`[data-app-id="${appId}"]`)) return;

    const item = document.createElement('div');
    item.className = 'launcher-item';
    item.setAttribute('data-app-id', appId);
    item.setAttribute('data-icon', iconSymbol);
    item.setAttribute('data-name', appName);
    item.onclick = () => openApp(appId);
    item.innerHTML = `<div class="l-icon">${iconSymbol}</div><span class="l-text">${appName}</span>`;
    launcherList.appendChild(item);
}

function restoreAppToTaskbar(appId, iconSymbol, appName) {
    if (document.getElementById('taskbar-' + appId)) return;

    const btn = document.createElement('button'); 
    btn.className = 'app-icon'; 
    btn.id = 'taskbar-' + appId; 
    btn.title = appName; 
    btn.innerHTML = iconSymbol; 
    btn.draggable = true; 
    btn.onclick = () => toggleApp(appId);

    if (taskbarIconsContainer) taskbarIconsContainer.appendChild(btn); 
    makeIconDraggable(btn);
}

function saveAppToStorage(appId, iconSymbol, appName) {
    let savedApps = JSON.parse(localStorage.getItem('echo_installed_apps') || '[]');
    if (!savedApps.find(app => app.id === appId)) {
        savedApps.push({ 
            id: appId, 
            icon: iconSymbol, 
            name: appName,
            pinned: false
        }); 
        localStorage.setItem('echo_installed_apps', JSON.stringify(savedApps));
    }
}

const originalFinalizeSetup = window.finalizeSetup;
window.finalizeSetup = function() {
    localStorage.setItem('echo_setup_complete', 'true');
    localStorage.setItem('echo_username', tempUsername);
    if (tempPassword !== '') localStorage.setItem('echo_password', tempPassword);

    // Also save to account-specific storage
    if (currentAccount) {
        saveAccountData('setup_complete', 'true');
        saveAccountData('username', tempUsername);
        if (tempPassword) saveAccountData('password', tempPassword);
    }

    document.getElementById('setup-screen').style.display = 'none';
    const lockUsername = document.getElementById('lock-username');
    if (lockUsername) lockUsername.innerText = tempUsername;

    initializeDesktop();
    const welcomeModal = document.getElementById('welcome-modal');
    if (welcomeModal) welcomeModal.style.display = 'flex';
};

// Override unlock to check account password
const originalUnlockOS = window.unlockOS;
window.unlockOS = function() {
    const input = document.getElementById('lock-password').value;
    const lockError = document.getElementById('lock-error');
    const lockScreen = document.getElementById('lock-screen');

    // Check account password first, then fallback to local
    let correctPassword = null;
    if (currentAccount) {
        correctPassword = getAccountData('password') || currentAccount.password;
    } else {
        correctPassword = localStorage.getItem('echo_password');
    }

    const savedAnswer = currentAccount ? getAccountData('answer') : localStorage.getItem('echo_answer');

    if (input === correctPassword || input === savedAnswer) {
        if (lockScreen) lockScreen.style.display = 'none';
        document.getElementById('lock-password').value = '';
        if (lockError) lockError.style.display = 'none';
        showCreatorScreen();
    } else {
        if (lockError) lockError.style.display = 'block';
    }
};

// Override saveSecuritySettings to save to account
const originalSaveSecuritySettings = window.saveSecuritySettings;
window.saveSecuritySettings = function() {
    const pass = document.getElementById('set-password').value;
    const q = document.getElementById('set-question').value;
    const a = document.getElementById('set-answer').value;

    if (pass) {
        localStorage.setItem('echo_password', pass);
        if (currentAccount) saveAccountData('password', pass);
    }
    if (q) {
        localStorage.setItem('echo_question', q);
        if (currentAccount) saveAccountData('question', q);
    }
    if (a) {
        localStorage.setItem('echo_answer', a);
        if (currentAccount) saveAccountData('answer', a);
    }

    const msg = document.getElementById('security-save-msg');
    if (msg) {
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    }
};

// Override factoryReset to be account-aware
const originalFactoryReset = window.factoryReset;
window.factoryReset = function() {
    if (confirm("WARNING: This will erase ALL data including all accounts. Continue?")) {
        localStorage.clear();
        location.reload();
    }
};

// Override lockSystem to show account info
const originalLockSystem = window.lockSystem;
window.lockSystem = function() {
    const accountPassword = currentAccount ? getAccountData('password') : localStorage.getItem('echo_password');

    if (accountPassword) {
        updateLockScreenForAccount();
        const lockScreen = document.getElementById('lock-screen');
        if (lockScreen) lockScreen.style.display = 'flex';
    } else {
        alert("Please set a password in Settings first!");
    }

    const quickSettings = document.getElementById('quick-settings');
    if (quickSettings) quickSettings.style.display = 'none';
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) contextMenu.style.display = 'none';
};

// Override initializeDesktop to load account data
const originalInitializeDesktop = window.initializeDesktop;
window.initializeDesktop = function() {
    updateCalendarWidget();
    initChromeProxy();
    initTabCloak();
    initAboutBlankSettings();
    initBatterySaver();
    restoreActiveApps();

    // Update settings panel with account info
    if (currentAccount) {
        const nameEl = document.getElementById('settings-account-name');
        const emailEl = document.getElementById('settings-account-email');
        if (nameEl) nameEl.innerText = currentAccount.name;
        if (emailEl) emailEl.innerText = currentAccount.email;
    }

    const desktop = document.getElementById('desktop');
    const savedWallpaper = getAccountData('wallpaper') || localStorage.getItem('echo_wallpaper');
    if (savedWallpaper && desktop) desktop.style.backgroundImage = `url('${savedWallpaper}')`;

    // Load account-specific installed apps
    const savedApps = JSON.parse(getAccountData('installed_apps') || localStorage.getItem('echo_installed_apps') || '[]');
    savedApps.forEach(app => {
        restoreAppToLauncher(app.id, app.icon, app.name);
        if (app.pinned) {
            restoreAppToTaskbar(app.id, app.icon, app.name);
        }
    });

    // Ensure pre-installed apps are in taskbar
    PRE_INSTALLED_APPS.forEach(appId => {
        const game = PS_GAMES[appId];
        const app = PS_APPS[appId];
        const item = game || app;
        if (item && !document.getElementById('taskbar-' + appId)) {
            restoreAppToTaskbar(appId, item.icon, item.name);
        }
    });

    document.querySelectorAll('.app-icon').forEach(makeIconDraggable);
    document.querySelectorAll('.desktop-icon').forEach(dragDesktopIcon);
    initLauncherContextMenu();
    initBattery();
    renderFiles();
    initLinkCreator();
};

// Override setWallpaper to save to account
const originalSetWallpaper = window.setWallpaper;
window.setWallpaper = function(url) {
    let highResUrl = url.replace("w=400", "w=2000");
    const desktop = document.getElementById('desktop');
    if (desktop) desktop.style.backgroundImage = `url('${highResUrl}')`;
    localStorage.setItem('echo_wallpaper', highResUrl);
    if (currentAccount) saveAccountData('wallpaper', highResUrl);
};

// Override saveAppToStorage to save to account
const originalSaveAppToStorage = window.saveAppToStorage;
window.saveAppToStorage = function(appId, iconSymbol, appName) {
    let savedApps = JSON.parse(getAccountData('installed_apps') || localStorage.getItem('echo_installed_apps') || '[]');
    if (!savedApps.find(app => app.id === appId)) {
        savedApps.push({
            id: appId,
            icon: iconSymbol,
            name: appName,
            pinned: false
        });
        localStorage.setItem('echo_installed_apps', JSON.stringify(savedApps));
        if (currentAccount) saveAccountData('installed_apps', JSON.stringify(savedApps));
    }
};

// Override notepadSave to save to account
const originalNotepadSave = window.notepadSave;
window.notepadSave = function() {
    if(!currentNotepadFile) { notepadSaveAs(); return; }
    let content = document.getElementById('wordpad-editor').innerHTML;
    let files = JSON.parse(getAccountData('files') || localStorage.getItem('echo_files') || '{}');
    files[currentNotepadFile] = content;
    localStorage.setItem('echo_files', JSON.stringify(files));
    if (currentAccount) saveAccountData('files', JSON.stringify(files));
    notificationMgr.showNotification({ title: "File Saved", message: `${currentNotepadFile} was saved successfully!`, icon: "sparkles" });
    renderFiles();
};

// Override renderFiles to load from account
const originalRenderFiles = window.renderFiles;
window.renderFiles = function() {
    const grid = document.getElementById('file-explorer-grid');
    if(!grid) return;
    let files = JSON.parse(getAccountData('files') || localStorage.getItem('echo_files') || '{}');
    grid.innerHTML = '';
    for(let name in files) {
        grid.innerHTML += `<div class="file-item" ondblclick="window.openFileFromExplorer('${name}')"><div class="f-icon">📄</div><span>${name}</span></div>`;
    }
};

// Override openFileFromExplorer to load from account
const originalOpenFileFromExplorer = window.openFileFromExplorer;
window.openFileFromExplorer = function(name) {
    let files = JSON.parse(getAccountData('files') || localStorage.getItem('echo_files') || '{}');
    document.getElementById('wordpad-editor').innerHTML = files[name];
    currentNotepadFile = name;
    openApp('wordpad-window');
};

// Override saveBatteryLogToFile to save to account
const originalSaveBatteryLogToFile = window.saveBatteryLogToFile;
window.saveBatteryLogToFile = function() {
    const batteryLog = localStorage.getItem('echo_battery_log') || '';
    let files = JSON.parse(getAccountData('files') || localStorage.getItem('echo_files') || '{}');
    files['battery_saver_log.txt'] = `<pre style="font-family: monospace; white-space: pre-wrap; font-size: 12px; line-height: 1.5;">${batteryLog}</pre>`;
    localStorage.setItem('echo_files', JSON.stringify(files));
    if (currentAccount) saveAccountData('files', JSON.stringify(files));
};

// Override wallpaper upload handler
const originalWallpaperUploadHandler = null;
document.addEventListener('DOMContentLoaded', function() {
    const wallpaperUpload = document.getElementById('wallpaper-upload');
    if (wallpaperUpload) {
        wallpaperUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const desktop = document.getElementById('desktop');
                    if (desktop) desktop.style.backgroundImage = `url('${ev.target.result}')`;
                    try {
                        localStorage.setItem('echo_wallpaper', ev.target.result);
                        if (currentAccount) saveAccountData('wallpaper', ev.target.result);
                    } catch(err) {
                        alert("Image applied for this session.");
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// ===== ECHO OS BOOT SEQUENCE =====
window.onload = function() {
    initAccountDB();

    // Check if there's a current account
    const savedAccountEmail = localStorage.getItem('echo_current_account');
    if (savedAccountEmail) {
        currentAccount = getAccountByEmail(savedAccountEmail);
    }

    if(localStorage.getItem('echo_theme') === 'light') {
        document.body.setAttribute('data-theme', 'light');
        const themeText = document.getElementById('theme-text');
        if (themeText) themeText.innerText = "Light Theme";
    }

    setTimeout(() => {
        const boot = document.getElementById('boot-screen');
        if(boot) {
            boot.style.opacity = '0';
            setTimeout(() => boot.style.display = 'none', 500);
        }

        // Check if user has an account system account
        const accounts = getAllAccounts();
        const hasAccounts = Object.keys(accounts).length > 0;
        const isSetupComplete = localStorage.getItem('echo_setup_complete');

        if (currentAccount) {
            // Signed into an account - show account loading screen
            showAccountLoadingScreen();
        } else if (hasAccounts) {
            // Has accounts but not signed in - show sign in modal
            showAccountModal();
        } else if (!isSetupComplete) {
            // Legacy: no accounts, no setup - first time ever
            showAccountModal();
        } else {
            // Legacy: no accounts, but setup was completed before account system existed
            initializeDesktop();
            if (localStorage.getItem('echo_password')) {
                const lockUsername = document.getElementById('lock-username');
                if (lockUsername) lockUsername.innerText = localStorage.getItem('echo_username') || 'User';
                const lockScreen = document.getElementById('lock-screen');
                if (lockScreen) lockScreen.style.display = 'flex';
            } else {
                showCreatorScreen();
            }
        }
    }, 2500);
};

// ===== ECHO OS CORE FUNCTIONS =====


// --- CORS PROXY CONFIGURATION FOR CHROME ---
const CORS_PROXIES = {
    corsproxy: 'https://corsproxy.io/?',
    allorigins: 'https://api.allorigins.win/raw?url=',
    apiallorigins: 'https://api.allorigins.win/get?url=',
    none: ''
};

let currentProxy = localStorage.getItem('echo_chrome_proxy') || 'corsproxy';
let chromeHistory = [], chromeIndex = -1;

function getProxiedUrl(url) {
    if (currentProxy === 'none') return url;
    const proxy = CORS_PROXIES[currentProxy];
    return proxy + encodeURIComponent(url);
}

function toggleProxySettings() {
    const panel = document.getElementById('proxy-settings');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function changeProxy() {
    const selector = document.getElementById('proxy-selector');
    currentProxy = selector.value;
    localStorage.setItem('echo_chrome_proxy', currentProxy);

    const status = document.getElementById('proxy-status');
    status.innerText = currentProxy === 'none' ? 'Disabled' : 'Active';

    if (chromeIndex >= 0) {
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function navigateChrome() {
    let url = document.getElementById('chrome-url').value.trim();

    // Special case: ChromeReworked.html loads directly without proxy
    if (url === 'Apps/ChromeReworked.html' || url.includes('ChromeReworked')) {
        const iframe = document.getElementById('chrome-frame');
        const errorDiv = document.getElementById('chrome-error');
        if (iframe) {
            iframe.src = 'Apps/ChromeReworked.html';
        }
        if (errorDiv) errorDiv.style.display = 'none';
        return;
    }

    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    if (!url.includes('.') || url.includes(' ')) {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }

    chromeHistory = chromeHistory.slice(0, chromeIndex + 1);
    chromeHistory.push(url);
    chromeIndex++;

    loadChromeUrl(url, true);
}

function loadChromeUrl(url, addToHistory) {
    const iframe = document.getElementById('chrome-frame');
    const errorDiv = document.getElementById('chrome-error');
    const urlInput = document.getElementById('chrome-url');

    urlInput.value = url;
    errorDiv.style.display = 'none';

    const proxiedUrl = getProxiedUrl(url);

    if (currentProxy === 'apiallorigins') {
        fetch(proxiedUrl)
            .then(response => response.json())
            .then(data => {
                if (data.contents) {
                    const blob = new Blob([data.contents], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);
                    iframe.src = blobUrl;
                } else {
                    throw new Error('No content received');
                }
            })
            .catch(err => {
                showChromeError(url, err.message);
            });
    } else {
        iframe.src = proxiedUrl;

        iframe.onload = function() {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc && doc.body) {
                    errorDiv.style.display = 'none';
                }
            } catch (e) {
                errorDiv.style.display = 'none';
            }
        };

        iframe.onerror = function() {
            showChromeError(url, 'Failed to load page');
        };

        setTimeout(() => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (!doc || !doc.body || doc.body.innerHTML === '') {
                    if (iframe.src !== proxiedUrl && iframe.src !== 'about:blank') {
                        showChromeError(url, 'Page blocked or unavailable');
                    }
                }
            } catch (e) {}
        }, 5000);
    }
}

function showChromeError(url, message) {
    const errorDiv = document.getElementById('chrome-error');
    const errorText = document.getElementById('chrome-error-text');
    errorText.innerText = message || `The webpage at ${url} might be temporarily down or it may have moved permanently. Try changing the proxy in settings (⚙️).`;
    errorDiv.style.display = 'flex';
}

function retryChrome() {
    if (chromeIndex >= 0) {
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function chromeBack() {
    if (chromeIndex > 0) {
        chromeIndex--;
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function chromeForward() {
    if (chromeIndex < chromeHistory.length - 1) {
        chromeIndex++;
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function chromeReload() {
    if (chromeIndex >= 0) {
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function initChromeProxy() {
    const selector = document.getElementById('proxy-selector');
    if (selector) {
        selector.value = currentProxy;
        const status = document.getElementById('proxy-status');
        if (status) status.innerText = currentProxy === 'none' ? 'Disabled' : 'Active';
    }
}

// --- TAB CLOAKING SYSTEM ---
const CLOAK_PRESETS = {
    echo: {
        title: 'Echo OS - Ultimate Edition',
        favicon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    },
    fleckle: {
        title: 'Fleckle - Student Portal',
        favicon: 'https://www.google.com/favicon.ico'
    },
    classroom: {
        title: 'Google Classroom',
        favicon: 'https://ssl.gstatic.com/classroom/favicon.png'
    },
    flocabulary: {
        title: 'Flocabulary - Educational Hip-Hop',
        favicon: 'https://www.flocabulary.com/wp-content/uploads/2018/07/cropped-flobook-32x32.png'
    }
};

function changeTabCloak() {
    const selector = document.getElementById('cloak-selector');
    const preset = CLOAK_PRESETS[selector.value];

    if (preset) {
        document.getElementById('page-title').innerText = preset.title;
        document.getElementById('page-favicon').href = preset.favicon;
        localStorage.setItem('echo_tab_cloak', selector.value);

        document.getElementById('cloak-status').innerText = 'Current: ' + preset.title;
    }
}

function initTabCloak() {
    const savedCloak = localStorage.getItem('echo_tab_cloak') || 'echo';
    const selector = document.getElementById('cloak-selector');
    if (selector) {
        selector.value = savedCloak;
        changeTabCloak();
    }
}

// --- INSTANT ABOUT:BLANK CLOAKING - EXECUTE IMMEDIATELY ---
(function checkInstantAboutBlank() {
    const setting = localStorage.getItem('echo_aboutblank_setting');
    if (setting === 'always') {
        // Prevent multiple about:blank tabs - check if we're already in an iframe
        if (window.self !== window.top) {
            // Already inside an iframe (about:blank), do nothing
            return;
        }

        // Check if we've already opened about:blank in this session
        if (sessionStorage.getItem('echo_aboutblank_opened')) {
            return;
        }
        sessionStorage.setItem('echo_aboutblank_opened', 'true');

        const currentUrl = window.location.href;
        const newWindow = window.open('about:blank', '_blank');

        if (newWindow) {
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Echo OS</title>
                    <style>
                        body { margin: 0; overflow: hidden; }
                        iframe { width: 100vw; height: 100vh; border: none; }
                    </style>
                </head>
                <body>
                    <iframe src="${currentUrl}" allowfullscreen></iframe>
                </body>
                </html>
            `);
            newWindow.document.close();

            // Close the original tab
            window.close();
        }
    }
})();

function goIntoAboutBlank() {
    // Prevent multiple about:blank tabs
    if (window.self !== window.top) {
        return;
    }

    if (sessionStorage.getItem('echo_aboutblank_opened')) {
        return;
    }
    sessionStorage.setItem('echo_aboutblank_opened', 'true');

    const currentUrl = window.location.href;
    const newWindow = window.open('about:blank', '_blank');

    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Echo OS</title>
                <style>
                    body { margin: 0; overflow: hidden; }
                    iframe { width: 100vw; height: 100vh; border: none; }
                </style>
            </head>
            <body>
                <iframe src="${currentUrl}" allowfullscreen></iframe>
            </body>
            </html>
        `);
        newWindow.document.close();

        // Close the original tab
        window.close();
    }
}

// --- ABOUT:BLANK CLOAKING SYSTEM ---
let aboutBlankPending = false;

function showAboutBlankModal() {
    const modal = document.getElementById('aboutblank-modal');
    if (modal) modal.style.display = 'flex';
}

function handleAboutBlank(choice) {
    const modal = document.getElementById('aboutblank-modal');
    modal.style.display = 'none';

    switch(choice) {
        case 'always':
            localStorage.setItem('echo_aboutblank_setting', 'always');
            openInAboutBlank();
            break;
        case 'once':
            aboutBlankPending = true;
            openInAboutBlank();
            break;
        case 'no':
            // Just close modal, don't do anything
            break;
        case 'block':
            localStorage.setItem('echo_aboutblank_setting', 'block');
            showBlockMessage();
            break;
    }
}

function openInAboutBlank() {
    // Prevent multiple about:blank tabs
    if (window.self !== window.top) {
        return;
    }

    if (sessionStorage.getItem('echo_aboutblank_opened')) {
        return;
    }
    sessionStorage.setItem('echo_aboutblank_opened', 'true');

    const currentUrl = window.location.href;
    const newWindow = window.open('about:blank', '_blank');

    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Echo OS</title>
                <style>
                    body { margin: 0; overflow: hidden; }
                    iframe { width: 100vw; height: 100vh; border: none; }
                </style>
            </head>
            <body>
                <iframe src="${currentUrl}" allowfullscreen></iframe>
            </body>
            </html>
        `);
        newWindow.document.close();

        // Close the original tab
        window.close();
    }
}

function showBlockMessage() {
    notificationMgr.showNotification({
        title: "About:Blank Blocked",
        message: "You have blocked about:blank prompts. You can re-enable auto about:blank in Settings.",
        icon: "shield-alert"
    });
}

function checkAboutBlankSetting() {
    const setting = localStorage.getItem('echo_aboutblank_setting');

    if (setting === 'block') {
        return; // Don't show anything
    } else if (setting === 'always') {
        // Auto open about:blank immediately
        setTimeout(() => {
            if (window.self === window.top && !window.location.href.includes('about:blank')) {
                openInAboutBlank();
            }
        }, 500);
    } else if (setting === 'never') {
        return; // Don't do anything
    } else {
        // Ask mode - show modal
        setTimeout(() => {
            showAboutBlankModal();
        }, 3000);
    }
}

function saveAboutBlankSetting() {
    const selector = document.getElementById('aboutblank-setting');
    localStorage.setItem('echo_aboutblank_setting', selector.value);

    const blockedMsg = document.getElementById('aboutblank-blocked-msg');
    if (selector.value === 'block') {
        blockedMsg.style.display = 'block';
    } else {
        blockedMsg.style.display = 'none';
    }
}

function initAboutBlankSettings() {
    const selector = document.getElementById('aboutblank-setting');
    if (selector) {
        const saved = localStorage.getItem('echo_aboutblank_setting') || 'ask';
        selector.value = saved;

        const blockedMsg = document.getElementById('aboutblank-blocked-msg');
        if (saved === 'block' && blockedMsg) {
            blockedMsg.style.display = 'block';
        }
    }
}



// ===== ECHO OS PLAY STORE SYSTEM =====
// Game database with metadata
const PS_GAMES = {
    'doodlejump-window': { id: 'doodlejump-window', name: 'Doodle Jump', icon: '🐰', category: 'arcade', rating: 4.6, banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=800', desc: 'Jump endlessly upward in this classic arcade game.', controls: 'Arrow keys to move left/right' },
    'drivingsimulator-window': { id: 'drivingsimulator-window', name: 'Driving Simulator', icon: '🚗', category: 'simulation', rating: 4.5, banner: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800', desc: 'Realistic driving simulation experience.', controls: 'WASD to drive, Space to brake' },
    'effingzombies-window': { id: 'effingzombies-window', name: 'Effing Zombies', icon: '🧟', category: 'action', rating: 4.4, banner: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800', desc: 'Survive waves of zombie attacks.', controls: 'Mouse to aim, Click to shoot' },
    'infinitecraft-window': { id: 'infinitecraft-window', name: 'Infinite Craft', icon: '⚗️', category: 'simulation', rating: 4.6, banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800', desc: 'Combine elements to create new items.', controls: 'Drag and drop to combine' },
    'paperio-window': { id: 'paperio-window', name: 'Paper.io', icon: '📄', category: 'arcade', rating: 4.5, banner: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800', desc: 'Capture territory in this addictive strategy game.', controls: 'Arrow keys to move' },
    'parkingfury-window': { id: 'parkingfury-window', name: 'Parking Fury', icon: '🅿️', category: 'racing', rating: 4.4, banner: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800', desc: 'Master the art of parking under pressure.', controls: 'Arrow keys to drive' },
    'granny3-window': { id: 'granny3-window', name: 'Granny 3', icon: '👵', category: 'horror', rating: 4.5, banner: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800', desc: 'Escape from Granny\'s haunted house.', controls: 'WASD to move, E to interact' },
    'granny2-window': { id: 'granny2-window', name: 'Granny 2', icon: '👵', category: 'horror', rating: 4.6, banner: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800', desc: 'The sequel horror escape game.', controls: 'WASD to move, E to interact' },
    'fridaynightfunk-window': { id: 'fridaynightfunk-window', name: 'Friday Night Funkin', icon: '🎤', category: 'arcade', rating: 4.8, banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800', desc: 'Rhythm battle game with catchy beats.', controls: 'Arrow keys to match beats' },
    'geometrydash-window': { id: 'geometrydash-window', name: 'Geometry Dash', icon: '📐', category: 'arcade', rating: 4.9, banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800', desc: 'Jump and fly through dangerous passages.', controls: 'Space/Click to jump' },
    'smashcarts-window': { id: 'smashcarts-window', name: 'Smash Karts', icon: '🏎️', category: 'racing', rating: 4.8, banner: 'https://images.unsplash.com/photo-1511994714008-b6d68a8b32a2?q=80&w=800', desc: 'Kart racing battle royale with weapons.', controls: 'WASD to drive, Space to shoot' },
    'fnae-window': { id: 'fnae-window', name: 'Five Nights', icon: '🐻', category: 'horror', rating: 4.5, banner: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800', desc: 'Survive the night shift at the pizzeria.', controls: 'Mouse to interact' },
    'eaglercraft-window': { id: 'eaglercraft-window', name: 'Eaglercraft', icon: '⛏️', category: 'simulation', rating: 4.8, banner: 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=800', desc: 'Minecraft-style sandbox building game.', controls: 'WASD to move, Mouse to look' },
    'granny-window': { id: 'granny-window', name: 'Granny', icon: '👵', category: 'horror', rating: 4.3, banner: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800', desc: 'Escape from Granny\'s house in 5 days.', controls: 'WASD to move, E to interact' },
    'escaperoad-window': { id: 'escaperoad-window', name: 'Escape Road', icon: '🚗', category: 'racing', rating: 4.6, banner: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800', desc: 'High-speed escape driving game.', controls: 'Arrow keys to drive' },
    'escaperoad2-window': { id: 'escaperoad2-window', name: 'Escape Road 2', icon: '🏎️', category: 'racing', rating: 4.7, banner: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800', desc: 'Sequel with more vehicles and maps.', controls: 'Arrow keys to drive' },
    'solarsmash-window': { id: 'solarsmash-window', name: 'Solar Smash', icon: '🪐', category: 'simulation', rating: 4.4, banner: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800', desc: 'Destroy planets with various weapons.', controls: 'Click to select weapons' },
    'brainrot-window': { id: 'brainrot-window', name: 'Brainrot', icon: '🧠', category: 'puzzle', rating: 4.1, banner: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=800', desc: 'Steal the brainrot in this puzzle game.', controls: 'Mouse to interact' },
    'ragdollhit-window': { id: 'ragdollhit-window', name: 'Ragdoll Hit', icon: '🥊', category: 'action', rating: 4.2, banner: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?q=80&w=800', desc: 'Physics-based ragdoll fighting game.', controls: 'Mouse to aim and swing' },
    'ragdollarchers-window': { id: 'ragdollarchers-window', name: 'Ragdoll Archers', icon: '🏹', category: 'action', rating: 4.5, banner: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=800', desc: 'Archery with realistic ragdoll physics.', controls: 'Mouse to aim and shoot' },
    '99nights-window': { id: '99nights-window', name: '99 Nights', icon: '🌲', category: 'survival', rating: 4.6, banner: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800', desc: 'Survive 99 nights in the forest.', controls: 'WASD to move, Click to attack' },
    'rocketleague-window': { id: 'rocketleague-window', name: 'Rocket League', icon: '⚽', category: 'sports', rating: 4.9, banner: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=800', desc: 'Soccer with rocket-powered cars.', controls: 'WASD to drive, Space to jump' },
    'bballrandom-window': { id: 'bballrandom-window', name: 'Basketball Random', icon: '🏀', category: 'sports', rating: 4.4, banner: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800', desc: 'Randomized basketball physics game.', controls: 'Arrow keys to move' },
    'bballbros-window': { id: 'bballbros-window', name: 'Basketball Bros', icon: '🏀', category: 'sports', rating: 4.5, banner: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800', desc: '2-player basketball showdown.', controls: 'WASD and Arrow keys' },
    'bballlegend-window': { id: 'bballlegend-window', name: 'Basketball Legend', icon: '🏀', category: 'sports', rating: 4.6, banner: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800', desc: 'Become a basketball legend.', controls: 'Arrow keys to move, Space to shoot' },
    'roblox-window': { id: 'roblox-window', name: 'Roblox', icon: '🟥', category: 'adventure', rating: 4.8, banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=800', desc: 'Play millions of user-created games.', controls: 'WASD to move, Mouse to look' },
    'gtavice-window': { id: 'gtavice-window', name: 'GTA Vice City', icon: '🚔', category: 'action', rating: 4.9, banner: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800', desc: 'Classic open-world crime adventure.', controls: 'WASD to move, Mouse to aim' },
    'pixelfruits-window': { id: 'pixelfruits-window', name: 'Pixel Fruits', icon: '🍎', category: 'arcade', rating: 4.7, banner: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800', desc: 'Slice fruits in this pixel art game.', controls: 'Mouse to slice' },
    'aceattorney-window': { id: 'aceattorney-window', name: 'Ace Attorney', icon: '⚖️', category: 'rpg', rating: 4.8, banner: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800', desc: 'Courtroom drama visual novel.', controls: 'Click to advance dialogue' },
    'callofduty-window': { id: 'callofduty-window', name: 'Call of Duty', icon: '🔫', category: 'action', rating: 4.7, banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800', desc: 'First-person shooter action.', controls: 'WASD to move, Mouse to aim' },
    'stateio-window': { id: 'stateio-window', name: 'State.io', icon: '🗺️', category: 'strategy', rating: 4.5, banner: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800', desc: 'Conquer territories in this strategy game.', controls: 'Click to send troops' },
    'undertaleyellow-window': { id: 'undertaleyellow-window', name: 'Undertale Yellow', icon: '💛', category: 'rpg', rating: 4.9, banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800', desc: 'Fan-made Undertale prequel.', controls: 'Arrow keys to move, Z to interact' },
    'yanderesim-window': { id: 'yanderesim-window', name: 'Yandere Simulator', icon: '🔪', category: 'simulation', rating: 4.6, banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800', desc: 'Stealth simulation game.', controls: 'WASD to move, E to interact' },
    'pokemon-window': { id: 'pokemon-window', name: 'Pokemon', icon: '⚡', category: 'rpg', rating: 4.9, banner: 'https://images.unsplash.com/photo-1542779283-429eb70b4d98?q=80&w=800', desc: 'Catch and train Pokemon in this RPG adventure.', controls: 'Arrow keys to move, Z to interact' },
    '1v1lol-window': { id: '1v1lol-window', name: '1v1.LOL', icon: '🔫', category: 'action', rating: 4.7, banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800', desc: 'Build and battle in this competitive shooter.', controls: 'WASD to move, Mouse to aim/build' }
,
    'bitlife-window': { id: 'bitlife-window', name: 'Bitlife', icon: '📱', category: 'simulation', rating: 4.7, banner: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800', desc: 'Live your entire life from birth to death in this text-based life simulator.', controls: 'Click to make choices' },
    'footballbros-window': { id: 'footballbros-window', name: 'Football Bros', icon: '🏈', category: 'sports', rating: 4.6, banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800', desc: 'Play football with your bros in this exciting sports game.', controls: 'Arrow keys to move, Space to action' }
};

// Play Store Apps Database
const PS_APPS = {
    'chrome-window': { id: 'chrome-window', name: 'Chrome', icon: '🌐', category: 'browser', rating: 4.9, banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=800', desc: 'Fast, secure web browser with built-in proxy support.', controls: 'Mouse and keyboard' },
    'discord-window': { id: 'discord-window', name: 'Discord', icon: '💬', category: 'social', rating: 4.8, banner: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800', desc: 'Chat and connect with friends and communities.', controls: 'Mouse and keyboard' },
    'echochat-window': { id: 'echochat-window', name: 'Echo Chat', icon: '💬', category: 'social', rating: 4.9, banner: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=800', desc: 'Chat with friends and communities in real-time with DM notifications.', controls: 'Mouse and keyboard' },
    'echoflix-window': { id: 'echoflix-window', name: 'EchoFlix', icon: '🎬', category: 'entertainment', rating: 4.7, banner: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800', desc: 'Stream movies and shows on EchoFlix.', controls: 'Mouse and keyboard' },
    'echomusic-window': { id: 'echomusic-window', name: 'Echo Music', icon: '🎵', category: 'entertainment', rating: 4.8, banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800', desc: 'Stream music from Spotify and SoundCloud.', controls: 'Mouse and keyboard' },
    'files-window': { id: 'files-window', name: 'Files', icon: '📁', category: 'productivity', rating: 4.5, banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800', desc: 'Manage your local files and documents.', controls: 'Mouse and keyboard' },
    'wordpad-window': { id: 'wordpad-window', name: 'Wordpad', icon: '📝', category: 'productivity', rating: 4.4, banner: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800', desc: 'Create and edit text documents with rich formatting.', controls: 'Mouse and keyboard' },
    'calc-window': { id: 'calc-window', name: 'Calculator', icon: '🧮', category: 'productivity', rating: 4.6, banner: 'https://images.unsplash.com/photo-1587145820266-a5951eebe0e3?q=80&w=800', desc: 'Standard calculator for quick math.', controls: 'Mouse and keyboard' },
    'settings-window': { id: 'settings-window', name: 'Settings', icon: '⚙️', category: 'system', rating: 5.0, banner: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800', desc: 'Configure your Echo OS experience.', controls: 'Mouse and keyboard' },
    'robloxanimator-window': { id: 'robloxanimator-window', name: 'Roblox Animator', icon: '🎬', category: 'creative', rating: 4.5, banner: 'https://images.unsplash.com/photo-1616499370260-485b3e5ed653?q=80&w=800', desc: 'Create Roblox animations.', controls: 'Mouse and keyboard' },
    'linkcreator-window': { id: 'linkcreator-window', name: 'Link Creator', icon: '🔗', category: 'productivity', rating: 4.3, banner: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=800', desc: 'Create and share custom links.', controls: 'Mouse and keyboard' },
    'echochat-window': { id: 'echochat-window', name: 'Echo Chat', icon: '💬', category: 'social', rating: 4.9, banner: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=800', desc: 'Chat with friends and communities in real-time with DM notifications.', controls: 'Mouse and keyboard' }
};
// Pre-installed apps (built into Echo OS, always available)
const PRE_INSTALLED_APPS = [
    'chrome-window', 'store-window', 'settings-window', 'wordpad-window', 
    'calc-window', 'files-window', 'echochat-window', 'linkcreator-window'
];

function isAppInstalled(appId) {
    const installed = JSON.parse(getAccountData('installed_apps') || localStorage.getItem('echo_installed_apps') || '[]');
    const installedIds = installed.map(a => a.id);
    return installedIds.includes(appId) || PRE_INSTALLED_APPS.includes(appId);
}


// Play time tracking (stored per account)
function getPlayTimeData() {
    const data = getAccountData('playtime_data');
    return data ? JSON.parse(data) : {};
}

function savePlayTimeData(data) {
    saveAccountData('playtime_data', JSON.stringify(data));
}

function getRecentPlays() {
    const data = getAccountData('recent_plays');
    return data ? JSON.parse(data) : [];
}

function saveRecentPlays(data) {
    saveAccountData('recent_plays', JSON.stringify(data));
}

function getFavorites() {
    const data = getAccountData('ps_favorites');
    return data ? JSON.parse(data) : [];
}

function saveFavorites(data) {
    saveAccountData('ps_favorites', JSON.stringify(data));
}

// Track when a game is opened
const originalOpenAppForPS = openApp;
openApp = function(appId) {
    const result = originalOpenAppForPS ? originalOpenAppForPS(appId) : undefined;

    // Track play time
    if (PS_GAMES[appId]) {
        trackGameOpen(appId);
    }

    return result;
};

function trackGameOpen(appId) {
    const now = Date.now();

    // Update play time data
    let playTimeData = getPlayTimeData();
    if (!playTimeData[appId]) {
        playTimeData[appId] = { totalSeconds: 0, lastOpened: now, sessions: 0 };
    }
    playTimeData[appId].lastOpened = now;
    playTimeData[appId].sessions++;
    savePlayTimeData(playTimeData);

    // Update recent plays (keep last 10)
    let recent = getRecentPlays();
    recent = recent.filter(id => id !== appId);
    recent.unshift(appId);
    recent = recent.slice(0, 10);
    saveRecentPlays(recent);

    // Refresh Play Store UI if open
    if (document.getElementById('store-window').style.display === 'flex') {
        renderPlayStoreHome();
        renderPlayStoreSidebar();
    }
}

// Format play time
function formatPlayTime(seconds) {
    if (seconds < 60) return seconds + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (mins === 0) return hours + 'h';
    return hours + 'h ' + mins + 'm';
}

// Render sidebar game list
function renderPlayStoreSidebar() {
    const gameList = document.getElementById('ps-game-list');
    const appList = document.getElementById('ps-app-list');
    if (!gameList) return;

    const recent = getRecentPlays();

    // Render games
    let gamesHtml = '';
    Object.values(PS_GAMES).forEach(game => {
        const isInstalled = isAppInstalled(game.id);
        const isActive = recent.length > 0 && recent[0] === game.id;
        gamesHtml += `<div class="ps-game-item ${isActive ? 'active' : ''}" onclick="openPlayStoreDetail('${game.id}', 'game')">
            <div class="ps-game-icon">${game.icon}</div>
            <span>${game.name} ${isInstalled ? '✓' : ''}</span>
        </div>`;
    });
    gameList.innerHTML = gamesHtml;

    // Render apps
    if (appList) {
        let appsHtml = '';
        Object.values(PS_APPS).forEach(app => {
            const isInstalled = isAppInstalled(app.id);
            appsHtml += `<div class="ps-game-item" onclick="openPlayStoreDetail('${app.id}', 'app')">
                <div class="ps-game-icon">${app.icon}</div>
                <span>${app.name} ${isInstalled ? '✓' : ''}</span>
            </div>`;
        });
        appList.innerHTML = appsHtml;
    }
}

let psSidebarCategory = 'games';

function switchSidebarCategory(category) {
    psSidebarCategory = category;
    const gameList = document.getElementById('ps-game-list');
    const appList = document.getElementById('ps-app-list');
    const gamesBtn = document.getElementById('ps-sidebar-games-btn');
    const appsBtn = document.getElementById('ps-sidebar-apps-btn');

    if (category === 'games') {
        if (gameList) gameList.style.display = 'flex';
        if (appList) appList.style.display = 'none';
        if (gamesBtn) {
            gamesBtn.style.background = 'var(--ps-primary)';
            gamesBtn.style.color = 'white';
        }
        if (appsBtn) {
            appsBtn.style.background = 'rgba(255,255,255,0.05)';
            appsBtn.style.color = '#9aa0a6';
        }
    } else {
        if (gameList) gameList.style.display = 'none';
        if (appList) appList.style.display = 'flex';
        if (gamesBtn) {
            gamesBtn.style.background = 'rgba(255,255,255,0.05)';
            gamesBtn.style.color = '#9aa0a6';
        }
        if (appsBtn) {
            appsBtn.style.background = 'var(--ps-primary)';
            appsBtn.style.color = 'white';
        }
    }
}

// Select a game in the sidebar
function playStoreSelectGame(appId) {
    const game = PS_GAMES[appId];
    if (!game) return;

    showPlayStoreTab('home');
    renderFeaturedGame(appId);
}

// Render featured game banner
function renderFeaturedGame(appId) {
    const game = PS_GAMES[appId];
    if (!game) return;

    const playTimeData = getPlayTimeData();
    const pt = playTimeData[appId] || { totalSeconds: 0, sessions: 0 };
    const timeStr = formatPlayTime(pt.totalSeconds);

    const featured = document.getElementById('ps-featured-game');
    if (!featured) return;

    featured.innerHTML = `
        <div class="ps-featured-banner" onclick="openPlayStoreDetail('${appId}', 'game')" style="cursor: pointer;">
            <img src="${game.banner}" alt="${game.name}" onerror="this.style.display='none'">
            <div class="ps-featured-overlay">
                <div class="ps-featured-tags">
                    <span class="ps-tag full">Full</span>
                    <span class="ps-tag">3D</span>
                    <span class="ps-tag">${game.category.charAt(0).toUpperCase() + game.category.slice(1)}</span>
                </div>
                <h2 class="ps-featured-title">${game.name}</h2>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="ps-play-btn" onclick="event.stopPropagation(); openApp('${appId}')">▶ Play</button>
                    <button class="ps-more-btn" onclick="event.stopPropagation(); toggleFavorite('${appId}')" title="Favorite">⭐</button>
                    <button class="ps-more-btn" onclick="event.stopPropagation(); uninstallPlayStoreGame('${appId}')" title="Uninstall">🗑️</button>
                </div>
                <div class="ps-stats-row">
                    <div class="ps-stat"><span>⏱️</span> <strong>Playtime</strong> ${timeStr}</div>
                    <div class="ps-stat"><span>🔥</span> <strong>Sessions</strong> ${pt.sessions}</div>
                    <div class="ps-stat"><span>⭐</span> <strong>Rating</strong> ${game.rating}/5</div>
                </div>
            </div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; margin-top: 15px; cursor: pointer;" onclick="openPlayStoreDetail('${appId}', 'game')">
            <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #c5c5c5;">${game.desc}</p>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                <h4 style="margin: 0 0 8px; font-size: 13px; color: #9aa0a6;">Controls</h4>
                <p style="margin: 0; font-size: 13px; color: #c5c5c5;">${game.controls}</p>
            </div>
        </div>
    `;
}

// Render Home tab
function renderPlayStoreHome() {
    const recent = getRecentPlays();
    const emptyDiv = document.getElementById('ps-home-empty');
    const contentDiv = document.getElementById('ps-home-content');
    const recentSection = document.getElementById('ps-recent-section');
    const recentGrid = document.getElementById('ps-recent-grid');

    if (recent.length === 0) {
        if (emptyDiv) emptyDiv.style.display = 'block';
        if (contentDiv) contentDiv.style.display = 'none';
        return;
    }

    if (emptyDiv) emptyDiv.style.display = 'none';
    if (contentDiv) contentDiv.style.display = 'block';

    // Show featured = most recent
    renderFeaturedGame(recent[0]);

    // Show recent grid
    if (recentSection && recentGrid) {
        recentSection.style.display = 'block';
        recentGrid.innerHTML = recent.slice(1).map(appId => {
            const game = PS_GAMES[appId];
            if (!game) return '';
            return `<div class="ps-store-card" onclick="playStoreSelectGame('${appId}')">
                <div class="card-icon">${game.icon}</div>
                <div class="card-title">${game.name}</div>
                <div class="card-meta">${game.category} • ⭐${game.rating}</div>
            </div>`;
        }).join('');
    }
}

// Render Library tab
function renderPlayStoreLibrary() {
    const grid = document.getElementById('ps-library-grid');
    const empty = document.getElementById('ps-library-empty');
    if (!grid) return;

    const installed = JSON.parse(getAccountData('installed_apps') || localStorage.getItem('echo_installed_apps') || '[]');
    const playTimeData = getPlayTimeData();

    if (installed.length === 0) {
        grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    grid.innerHTML = installed.map(app => {
        const game = PS_GAMES[app.id];
        if (!game) return '';
        const pt = playTimeData[app.id] || { totalSeconds: 0 };
        const timeStr = formatPlayTime(pt.totalSeconds);
        return `<div class="ps-lib-card" onclick="openApp('${app.id}')">
            <div class="lib-icon">${game.icon}</div>
            <div class="lib-title">${game.name}</div>
            <div class="lib-playtime">⏱️ ${timeStr}</div>
        </div>`;
    }).join('');
}

// Render Store tab
function renderPlayStoreStore() {
    const gamesGrid = document.getElementById('ps-store-grid');
    const appsGrid = document.getElementById('ps-apps-store-grid');
    const appsEmpty = document.getElementById('ps-apps-store-empty');
    if (!gamesGrid) return;

    const installed = JSON.parse(getAccountData('installed_apps') || localStorage.getItem('echo_installed_apps') || '[]');
    const installedIds = installed.map(a => a.id);

    // Render games in games grid
    let gamesHtml = '';
    Object.values(PS_GAMES).forEach(game => {
        const isInstalled = installedIds.includes(game.id);
        gamesHtml += `<div class="ps-store-card" data-category="${game.category}" onclick="openPlayStoreDetail('${game.id}', 'game')">
            <div class="card-icon">${game.icon}</div>
            <div class="card-title">${game.name}</div>
            <div class="card-meta">${game.category} • ⭐${game.rating}</div>
            <div class="install-overlay" onclick="event.stopPropagation();">
                ${isInstalled 
                    ? `<button onclick="openApp('${game.id}')">▶ Play</button>`
                    : `<button onclick="installPlayStoreGame('${game.id}', '${game.icon}', '${game.name}')">⬇ Install</button>`
                }
            </div>
        </div>`;
    });
    gamesGrid.innerHTML = gamesHtml;

    // Render apps in separate apps grid
    if (appsGrid) {
        let appsHtml = '';
        Object.values(PS_APPS).forEach(app => {
            const isInstalled = installedIds.includes(app.id);
            appsHtml += `<div class="ps-store-card" data-category="apps" onclick="openPlayStoreDetail('${app.id}', 'app')">
                <div class="card-icon">${app.icon}</div>
                <div class="card-title">${app.name}</div>
                <div class="card-meta">${app.category} • ⭐${app.rating}</div>
                <div class="install-overlay" onclick="event.stopPropagation();">
                    ${isInstalled 
                        ? `<button onclick="openApp('${app.id}')">▶ Open</button>`
                        : `<button onclick="installPlayStoreGame('${app.id}', '${app.icon}', '${app.name}')">⬇ Install</button>`
                    }
                </div>
            </div>`;
        });
        appsGrid.innerHTML = appsHtml;

        // Show/hide empty state
        if (appsEmpty) {
            if (Object.keys(PS_APPS).length === 0) {
                appsEmpty.style.display = 'block';
                appsGrid.style.display = 'none';
            } else {
                appsEmpty.style.display = 'none';
                appsGrid.style.display = 'grid';
            }
        }
    }
}

// Install game from Play Store
function installPlayStoreGame(appId, icon, name) {
    const launcherList = document.getElementById('launcher-list');
    const existingItem = launcherList ? launcherList.querySelector(`[data-app-id="${appId}"]`) : null;

    // Check if it's a pre-installed app
    if (PRE_INSTALLED_APPS.includes(appId)) {
        notificationMgr.showNotification({ title: "Pre-installed", message: `${name} is already built into Echo OS.`, icon: "sparkles" });
        openApp(appId);
        return;
    }

    if (existingItem) {
        notificationMgr.showNotification({ title: "Already Installed", message: `${name} is already in your launcher.`, icon: "sparkles" });
        return;
    }

    // Simulate install progress
    notificationMgr.showNotification({ title: "Installing...", message: `${name} is being installed.`, icon: "sparkles" });

    setTimeout(() => {
        restoreAppToLauncher(appId, icon, name);
        saveAppToStorage(appId, icon, name);

        notificationMgr.showNotification({ title: "Installed!", message: `${name} has been added to your library.`, icon: "sparkles" });

        // Refresh UI
        renderPlayStoreSidebar();
        renderPlayStoreLibrary();
        renderPlayStoreStore();
        renderPlayStoreApps();
    }, 1000);
}

// Uninstall game
function uninstallPlayStoreGame(appId) {
    const game = PS_GAMES[appId];
    if (!game) return;

    if (!confirm(`Remove ${game.name}? All playtime data will be kept.`)) return;

    // Remove from taskbar
    const tbIcon = document.getElementById('taskbar-' + appId);
    if (tbIcon) tbIcon.remove();

    // Remove from launcher
    document.querySelectorAll('.launcher-item').forEach(item => {
        if (item.getAttribute('onclick') === `openApp('${appId}')`) item.remove();
    });

    // Update storage
    let savedApps = JSON.parse(getAccountData('installed_apps') || localStorage.getItem('echo_installed_apps') || '[]');
    savedApps = savedApps.filter(app => app.id !== appId);
    localStorage.setItem('echo_installed_apps', JSON.stringify(savedApps));
    if (currentAccount) saveAccountData('installed_apps', JSON.stringify(savedApps));

    notificationMgr.showNotification({ title: "Uninstalled", message: `${game.name} has been removed.`, icon: "sparkles" });

    // Refresh UI
    renderPlayStoreSidebar();
    renderPlayStoreLibrary();
    renderPlayStoreStore();
    renderPlayStoreHome();
}

// Toggle favorite
function toggleFavorite(appId) {
    let favs = getFavorites();
    if (favs.includes(appId)) {
        favs = favs.filter(id => id !== appId);
        notificationMgr.showNotification({ title: "Removed from Favorites", message: "Game removed from favorites.", icon: "sparkles" });
    } else {
        favs.push(appId);
        notificationMgr.showNotification({ title: "Added to Favorites", message: "Game added to favorites!", icon: "sparkles" });
    }
    saveFavorites(favs);
}

// Tab switching
function renderPlayStoreFavorites() {
    const grid = document.getElementById('ps-favorites-grid');
    const empty = document.getElementById('ps-favorites-empty');
    if (!grid) return;

    const favs = getFavorites();

    if (favs.length === 0) {
        grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    grid.innerHTML = favs.map(appId => {
        const game = PS_GAMES[appId];
        const app = PS_APPS[appId];
        const item = game || app;
        if (!item) return '';
        const isInstalled = isAppInstalled(appId);
        return `<div class="ps-store-card" onclick="openPlayStoreDetail('${appId}', '${game ? 'game' : 'app'}')">
            <div class="card-icon">${item.icon}</div>
            <div class="card-title">${item.name}</div>
            <div class="card-meta">${item.category} • ⭐${item.rating} ${isInstalled ? '✓' : ''}</div>
            <div class="install-overlay" onclick="event.stopPropagation();">
                ${isInstalled 
                    ? `<button onclick="openApp('${appId}')">▶ Play</button>`
                    : `<button onclick="installPlayStoreGame('${appId}', '${item.icon}', '${item.name}')">⬇ Install</button>`
                }
            </div>
        </div>`;
    }).join('');
}

function showPlayStoreTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.ps-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab visibility
    document.querySelectorAll('.ps-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const targetTab = document.getElementById('ps-tab-' + tabName);
    if (targetTab) targetTab.classList.add('active');

    // Refresh content
    if (tabName === 'home') renderPlayStoreHome();
    if (tabName === 'library') renderPlayStoreLibrary();
    if (tabName === 'store') renderPlayStoreStore();
    if (tabName === 'favorites') renderPlayStoreFavorites();
}

// Filter store by category
function filterStoreCategory(category) {
    document.querySelectorAll('.ps-category').forEach(cat => {
        cat.classList.toggle('active', cat.dataset.cat === category || cat.innerText.toLowerCase() === category);
    });

    const gameCards = document.querySelectorAll('#ps-store-grid .ps-store-card');
    const appsGrid = document.getElementById('ps-apps-store-grid');
    const appsSection = appsGrid ? appsGrid.parentElement : null;

    if (category === 'all') {
        // Show everything
        gameCards.forEach(card => card.style.display = 'block');
        if (appsSection) appsSection.style.display = 'block';
        if (appsGrid) appsGrid.style.display = 'grid';
    } else if (category === 'apps') {
        // Show only apps section, hide all games
        gameCards.forEach(card => card.style.display = 'none');
        if (appsSection) appsSection.style.display = 'block';
        if (appsGrid) appsGrid.style.display = 'grid';
    } else {
        // Show only matching games, hide apps section
        gameCards.forEach(card => {
            card.style.display = card.dataset.category === category ? 'block' : 'none';
        });
        if (appsSection) appsSection.style.display = 'none';
    }
}

// Search store games
function filterPlayStoreGames() {
    const query = document.getElementById('ps-store-search').value.toLowerCase();
    const gameCards = document.querySelectorAll('#ps-store-grid .ps-store-card');
    const appCards = document.querySelectorAll('#ps-apps-store-grid .ps-store-card');
    const appsSection = document.getElementById('ps-apps-store-grid')?.parentElement;

    let hasGameMatches = false;
    let hasAppMatches = false;

    gameCards.forEach(card => {
        const title = card.querySelector('.card-title').innerText.toLowerCase();
        const visible = title.includes(query);
        card.style.display = visible ? 'block' : 'none';
        if (visible) hasGameMatches = true;
    });

    appCards.forEach(card => {
        const title = card.querySelector('.card-title').innerText.toLowerCase();
        const visible = title.includes(query);
        card.style.display = visible ? 'block' : 'none';
        if (visible) hasAppMatches = true;
    });

    // Show/hide apps section based on search results
    if (appsSection) {
        appsSection.style.display = hasAppMatches ? 'block' : 'none';
    }
}

// Clear all Play Store data
function clearPlayStoreData() {
    if (!confirm('Clear all Play Store data including playtime and favorites?')) return;

    if (currentAccount) {
        saveAccountData('playtime_data', '{}');
        saveAccountData('recent_plays', '[]');
        saveAccountData('ps_favorites', '[]');
    }

    notificationMgr.showNotification({ title: "Data Cleared", message: "All Play Store data has been reset.", icon: "sparkles" });
    renderPlayStoreHome();
    renderPlayStoreLibrary();
}

// Initialize Play Store when opened


// Also init apps panel when store opens
const originalOpenAppPS_v2 = openApp;
openApp = function(appId) {
    const result = originalOpenAppPS_v2 ? originalOpenAppPS_v2(appId) : undefined;
    if (appId === 'store-window') {
        setTimeout(() => {
            renderPlayStoreApps();
        }, 100);
    }
    return result;
};
const originalOpenAppPS = openApp;
openApp = function(appId) {
    const result = originalOpenAppPS ? originalOpenAppPS(appId) : undefined;

    if (appId === 'store-window') {
        setTimeout(() => {
            // Set username
            const usernameEl = document.getElementById('ps-username');
            if (usernameEl && currentAccount) {
                usernameEl.innerText = currentAccount.name || currentAccount.username;
            } else if (usernameEl) {
                usernameEl.innerText = localStorage.getItem('echo_username') || 'User';
            }

            renderPlayStoreSidebar();
            renderPlayStoreHome();
        }, 100);
    }

    return result;
};

// ===== ECHO OS PLAY STORE CATEGORIES =====

let psCurrentCategory = 'games';

function switchPlayStoreCategory(category) {
    psCurrentCategory = category;
    const gamesPanel = document.getElementById('ps-games-panel');
    const appsPanel = document.getElementById('ps-apps-panel');
    const gamesBtn = document.getElementById('ps-cat-games');
    const appsBtn = document.getElementById('ps-cat-apps');

    if (category === 'apps') {
        gamesPanel.classList.remove('active');
        gamesPanel.classList.add('slide-left');
        appsPanel.style.transform = 'translateX(0)';
        appsBtn.classList.add('active');
        gamesBtn.classList.remove('active');
        renderPlayStoreApps();
    } else {
        appsPanel.style.transform = 'translateX(100%)';
        gamesPanel.classList.remove('slide-left');
        gamesPanel.classList.add('active');
        gamesBtn.classList.add('active');
        appsBtn.classList.remove('active');
    }

    // Update sidebar list
    renderPlayStoreSidebar();
}

function renderPlayStoreApps() {
    const grid = document.getElementById('ps-apps-grid');
    if (!grid) return;

    const installed = JSON.parse(getAccountData('installed_apps') || localStorage.getItem('echo_installed_apps') || '[]');
    const installedIds = installed.map(a => a.id);

    let html = '';
    Object.values(PS_APPS).forEach(app => {
        const isInstalled = installedIds.includes(app.id);
        html += `<div class="ps-app-card" onclick="openPlayStoreDetail('${app.id}', 'app')">
            <div class="card-icon">${app.icon}</div>
            <div class="card-title">${app.name}</div>
            <div class="card-meta">${app.category} ${isInstalled ? '✓ Installed' : ''}</div>
        </div>`;
    });

    grid.innerHTML = html;
}

function openPlayStoreDetail(itemId, type) {
    const overlay = document.getElementById('ps-detail-overlay');
    const content = document.getElementById('ps-detail-content');
    if (!overlay || !content) return;

    const isGame = type === 'game';
    const item = isGame ? PS_GAMES[itemId] : PS_APPS[itemId];
    if (!item) return;

    const isInstalled = isAppInstalled(itemId);

    // Get playtime data
    const playTimeData = getPlayTimeData();
    const pt = playTimeData[itemId] || { totalSeconds: 0, lastOpened: null, sessions: 0 };
    const timeStr = formatPlayTime(pt.totalSeconds);
    const lastPlayed = pt.lastOpened ? new Date(pt.lastOpened).toLocaleDateString() : 'Never';

    content.innerHTML = `
        <div class="ps-detail-banner">
            <img src="${item.banner}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #3a7bd5, #00d2ff)';">
        </div>
        <div style="display: flex; align-items: flex-start; gap: 20px; margin-bottom: 20px;">
            <div class="ps-detail-icon">${item.icon}</div>
            <div style="flex: 1;">
                <h2 class="ps-detail-title">${item.name}</h2>
                <div class="ps-detail-meta">
                    <span>⭐ ${item.rating}</span>
                    <span>${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                    <span>${isGame ? '🎮 Game' : '📱 App'}</span>
                </div>
                <div class="ps-detail-actions">
                    ${isInstalled 
                        ? `<button class="ps-detail-btn play" onclick="openApp('${itemId}')">▶ Play</button>`
                        : `<button class="ps-detail-btn install" onclick="installPlayStoreItem('${itemId}', '${item.icon}', '${item.name}', '${type}')">⬇ Install</button>`
                    }
                    <button class="ps-detail-btn install" onclick="toggleFavorite('${itemId}')">⭐ Favorite</button>
                </div>
            </div>
        </div>
        <div class="ps-detail-stats">
            <div class="ps-detail-stat">
                <div class="stat-value">⏱️ ${timeStr}</div>
                <div class="stat-label">Playtime</div>
            </div>
            <div class="ps-detail-stat">
                <div class="stat-value">🔥 ${pt.sessions}</div>
                <div class="stat-label">Sessions</div>
            </div>
            <div class="ps-detail-stat">
                <div class="stat-value">📅 ${lastPlayed}</div>
                <div class="stat-label">Last Played</div>
            </div>
        </div>
        <div class="ps-detail-desc">${item.desc}</div>
        <div class="ps-detail-controls">
            <h4>Controls</h4>
            <p>${item.controls}</p>
        </div>
    `;

    overlay.style.transform = 'translateX(0)';
}

function closePlayStoreDetail() {
    const overlay = document.getElementById('ps-detail-overlay');
    if (overlay) overlay.style.transform = 'translateX(100%)';
}

function installPlayStoreItem(appId, icon, name, type) {
    const launcherList = document.getElementById('launcher-list');
    const existingItem = launcherList ? launcherList.querySelector(`[data-app-id="${appId}"]`) : null;

    // Check if it's a pre-installed app
    if (PRE_INSTALLED_APPS.includes(appId)) {
        notificationMgr.showNotification({ title: "Pre-installed", message: `${name} is already built into Echo OS.`, icon: "sparkles" });
        openApp(appId);
        // Refresh detail view if open
        const overlay = document.getElementById('ps-detail-overlay');
        if (overlay && overlay.style.transform === 'translateX(0px)') {
            openPlayStoreDetail(appId, type);
        }
        return;
    }

    if (existingItem) {
        notificationMgr.showNotification({ title: "Already Installed", message: `${name} is already in your launcher.`, icon: "sparkles" });
        return;
    }

    notificationMgr.showNotification({ title: "Installing...", message: `${name} is being installed.`, icon: "sparkles" });

    setTimeout(() => {
        restoreAppToLauncher(appId, icon, name);
        saveAppToStorage(appId, icon, name);

        notificationMgr.showNotification({ title: "Installed!", message: `${name} has been added to your library.`, icon: "sparkles" });

        // Refresh UI
        renderPlayStoreSidebar();
        renderPlayStoreLibrary();
        renderPlayStoreStore();
        renderPlayStoreApps();

        // If detail view is open, refresh it
        const overlay = document.getElementById('ps-detail-overlay');
        if (overlay && overlay.style.transform === 'translateX(0px)') {
            openPlayStoreDetail(appId, type);
        }
    }, 1000);
}

// Override renderPlayStoreStore to make cards clickable for detail
const originalRenderPlayStoreStore = renderPlayStoreStore;
renderPlayStoreStore = function() {
    const grid = document.getElementById('ps-store-grid');
    if (!grid) return;

    const installed = JSON.parse(getAccountData('installed_apps') || localStorage.getItem('echo_installed_apps') || '[]');
    const installedIds = installed.map(a => a.id);

    let html = '';
    Object.values(PS_GAMES).forEach(game => {
        const isInstalled = installedIds.includes(game.id);
        html += `<div class="ps-store-card" data-category="${game.category}" onclick="openPlayStoreDetail('${game.id}', 'game')">
            <div class="card-icon">${game.icon}</div>
            <div class="card-title">${game.name}</div>
            <div class="card-meta">${game.category} • ⭐${game.rating}</div>
            <div class="install-overlay">
                ${isInstalled 
                    ? `<button onclick="event.stopPropagation(); openApp('${game.id}')">▶ Play</button>`
                    : `<button onclick="event.stopPropagation(); installPlayStoreGame('${game.id}', '${game.icon}', '${game.name}')">⬇ Install</button>`
                }
            </div>
        </div>`;
    });

    grid.innerHTML = html;

    // Render apps in separate apps grid
    const appsGrid = document.getElementById('ps-apps-store-grid');
    if (appsGrid) {
        let appsHtml = '';
        Object.values(PS_APPS).forEach(app => {
            const isInstalled = installedIds.includes(app.id);
            appsHtml += `<div class="ps-store-card" data-category="apps" onclick="openPlayStoreDetail('${app.id}', 'app')">
                <div class="card-icon">${app.icon}</div>
                <div class="card-title">${app.name}</div>
                <div class="card-meta">${app.category} • ⭐${app.rating}</div>
                <div class="install-overlay">
                    ${isInstalled 
                        ? `<button onclick="event.stopPropagation(); openApp('${app.id}')">▶ Open</button>`
                        : `<button onclick="event.stopPropagation(); installPlayStoreGame('${app.id}', '${app.icon}', '${app.name}')">⬇ Install</button>`
                    }
                </div>
            </div>`;
        });
        appsGrid.innerHTML = appsHtml;
    }
};

// Override renderPlayStoreHome to make recent games clickable
const originalRenderPlayStoreHome = renderPlayStoreHome;
renderPlayStoreHome = function() {
    const recent = getRecentPlays();
    const emptyDiv = document.getElementById('ps-home-empty');
    const contentDiv = document.getElementById('ps-home-content');
    const recentSection = document.getElementById('ps-recent-section');
    const recentGrid = document.getElementById('ps-recent-grid');

    if (recent.length === 0) {
        if (emptyDiv) emptyDiv.style.display = 'block';
        if (contentDiv) contentDiv.style.display = 'none';
        return;
    }

    if (emptyDiv) emptyDiv.style.display = 'none';
    if (contentDiv) contentDiv.style.display = 'block';

    renderFeaturedGame(recent[0]);

    if (recentSection && recentGrid) {
        recentSection.style.display = 'block';
        recentGrid.innerHTML = recent.slice(1).map(appId => {
            const game = PS_GAMES[appId];
            const app = PS_APPS[appId];
            const item = game || app;
            if (!item) return '';
            return `<div class="ps-store-card" onclick="openPlayStoreDetail('${appId}', '${game ? 'game' : 'app'}')">
                <div class="card-icon">${item.icon}</div>
                <div class="card-title">${item.name}</div>
                <div class="card-meta">${item.category} • ⭐${item.rating}</div>
            </div>`;
        }).join('');
    }
};

// Override renderPlayStoreLibrary to make cards clickable
const originalRenderPlayStoreLibrary = renderPlayStoreLibrary;
renderPlayStoreLibrary = function() {
    const grid = document.getElementById('ps-library-grid');
    const empty = document.getElementById('ps-library-empty');
    if (!grid) return;

    // Combine installed apps with pre-installed apps
    let installed = JSON.parse(getAccountData('installed_apps') || localStorage.getItem('echo_installed_apps') || '[]');

    // Add pre-installed apps that aren't already in the list
    PRE_INSTALLED_APPS.forEach(appId => {
        const game = PS_GAMES[appId];
        const app = PS_APPS[appId];
        const item = game || app;
        if (item && !installed.find(a => a.id === appId)) {
            installed.push({ id: appId, icon: item.icon, name: item.name, pinned: true });
        }
    });

    const playTimeData = getPlayTimeData();

    if (installed.length === 0) {
        grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    grid.innerHTML = installed.map(app => {
        const game = PS_GAMES[app.id];
        const appData = PS_APPS[app.id];
        const item = game || appData;
        if (!item) return '';
        const pt = playTimeData[app.id] || { totalSeconds: 0 };
        const timeStr = formatPlayTime(pt.totalSeconds);
        return `<div class="ps-lib-card" onclick="openPlayStoreDetail('${app.id}', '${game ? 'game' : 'app'}')">
            <div class="lib-icon">${item.icon}</div>
            <div class="lib-title">${item.name}</div>
            <div class="lib-playtime">⏱️ ${timeStr}</div>
        </div>`;
    }).join('');
};

// ===== ECHO OS SERVER WARNING =====
function initServerWarningBanner() {
    if (sessionStorage.getItem('echo_server_warning_shown')) return;

    const banner = document.getElementById('server-warning-banner');
    if (!banner) return;

    banner.style.display = 'flex';
    banner.style.opacity = '1';
    banner.style.transform = 'translateY(0)';

    setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(-100%)';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 1000);
        sessionStorage.setItem('echo_server_warning_shown', 'true');
    }, 10000);
}



// ===== CREATOR SCREEN LOGIC =====
function showCreatorScreen() {
    const creatorScreen = document.getElementById('creator-screen');
    const creatorText = document.getElementById('creator-text');
    const desktop = document.getElementById('desktop');

    if (!creatorScreen) return;

    creatorScreen.style.display = 'flex';
    creatorScreen.style.opacity = '1';

    // Fade in text
    setTimeout(() => {
        creatorText.style.opacity = '1';
    }, 100);

    // Fade out text after 2.5 seconds
    setTimeout(() => {
        creatorText.style.opacity = '0';
    }, 2500);

    // Fade out screen and show desktop
    setTimeout(() => {
        creatorScreen.style.transition = 'opacity 1s ease-out';
        creatorScreen.style.opacity = '0';

        setTimeout(() => {
            creatorScreen.style.display = 'none';
            // Now show desktop with fade in
            if (desktop) {
                desktop.style.opacity = '0';
                desktop.style.transition = 'opacity 1s ease-in';
                setTimeout(() => {
                    desktop.style.opacity = '1';
                }, 100);
            }
            // Show update modal after desktop fades in
            setTimeout(() => {
                showUpdateModal();
                triggerInitialNotifications();
            }, 1000);
        }, 1000);
    }, 3500);
}

// ===== ECHO OS UPDATE MODAL =====
const originalShowUpdateModal = showUpdateModal;
showUpdateModal = function() {
    const modal = document.getElementById('update-modal');
    if (!modal) return;

    modal.style.display = 'flex';

    const hasSeenModal = localStorage.getItem('echo_update_seen');
    const continueBtn = document.getElementById('update-continue-btn');

    if (hasSeenModal) {
        continueBtn.disabled = false;
        continueBtn.classList.add('active');
        continueBtn.innerText = 'Continue';
    } else {
        continueBtn.disabled = true;
        continueBtn.classList.remove('active');

        let countdown = 5;
        continueBtn.innerText = `Continue (${countdown})`;

        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                continueBtn.innerText = `Continue (${countdown})`;
            } else {
                clearInterval(timer);
                continueBtn.innerText = 'Continue';
                continueBtn.disabled = false;
                continueBtn.classList.add('active');
                localStorage.setItem('echo_update_seen', 'true');
            }
        }, 1000);
    }
};


// ===== END ECHO OS PLAY STORE =====

// --- 1. Notification System ---
const notificationMgr = {
    showNotification: function({title, message, icon}) {
        const iconEmoji = icon === 'shield-alert' ? '🛡️' : icon === 'sparkles' ? '✨' : '🔔';

        const container = document.getElementById('notification-toast-container');
        if (!container) return;

        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.innerHTML = `<div class="notif-icon">${iconEmoji}</div><div class="notif-content"><strong>${title}</strong><p>${message}</p></div>`;
        container.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 7000);

        const qsList = document.getElementById('qs-notif-list');
        if (qsList) {
            const noNotifs = qsList.querySelector('.qs-no-notifs');
            if (noNotifs) noNotifs.remove();

            const qsItem = document.createElement('div');
            qsItem.className = 'qs-notif-item';
            qsItem.innerHTML = `<div class="notif-icon">${iconEmoji}</div><div class="notif-content"><strong>${title}</strong><p>${message}</p></div><button class="qs-notif-close" onclick="this.parentElement.remove(); checkEmptyNotifs();">✕</button>`;
            qsList.prepend(qsItem);
        }
    }
};

window.notificationMgr = notificationMgr;

function checkEmptyNotifs() {
    const qsList = document.getElementById('qs-notif-list');
    if (qsList && qsList.children.length === 0) {
        qsList.innerHTML = '<div class="qs-no-notifs">No new notifications</div>';
    }
}

function triggerInitialNotifications() {
    if (sessionStorage.getItem('echo_notifs_shown')) return;
    sessionStorage.setItem('echo_notifs_shown', 'true');

    setTimeout(() => {
        notificationMgr.showNotification({
            title: "System Announcement",
            message: `Safety is coming to Echo OS. You will be flagged if you use swear words or nasty usernames. Coming on March 10th 2026.`,
            icon: "shield-alert"
        });
    }, 2500);
}

// --- Update V1.8 Modal Functions ---
function showUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (!modal) return;

    modal.style.display = 'flex';


    // Check if user has seen this modal before
    const hasSeenModal = localStorage.getItem('echo_update_seen');
    const continueBtn = document.getElementById('update-continue-btn');

    if (hasSeenModal) {
        // User has seen it - button is immediately clickable (blue)
        continueBtn.disabled = false;
        continueBtn.classList.add('active');
        continueBtn.innerText = 'Continue';
    } else {
        // First time - countdown from 5
        continueBtn.disabled = true;
        continueBtn.classList.remove('active');

        let countdown = 5;
        continueBtn.innerText = `Continue (${countdown})`;

        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                continueBtn.innerText = `Continue (${countdown})`;
            } else {
                clearInterval(timer);
                continueBtn.innerText = 'Continue';
                continueBtn.disabled = false;
                continueBtn.classList.add('active');
                localStorage.setItem('echo_update_seen', 'true');
            }
        }, 1000);
    }
}

function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    const btn = document.getElementById('update-continue-btn');

    // If button is still disabled (countdown running), don't close
    if (btn && btn.disabled) return;

    if (modal) {
        modal.style.display = 'none';
    }

    // Clear countdown if running
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
}



// --- Calendar System ---
let currentCalendarDate = new Date();

function updateCalendarWidget() {
    const now = new Date();
    const dayEl = document.getElementById('calendar-day');
    const dateEl = document.getElementById('calendar-date');

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (dayEl) dayEl.innerText = now.getDate();
    if (dateEl) dateEl.innerText = months[now.getMonth()];
}

function toggleCalendar() {
    const modal = document.getElementById('calendar-modal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        renderCalendar();
    }
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

    const headerEl = document.getElementById('calendar-month-year');
    if (headerEl) headerEl.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const daysContainer = document.getElementById('calendar-days');
    if (!daysContainer) return;

    daysContainer.innerHTML = '';

    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerText = daysInPrevMonth - i;
        daysContainer.appendChild(day);
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            day.classList.add('today');
        }
        day.innerText = i;
        daysContainer.appendChild(day);
    }

    const remainingCells = 42 - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerText = i;
        daysContainer.appendChild(day);
    }
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

// --- DESK UI FUNCTIONS ---
let currentDesk = 1;
let deskCount = 1;
const maxDesks = 8;
let deskWindows = {}; // Store which windows are on which desk

function toggleDeskSwitcher() {
    const switcher = document.getElementById('desk-switcher');
    const quickSettings = document.getElementById('quick-settings');
    const launcherMenu = document.getElementById('launcher-menu');

    if (switcher.style.display === 'none') {
        switcher.style.display = 'block';
        if (quickSettings) quickSettings.style.display = 'none';
        if (launcherMenu) launcherMenu.style.display = 'none';
        updateDeskPreviews();
    } else {
        switcher.style.display = 'none';
    }
}

function switchToPrevDesk() {
    const prevDesk = currentDesk > 1 ? currentDesk - 1 : deskCount;
    switchToDesk(prevDesk);
}

function switchToNextDesk() {
    const nextDesk = currentDesk < deskCount ? currentDesk + 1 : 1;
    switchToDesk(nextDesk);
}

function addNewDesk() {
    if (deskCount >= maxDesks) {
        notificationMgr.showNotification({
            title: "Maximum Desks Reached",
            message: "You can only have up to 8 desks.",
            icon: "shield-alert"
        });
        return;
    }

    deskCount++;
    const deskList = document.getElementById('desk-list');
    const newDeskItem = document.createElement('div');
    newDeskItem.className = 'desk-item';
    newDeskItem.setAttribute('data-desk', deskCount);
    newDeskItem.onclick = () => switchToDesk(deskCount);
    newDeskItem.innerHTML = `
        <div class="desk-preview" id="desk-preview-${deskCount}"></div>
        <span class="desk-name">Desk ${deskCount}</span>
        <button class="desk-close" onclick="event.stopPropagation(); closeDesk(${deskCount})">×</button>
    `;
    deskList.appendChild(newDeskItem);

    // Initialize empty window list for new desk
    deskWindows[deskCount] = [];

    notificationMgr.showNotification({
        title: "New Desk Created",
        message: `Desk ${deskCount} has been created.`,
        icon: "sparkles"
    });

    // Switch to the new desk
    switchToDesk(deskCount);
}

function switchToDesk(deskNum) {
    if (deskNum === currentDesk) {
        document.getElementById('desk-switcher').style.display = 'none';
        return;
    }

    // Save current windows to current desk
    const currentWindows = [];
    document.querySelectorAll('.window').forEach(win => {
        if (win.style.display === 'flex' && !win.classList.contains('minimized')) {
            currentWindows.push(win.id);
        }
    });
    deskWindows[currentDesk] = currentWindows;

    // Hide all windows from current desk
    document.querySelectorAll('.window').forEach(win => {
        win.classList.add('desk-hidden');
        win.style.display = 'none';
    });

    // Show windows from target desk
    const targetWindows = deskWindows[deskNum] || [];
    targetWindows.forEach(winId => {
        const win = document.getElementById(winId);
        if (win) {
            win.classList.remove('desk-hidden');
            win.style.display = 'flex';
        }
    });

    // Update UI
    currentDesk = deskNum;
    document.getElementById('current-desk-name').innerText = `Desk ${deskNum}`;

    // Update active state in switcher
    document.querySelectorAll('.desk-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.getAttribute('data-desk')) === deskNum) {
            item.classList.add('active');
        }
    });

    document.getElementById('desk-switcher').style.display = 'none';

    notificationMgr.showNotification({
        title: `Switched to Desk ${deskNum}`,
        message: "Use keyboard shortcuts to switch desks quickly.",
        icon: "sparkles"
    });
}

function closeDesk(deskNum) {
    if (deskCount <= 1) {
        notificationMgr.showNotification({
            title: "Cannot Close Desk",
            message: "You must have at least one desk.",
            icon: "shield-alert"
        });
        return;
    }

    // Close all windows on this desk
    const windowsToClose = deskWindows[deskNum] || [];
    windowsToClose.forEach(winId => {
        const win = document.getElementById(winId);
        if (win) {
            win.style.display = 'none';
            win.classList.remove('desk-hidden');
        }
    });

    // Remove desk item
    const deskItem = document.querySelector(`.desk-item[data-desk="${deskNum}"]`);
    if (deskItem) deskItem.remove();

    // Update desk count
    deskCount--;

    // Renumber remaining desks
    const deskItems = document.querySelectorAll('.desk-item');
    deskItems.forEach((item, index) => {
        const newNum = index + 1;
        item.setAttribute('data-desk', newNum);
        item.querySelector('.desk-name').innerText = `Desk ${newNum}`;
        item.querySelector('.desk-close').setAttribute('onclick', `event.stopPropagation(); closeDesk(${newNum})`);
        item.onclick = () => switchToDesk(newNum);
    });

    // Switch to desk 1 if we closed the current desk
    if (currentDesk === deskNum) {
        switchToDesk(1);
    } else if (currentDesk > deskNum) {
        currentDesk--;
        document.getElementById('current-desk-name').innerText = `Desk ${currentDesk}`;
    }

    notificationMgr.showNotification({
        title: "Desk Closed",
        message: `Desk ${deskNum} has been closed.`,
        icon: "sparkles"
    });
}

function updateDeskPreviews() {
    // Update preview thumbnails for each desk
    document.querySelectorAll('.desk-item').forEach(item => {
        const deskNum = parseInt(item.getAttribute('data-desk'));
        const preview = item.querySelector('.desk-preview');
        const windows = deskWindows[deskNum] || [];

        // Show window count indicator
        if (windows.length > 0) {
            preview.innerHTML = `<span style="position: absolute; bottom: 2px; right: 2px; background: var(--sys-primary); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px;">${windows.length}</span>`;
        } else {
            preview.innerHTML = '';
        }
    });
}

// Keyboard shortcuts for desk switching
document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + Shift + Arrow Up/Down to switch desks
    if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevDesk = currentDesk > 1 ? currentDesk - 1 : deskCount;
            switchToDesk(prevDesk);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextDesk = currentDesk < deskCount ? currentDesk + 1 : 1;
            switchToDesk(nextDesk);
        }
    }
});

// Track window openings for desk management
const originalOpenApp = openApp;
openApp = function(appId) {
    const win = document.getElementById(appId);
    if (win) {
        win.classList.remove('desk-hidden');

        // Add to current desk's window list
        if (!deskWindows[currentDesk]) deskWindows[currentDesk] = [];
        if (!deskWindows[currentDesk].includes(appId)) {
            deskWindows[currentDesk].push(appId);
        }
    }
    return originalOpenApp ? originalOpenApp(appId) : undefined;
};


// --- Continue Where You Left Off ---
function trackActiveApps() {
    const activeWindows = [];
    document.querySelectorAll('.window').forEach(win => {
        if (win.style.display === 'flex' && !win.classList.contains('minimized')) {
            const appId = win.id;
            const header = win.querySelector('.window-title');
            const name = header ? header.innerText.trim() : appId;
            const iconMap = {
                'chrome-window': '🌐', 'store-window': '🛍️', 'settings-window': '⚙️',
                'wordpad-window': '📝', 'calc-window': '🧮', 'files-window': '📁',
                'discord-window': '💬', 'echoflix-window': '🎬', 'echomusic-window': '🎵',
                'infinitecraft-window': '⚗️', 'paperio-window': '📄', 'parkingfury-window': '🅿️',
                'granny3-window': '👵', 'fridaynightfunk-window': '🎤', 'geometrydash-window': '📐',
                'smashcarts-window': '🏎️', 'fnae-window': '🐻', 'eaglercraft-window': '⛏️',
                'granny-window': '👵', 'escaperoad-window': '🚗', 'escaperoad2-window': '🏎️',
                'solarsmash-window': '🪐', 'brainrot-window': '🧠', 'ragdollhit-window': '🥊',
                'ragdollarchers-window': '🏹', '99nights-window': '🌲', 'rocketleague-window': '⚽',
                'bballrandom-window': '🏀', 'bballbros-window': '🏀', 'bballlegend-window': '🏀',
                'roblox-window': '🟥', 'gtavice-window': '🚔', 'pixelfruits-window': '🍎',
                'aceattorney-window': '⚖️', 'callofduty-window': '🔫', 'stateio-window': '🗺️',
                'undertaleyellow-window': '💛', 'yanderesim-window': '🔪', 'robloxanimator-window': '🎬',
                'doodlejump-window': '🐰', 'drivingsimulator-window': '🚗', 'effingzombies-window': '🧟',
                'linkcreator-window': '🔗',
                'granny2-window': '👵',
                'pokemon-window': '⚡',
                '1v1lol-window': '🔫',
                'echochat-window': '💬'
            };
            activeWindows.push({ id: appId, name: name, icon: iconMap[appId] || '📦' });
        }
    });
    sessionStorage.setItem('echo_active_apps', JSON.stringify(activeWindows));
}

function restoreActiveApps() {
    const recentContainer = document.getElementById('launcher-recent');
    const recentList = document.getElementById('launcher-recent-list');
    if (!recentContainer || !recentList) return;

    const saved = sessionStorage.getItem('echo_active_apps');
    if (!saved || saved === '[]') {
        recentContainer.style.display = 'none';
        return;
    }

    const apps = JSON.parse(saved);
    if (apps.length === 0) {
        recentContainer.style.display = 'none';
        return;
    }

    recentContainer.style.display = 'block';
    recentList.innerHTML = '';

    apps.forEach(app => {
        const item = document.createElement('div');
        item.className = 'launcher-item';
        item.style = 'padding: 10px; width: 80px; min-width: 80px;';
        item.onclick = () => openApp(app.id);
        item.innerHTML = `<div class="l-icon" style="font-size: 24px; width: 40px; height: 40px;">${app.icon}</div><span class="l-text" style="font-size: 10px;">${app.name}</span>`;
        recentList.appendChild(item);
    });
}

// Track active apps when window state changes
const originalOpenAppTrack = openApp;
openApp = function(appId) {
    const result = originalOpenAppTrack ? originalOpenAppTrack(appId) : undefined;
    trackActiveApps();
    return result;
};

const originalCloseAppTrack = closeApp;
closeApp = function(appId) {
    const result = originalCloseAppTrack ? originalCloseAppTrack(appId) : undefined;
    trackActiveApps();
    return result;
};

const originalMinimizeAppTrack = minimizeApp;
minimizeApp = function(appId) {
    const result = originalMinimizeAppTrack ? originalMinimizeAppTrack(appId) : undefined;
    trackActiveApps();
    return result;
};



// --- Battery Saver ---
let batterySaverEnabled = localStorage.getItem('echo_battery_saver') === 'true';

function toggleBatterySaver() {
    batterySaverEnabled = !batterySaverEnabled;
    localStorage.setItem('echo_battery_saver', batterySaverEnabled);

    const btn = document.getElementById('battery-saver-btn');
    if (btn) {
        if (batterySaverEnabled) {
            btn.classList.add('active');
            btn.querySelector('span').innerText = 'Battery Saver On';
        } else {
            btn.classList.remove('active');
            btn.querySelector('span').innerText = 'Battery Saver';
        }
    }

    if (batterySaverEnabled) {
        activateBatterySaver();
        notificationMgr.showNotification({
            title: "Battery Saver On",
            message: "Data saver mode activated. Usage stats logged.",
            icon: "shield-alert"
        });
    } else {
        deactivateBatterySaver();
        notificationMgr.showNotification({
            title: "Battery Saver Off",
            message: "Normal mode restored.",
            icon: "sparkles"
        });
    }
}

function activateBatterySaver() {
    document.body.style.setProperty('--sys-blur', 'blur(0px)');
    const desktop = document.getElementById('desktop');
    if (desktop) desktop.style.filter = 'brightness(0.8)';

    const timestamp = new Date().toISOString();
    const logEntry = `[Battery Saver Activated] ${timestamp}
`;
    let batteryLog = localStorage.getItem('echo_battery_log') || '';
    batteryLog = logEntry + batteryLog;
    localStorage.setItem('echo_battery_log', batteryLog);

    saveBatteryLogToFile();
}

function deactivateBatterySaver() {
    document.body.style.setProperty('--sys-blur', 'blur(24px)');
    const desktop = document.getElementById('desktop');
    if (desktop) desktop.style.filter = '';
}

function saveBatteryLogToFile() {
    const batteryLog = localStorage.getItem('echo_battery_log') || '';
    let files = JSON.parse(localStorage.getItem('echo_files') || '{}');
    files['battery_saver_log.txt'] = `<pre style="font-family: monospace; white-space: pre-wrap; font-size: 12px; line-height: 1.5;">${batteryLog}</pre>`;
    localStorage.setItem('echo_files', JSON.stringify(files));
}

function initBatterySaver() {
    const btn = document.getElementById('battery-saver-btn');
    if (btn && batterySaverEnabled) {
        btn.classList.add('active');
        btn.querySelector('span').innerText = 'Battery Saver On';
        activateBatterySaver();
    }
}



// --- Link Creator ---
function generateLink() {
    const urlInput = document.getElementById('lc-url');
    const titleInput = document.getElementById('lc-title');
    const resultDiv = document.getElementById('lc-result');
    const outputInput = document.getElementById('lc-output');

    let url = urlInput.value.trim();
    const title = titleInput.value.trim() || 'Echo Link';

    if (!url) {
        notificationMgr.showNotification({
            title: "Error",
            message: "Please enter a URL",
            icon: "shield-alert"
        });
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const encoded = btoa(JSON.stringify({ url, title }));
    const generated = window.location.origin + window.location.pathname + '?lc=' + encoded;

    outputInput.value = generated;
    resultDiv.style.display = 'block';

    saveLinkToHistory(url, title, generated);
}

function copyLink() {
    const outputInput = document.getElementById('lc-output');
    outputInput.select();
    document.execCommand('copy');
    notificationMgr.showNotification({
        title: "Copied!",
        message: "Link copied to clipboard",
        icon: "sparkles"
    });
}

function saveLinkToHistory(url, title, generated) {
    let history = JSON.parse(localStorage.getItem('echo_link_history') || '[]');
    history.unshift({ url, title, generated, date: new Date().toLocaleString() });
    history = history.slice(0, 10);
    localStorage.setItem('echo_link_history', JSON.stringify(history));
    renderLinkHistory();
}

function renderLinkHistory() {
    const list = document.getElementById('lc-history-list');
    if (!list) return;
    const history = JSON.parse(localStorage.getItem('echo_link_history') || '[]');
    list.innerHTML = '';
    history.forEach(item => {
        const entry = document.createElement('div');
        entry.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--sys-border); background: rgba(128,128,128,0.05);';
        entry.innerHTML = `<span style="font-size: 12px; color: var(--sys-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 350px;">${item.title}</span><span style="font-size: 10px; color: var(--sys-text-muted);">${item.date}</span>`;
        list.appendChild(entry);
    });
}

function initLinkCreator() {
    renderLinkHistory();
}





// ===== ECHO CHAT DM NOTIFICATION SYSTEM =====
// Listen for messages from Echo Chat iframe
window.addEventListener('message', function(event) {
    // Handle Echo Chat DM notifications
    if (event.data && event.data.type === 'echo-chat-dm') {
        const data = event.data;
        showChatNotification(data);
    }
});

function showChatNotification(data) {
    const { username, profile, message, senderId } = data;

    // Create notification
    notificationMgr.showNotification({
        title: username,
        message: message,
        icon: "chat"
    });

    // Also add to quick settings notification list with avatar
    const qsList = document.getElementById('qs-notif-list');
    if (qsList) {
        const noNotifs = qsList.querySelector('.qs-no-notifs');
        if (noNotifs) noNotifs.remove();

        const qsItem = document.createElement('div');
        qsItem.className = 'qs-notif-item';
        qsItem.style.cursor = 'pointer';
        qsItem.onclick = function() {
            openApp('echochat-window');
            // Tell Echo Chat to open the specific conversation
            const chatFrame = document.querySelector('#echochat-window iframe');
            if (chatFrame && chatFrame.contentWindow) {
                chatFrame.contentWindow.postMessage({
                    type: 'echo-os-open-chat',
                    senderId: senderId
                }, '*');
            }
            qsItem.remove();
            checkEmptyNotifs();
        };

        qsItem.innerHTML = `
            <div class="chat-notif-avatar">${profile || '👤'}</div>
            <div class="chat-notif-content">
                <div class="chat-notif-username">${username}</div>
                <div class="chat-notif-message">${message}</div>
            </div>
            <button class="qs-notif-close" onclick="event.stopPropagation(); this.parentElement.remove(); checkEmptyNotifs();">✕</button>
        `;
        qsList.prepend(qsItem);
    }

    // Make notification clickable to open chat
    const notifContainer = document.getElementById('notification-toast-container');
    if (notifContainer && notifContainer.lastChild) {
        notifContainer.lastChild.style.cursor = 'pointer';
        notifContainer.lastChild.onclick = function() {
            openApp('echochat-window');
            const chatFrame = document.querySelector('#echochat-window iframe');
            if (chatFrame && chatFrame.contentWindow) {
                chatFrame.contentWindow.postMessage({
                    type: 'echo-os-open-chat',
                    senderId: senderId
                }, '*');
            }
            notifContainer.lastChild.remove();
        };
    }
}

// --- Media Control System ---
let mediaState = {
    isPlaying: false,
    track: 'Not Playing',
    artist: 'Echo Music',
    artwork: '',
    currentTime: 0,
    duration: 0,
    progress: 0
};

let mediaModalOpen = false;
let mediaUpdateInterval = null;

// Listen for messages from Echo Music iframe
window.addEventListener('message', function(event) {
    // Accept messages from any origin (since Echo Music is local)
    if (event.data && event.data.type === 'echo-music-update') {
        const data = event.data;
        mediaState.isPlaying = data.isPlaying || false;
        mediaState.track = data.track || 'Not Playing';
        mediaState.artist = data.artist || 'Echo Music';
        mediaState.artwork = data.artwork || '';
        mediaState.currentTime = data.currentTime || 0;
        mediaState.duration = data.duration || 0;
        mediaState.progress = data.progress || 0;

        updateMediaControlUI();
    }
});

function updateMediaControlUI() {
    const btn = document.getElementById('media-control-btn');
    const modal = document.getElementById('media-control-modal');

    // Show/hide button based on whether music is loaded
    if (mediaState.track !== 'Not Playing' && mediaState.track !== 'Ready for Launch') {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
        if (mediaModalOpen) toggleMediaModal();
    }

    // Update modal content
    document.getElementById('media-modal-track').innerText = mediaState.track;
    document.getElementById('media-modal-artist').innerText = mediaState.artist;

    const artEl = document.getElementById('media-modal-art');
    if (mediaState.artwork) {
        artEl.style.backgroundImage = `url(${mediaState.artwork})`;
        artEl.style.backgroundSize = 'cover';
    } else {
        artEl.style.backgroundImage = '';
        artEl.style.background = 'linear-gradient(135deg, #3a7bd5, #00d2ff)';
    }

    // Update progress
    document.getElementById('media-progress-fill').style.width = mediaState.progress + '%';
    document.getElementById('media-time-cur').innerText = formatMediaTime(mediaState.currentTime);
    document.getElementById('media-time-dur').innerText = formatMediaTime(mediaState.duration);

    // Update play/pause button
    document.getElementById('media-play-btn').innerText = mediaState.isPlaying ? '⏸' : '▶';

    // Update taskbar button icon
    btn.querySelector('.media-icon').innerText = mediaState.isPlaying ? '🔊' : '🎵';
}

function toggleMediaModal() {
    const modal = document.getElementById('media-control-modal');
    mediaModalOpen = !mediaModalOpen;

    if (mediaModalOpen) {
        modal.classList.add('show');
        // Close other panels
        const qs = document.getElementById('quick-settings');
        const launcher = document.getElementById('launcher-menu');
        if (qs) qs.style.display = 'none';
        if (launcher) launcher.style.display = 'none';
    } else {
        modal.classList.remove('show');
    }
}

function sendMediaCommand(command, value) {
    const echoMusicFrame = document.querySelector('#echo-music-window iframe, #echomusic-window iframe');
    if (echoMusicFrame && echoMusicFrame.contentWindow) {
        echoMusicFrame.contentWindow.postMessage({
            type: 'echo-music-command',
            command: command,
            value: value
        }, '*');
    }
}

function mediaTogglePlay() {
    sendMediaCommand('togglePlay');
}

function mediaPrev() {
    sendMediaCommand('prev');
}

function mediaNext() {
    sendMediaCommand('next');
}

function seekMedia(event) {
    const bar = document.getElementById('media-progress-bar');
    const rect = bar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    sendMediaCommand('seek', percent);
}

function formatMediaTime(seconds) {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Close media modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('media-control-modal');
    const btn = document.getElementById('media-control-btn');
    if (modal && btn && mediaModalOpen && !modal.contains(e.target) && !btn.contains(e.target)) {
        toggleMediaModal();
    }
});


// --- Boot Sequence & OOBE Setup ---

let tempUsername = '';
let tempPassword = '';

function processSetupStep1() {
    const nameInput = document.getElementById('setup-name-input').value.trim();
    if (nameInput === '') { alert("Please enter a name to continue."); return; }
    tempUsername = nameInput;
    document.getElementById('setup-step-1').classList.remove('active');
    document.getElementById('setup-step-2').classList.add('active');
}

function processSetupStep2(isSkipped) {
    if (!isSkipped) {
        const passInput = document.getElementById('setup-pass-input').value;
        if (passInput === '') { alert("Please enter a password or choose 'Skip'."); return; }
        tempPassword = passInput;
    }
    document.getElementById('setup-step-2').classList.remove('active');
    document.getElementById('setup-step-3').classList.add('active');
}

function finalizeSetup() {
    localStorage.setItem('echo_setup_complete', 'true');
    localStorage.setItem('echo_username', tempUsername);
    if (tempPassword !== '') localStorage.setItem('echo_password', tempPassword);

    document.getElementById('setup-screen').style.display = 'none';
    const lockUsername = document.getElementById('lock-username');
    if (lockUsername) lockUsername.innerText = tempUsername;

    initializeDesktop();
    const welcomeModal = document.getElementById('welcome-modal');
    if (welcomeModal) welcomeModal.style.display = 'flex';
}

function closeWelcomeModal() {
    const welcomeModal = document.getElementById('welcome-modal');
    if (welcomeModal) welcomeModal.style.display = 'none';
    // Show update modal after welcome modal is closed
    showUpdateModal();
    triggerInitialNotifications();
}


    initServerWarningBanner();
function initializeDesktop() {
    updateCalendarWidget();
    initChromeProxy();
    initTabCloak();
    initAboutBlankSettings();
    initBatterySaver();
    restoreActiveApps();

    const desktop = document.getElementById('desktop');
    const savedWallpaper = localStorage.getItem('echo_wallpaper');
    if(savedWallpaper && desktop) desktop.style.backgroundImage = `url('${savedWallpaper}')`;

    const savedApps = JSON.parse(localStorage.getItem('echo_installed_apps') || '[]');
    savedApps.forEach(app => {
        restoreAppToLauncher(app.id, app.icon, app.name);
        if (app.pinned) {
            restoreAppToTaskbar(app.id, app.icon, app.name);
        }
    });

    // Ensure pre-installed apps are in taskbar (in case localStorage was cleared)
    PRE_INSTALLED_APPS.forEach(appId => {
        const game = PS_GAMES[appId];
        const app = PS_APPS[appId];
        const item = game || app;
        if (item && !document.getElementById('taskbar-' + appId)) {
            restoreAppToTaskbar(appId, item.icon, item.name);
        }
    });

    document.querySelectorAll('.app-icon').forEach(makeIconDraggable);
    document.querySelectorAll('.desktop-icon').forEach(dragDesktopIcon);
    initLauncherContextMenu();
    initBattery();
    renderFiles();
    initLinkCreator();
}

function factoryReset() {
    if (confirm("WARNING: This will erase all settings, passwords, files, and apps. Continue?")) {
        localStorage.clear();
        location.reload();
    }
}

// --- System UI & Dark Mode ---
function toggleTheme() {
    const body = document.body;
    const textSpan = document.getElementById('theme-text');
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('echo_theme', 'light');
        if (textSpan) textSpan.innerText = "Light Theme";
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('echo_theme', 'dark');
        if (textSpan) textSpan.innerText = "Dark Theme";
    }
}

function updateClock() {
    const now = new Date();
    let hours = now.getHours(), minutes = now.getMinutes();
    hours = hours % 12 || 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const clock = document.getElementById('clock');
    if(clock) clock.innerText = hours + ':' + minutes;
}
setInterval(updateClock, 1000); updateClock();
setInterval(updateCalendarWidget, 60000);

function initBattery() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            function updateLevel() {
                const level = Math.round(battery.level * 100) + '%';
                const tbBattery = document.getElementById('taskbar-battery');
                const qsBatText = document.getElementById('qs-battery-text');
                const qsBatIcon = document.getElementById('qs-battery-icon');
                if(tbBattery) tbBattery.innerText = battery.charging ? '⚡' : '🔋';
                if(qsBatText) qsBatText.innerText = level;
                if(qsBatIcon) qsBatIcon.innerText = battery.charging ? '⚡' : '🔋';
            }
            updateLevel();
            battery.addEventListener('levelchange', updateLevel);
            battery.addEventListener('chargingchange', updateLevel);
        });
    }
}

// Brightness slider
document.addEventListener('DOMContentLoaded', function() {
    const brightnessSlider = document.getElementById('brightness-slider');
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', function(e) {
            const desktop = document.getElementById('desktop');
            if (desktop) desktop.style.filter = `brightness(${e.target.value}%)`;
        });
    }
});

// --- Context Menus & Uninstall Logic ---
const desktop = document.getElementById('desktop');
const contextMenu = document.getElementById('context-menu');
const launcherContextMenu = document.getElementById('launcher-context-menu');
const quickSettings = document.getElementById('quick-settings');
const launcherMenu = document.getElementById('launcher-menu');
const uninstallBtn = document.getElementById('context-uninstall');

let selectedAppIdToUninstall = null;
let selectedLauncherItem = null;

if (desktop) {
    desktop.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const appIcon = e.target.closest('.app-icon');
        if(appIcon) {
            selectedAppIdToUninstall = appIcon.id.replace('taskbar-', '');
            if(uninstallBtn) uninstallBtn.style.display = 'block';
            if(contextMenu) {
                contextMenu.style.display = 'block';
                contextMenu.style.left = e.clientX + 'px';
                contextMenu.style.top = (e.clientY - 100) + 'px'; 
            }
        } else if(e.target === desktop || e.target.closest('#desktop-icons-container')) {
            selectedAppIdToUninstall = null;
            if(uninstallBtn) uninstallBtn.style.display = 'none';
            if(contextMenu) {
                contextMenu.style.display = 'block';
                contextMenu.style.left = e.clientX + 'px';
                contextMenu.style.top = e.clientY + 'px';
            }
        }
    });
}

if (uninstallBtn) {
    uninstallBtn.addEventListener('click', () => {
        if(selectedAppIdToUninstall) {
            const tbIcon = document.getElementById('taskbar-' + selectedAppIdToUninstall);
            if(tbIcon) tbIcon.remove();

            document.querySelectorAll('.launcher-item').forEach(item => {
                if(item.getAttribute('onclick') === `openApp('${selectedAppIdToUninstall}')`) item.remove();
            });

            const storeBtn = document.getElementById('install-btn-' + selectedAppIdToUninstall);
            if(storeBtn) { storeBtn.innerText = 'Install'; storeBtn.disabled = false; }

            let savedApps = JSON.parse(localStorage.getItem('echo_installed_apps') || '[]');
            savedApps = savedApps.filter(app => app.id !== selectedAppIdToUninstall);
            localStorage.setItem('echo_installed_apps', JSON.stringify(savedApps));

            notificationMgr.showNotification({ title: "App Uninstalled", message: "Application removed successfully.", icon: "sparkles" });
        }
        if(contextMenu) contextMenu.style.display = 'none';
    });
}

function initLauncherContextMenu() {
    const launcherList = document.getElementById('launcher-list');
    if (!launcherList) return;

    launcherList.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const item = e.target.closest('.launcher-item');
        if (!item) return;

        selectedLauncherItem = item;
        if(launcherContextMenu) {
            launcherContextMenu.style.display = 'block';
            launcherContextMenu.style.left = e.clientX + 'px';
            launcherContextMenu.style.top = e.clientY + 'px';
        }
    });
}

function launcherContextAction(action) {
    if (!selectedLauncherItem) return;

    const appId = selectedLauncherItem.getAttribute('data-app-id');
    const icon = selectedLauncherItem.getAttribute('data-icon');
    const name = selectedLauncherItem.getAttribute('data-name');

    switch(action) {
        case 'open':
            openApp(appId);
            break;
        case 'addToShelf':
            if (!document.getElementById('taskbar-' + appId)) {
                restoreAppToTaskbar(appId, icon, name);
                let savedApps = JSON.parse(localStorage.getItem('echo_installed_apps') || '[]');
                const app = savedApps.find(a => a.id === appId);
                if (app) {
                    app.pinned = true;
                    localStorage.setItem('echo_installed_apps', JSON.stringify(savedApps));
                }
                notificationMgr.showNotification({ 
                    title: "Added to Shelf", 
                    message: `${name} has been pinned to your shelf.`, 
                    icon: "sparkles" 
                });
            }
            break;
        case 'uninstall':
            const tbIcon = document.getElementById('taskbar-' + appId);
            if (tbIcon) tbIcon.remove();
            selectedLauncherItem.remove();
            const storeBtn = document.getElementById('install-btn-' + appId);
            if(storeBtn) { 
                storeBtn.innerText = 'Install'; 
                storeBtn.disabled = false; 
            }
            let savedApps = JSON.parse(localStorage.getItem('echo_installed_apps') || '[]');
            savedApps = savedApps.filter(app => app.id !== appId);
            localStorage.setItem('echo_installed_apps', JSON.stringify(savedApps));
            notificationMgr.showNotification({ 
                title: "App Uninstalled", 
                message: `${name} has been removed.`, 
                icon: "sparkles" 
            });
            break;
    }

    if(launcherContextMenu) launcherContextMenu.style.display = 'none';
    selectedLauncherItem = null;
}

document.addEventListener('click', (e) => {
    if(contextMenu && !contextMenu.contains(e.target)) contextMenu.style.display = 'none';
    if(launcherContextMenu && !launcherContextMenu.contains(e.target)) launcherContextMenu.style.display = 'none';
    if(quickSettings && !quickSettings.contains(e.target) && !document.getElementById('status-area').contains(e.target)) quickSettings.style.display = 'none';
    if(launcherMenu && !launcherMenu.contains(e.target) && !document.getElementById('launcher-btn').contains(e.target)) {
        launcherMenu.style.display = 'none';
    }
    if (e.target.id === 'calendar-modal') {
        const calendarModal = document.getElementById('calendar-modal');
        if (calendarModal) calendarModal.style.display = 'none';
    }
});

function toggleQuickSettings() { 
    if (!quickSettings) return;
    if (quickSettings.style.display === 'none') {
        quickSettings.style.display = 'block';
        quickSettings.style.zIndex = '99999';
        if (launcherMenu) launcherMenu.style.display = 'none';
        activeGameWindow = null; // Reset so keys don't go to game
    } else {
        quickSettings.style.display = 'none';
        quickSettings.style.zIndex = '9999';
    }
}

function toggleMenu() { 
    if (!launcherMenu) return;

    if (launcherMenu.style.display === 'none') {
        // Opening launcher - ensure it's above ALL windows
        launcherMenu.style.display = 'flex';
        launcherMenu.style.zIndex = '99999'; // Force above everything
        if (quickSettings) quickSettings.style.display = 'none';

        // Focus the search input
        const searchInput = document.getElementById('launcher-search');
        if (searchInput) searchInput.focus();

        // Reset active game window so keys don't go to game while launcher is open
        activeGameWindow = null;
    } else {
        // Closing launcher
        launcherMenu.style.display = 'none';
        launcherMenu.style.zIndex = '9998'; // Reset to default
    }
}

function filterLauncher() { 
    const query = document.getElementById('launcher-search').value.toLowerCase(); 
    document.querySelectorAll('.launcher-item').forEach(item => { 
        const text = item.querySelector('.l-text').innerText.toLowerCase(); 
        item.style.display = text.includes(query) ? 'flex' : 'none'; 
    }); 
}

function lockSystem() {
    if (localStorage.getItem('echo_password')) {
        const lockUsername = document.getElementById('lock-username');
        if (lockUsername) lockUsername.innerText = localStorage.getItem('echo_username') || 'User';
        const lockScreen = document.getElementById('lock-screen');
        if (lockScreen) lockScreen.style.display = 'flex';
    } else { 
        alert("Please set a password in Settings first!"); 
    }
    if (quickSettings) quickSettings.style.display = 'none'; 
    if (contextMenu) contextMenu.style.display = 'none';
}

// Original unlockOS - disabled, account-aware version used above
// function unlockOS() {
//     const input = document.getElementById('lock-password').value;
//     const lockError = document.getElementById('lock-error');
//     const lockScreen = document.getElementById('lock-screen');
// 
//     if (input === localStorage.getItem('echo_password') || input === localStorage.getItem('echo_answer')) {
//         if (lockScreen) lockScreen.style.display = 'none';
//         document.getElementById('lock-password').value = '';
//         if (lockError) lockError.style.display = 'none';
//         // Show update modal immediately after unlocking
//         showUpdateModal();
//         triggerInitialNotifications(); 
//     } else {
//         if (lockError) lockError.style.display = 'block';
// }
// }

function showSecurityQuestion() {
    const hintDiv = document.getElementById('security-hint');
    const qText = document.getElementById('lock-question-text');
    const savedQ = localStorage.getItem('echo_question');
    if (qText) qText.innerText = savedQ ? "Hint: " + savedQ : "No security question set.";
    if (hintDiv) hintDiv.style.display = 'block';
}

function saveSecuritySettings() {
    const pass = document.getElementById('set-password').value;
    const q = document.getElementById('set-question').value;
    const a = document.getElementById('set-answer').value;
    if(pass) localStorage.setItem('echo_password', pass);
    if(q) localStorage.setItem('echo_question', q);
    if(a) localStorage.setItem('echo_answer', a);
    const msg = document.getElementById('security-save-msg');
    if (msg) {
        msg.style.display = 'block'; 
        setTimeout(() => msg.style.display = 'none', 3000);
    }
}

// --- Window Memory Management ---
