// Vercel Serverless Function - /api/index.js
// FIXED VERSION - Photo/Video upload working properly

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
        const { action, token, chat_id, message, caption, photo, video } = req.body;

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

        // ===== SEND PHOTO =====
        if (action === 'sendPhoto') {
            if (!photo) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Photo data required' 
                });
            }

            console.log('📸 Processing photo, length:', photo.length);

            try {
                // Convert base64 to buffer
                const photoBuffer = Buffer.from(photo, 'base64');
                console.log('✅ Buffer size:', photoBuffer.length, 'bytes');

                // Create boundary manually
                const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
                
                // Build multipart form data manually
                let formData = '';
                
                // Add chat_id
                formData += `--${boundary}\r\n`;
                formData += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
                formData += `${chat_id}\r\n`;
                
                // Add caption if exists
                if (caption) {
                    formData += `--${boundary}\r\n`;
                    formData += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
                    formData += `${caption}\r\n`;
                    
                    formData += `--${boundary}\r\n`;
                    formData += `Content-Disposition: form-data; name="parse_mode"\r\n\r\n`;
                    formData += `HTML\r\n`;
                }
                
                // Add photo
                formData += `--${boundary}\r\n`;
                formData += `Content-Disposition: form-data; name="photo"; filename="photo.jpg"\r\n`;
                formData += `Content-Type: image/jpeg\r\n\r\n`;
                
                // Combine text and binary data
                const formDataBuffer = Buffer.concat([
                    Buffer.from(formData, 'utf8'),
                    photoBuffer,
                    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
                ]);

                console.log('📤 Uploading to Telegram...');

                const response = await fetch(`${baseUrl}/sendPhoto`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${boundary}`,
                        'Content-Length': formDataBuffer.length.toString()
                    },
                    body: formDataBuffer
                });

                console.log('📥 Response status:', response.status);
                
                const resultText = await response.text();
                console.log('📥 Response preview:', resultText.substring(0, 200));
                
                let result;
                try {
                    result = JSON.parse(resultText);
                } catch (e) {
                    console.error('❌ Parse error:', e);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Invalid Telegram response',
                        details: resultText.substring(0, 500)
                    });
                }

                if (result.ok) {
                    console.log('✅ Photo sent successfully');
                    return res.status(200).json({ 
                        success: true, 
                        message: 'Photo sent',
                        data: result 
                    });
                } else {
                    console.error('❌ Telegram error:', result.description);
                    return res.status(400).json({ 
                        success: false, 
                        error: result.description 
                    });
                }

            } catch (error) {
                console.error('❌ Photo error:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Photo processing failed',
                    details: error.message
                });
            }
        }

        // ===== SEND VIDEO =====
        if (action === 'sendVideo') {
            if (!video) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Video data required' 
                });
            }

            console.log('🎥 Processing video, length:', video.length);

            try {
                // Convert base64 to buffer
                const videoBuffer = Buffer.from(video, 'base64');
                console.log('✅ Buffer size:', videoBuffer.length, 'bytes');

                // Create boundary manually
                const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
                
                // Build multipart form data manually
                let formData = '';
                
                // Add chat_id
                formData += `--${boundary}\r\n`;
                formData += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
                formData += `${chat_id}\r\n`;
                
                // Add caption if exists
                if (caption) {
                    formData += `--${boundary}\r\n`;
                    formData += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
                    formData += `${caption}\r\n`;
                    
                    formData += `--${boundary}\r\n`;
                    formData += `Content-Disposition: form-data; name="parse_mode"\r\n\r\n`;
                    formData += `HTML\r\n`;
                }
                
                // Add video
                formData += `--${boundary}\r\n`;
                formData += `Content-Disposition: form-data; name="video"; filename="video.mp4"\r\n`;
                formData += `Content-Type: video/mp4\r\n\r\n`;
                
                // Combine text and binary data
                const formDataBuffer = Buffer.concat([
                    Buffer.from(formData, 'utf8'),
                    videoBuffer,
                    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
                ]);

                console.log('📤 Uploading video to Telegram...');

                const response = await fetch(`${baseUrl}/sendVideo`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${boundary}`,
                        'Content-Length': formDataBuffer.length.toString()
                    },
                    body: formDataBuffer
                });

                console.log('📥 Response status:', response.status);
                
                const resultText = await response.text();
                console.log('📥 Response preview:', resultText.substring(0, 200));
                
                let result;
                try {
                    result = JSON.parse(resultText);
                } catch (e) {
                    console.error('❌ Parse error:', e);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Invalid Telegram response',
                        details: resultText.substring(0, 500)
                    });
                }

                if (result.ok) {
                    console.log('✅ Video sent successfully');
                    return res.status(200).json({ 
                        success: true, 
                        message: 'Video sent',
                        data: result 
                    });
                } else {
                    console.error('❌ Telegram error:', result.description);
                    return res.status(400).json({ 
                        success: false, 
                        error: result.description 
                    });
                }

            } catch (error) {
                console.error('❌ Video error:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Video processing failed',
                    details: error.message
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