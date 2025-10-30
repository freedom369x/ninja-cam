// Vercel Serverless Function - /api2/index.js
// This handles all Telegram API requests with proper CORS support

export default async function handler(req, res) {
    // Set CORS headers for all browsers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        const { action, token, chat_id, message, caption } = req.body;

        // Validate required fields
        if (!token || !chat_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: token and chat_id' 
            });
        }

        // Validate token format (basic check)
        if (!token.match(/^\d+:[A-Za-z0-9_-]+$/)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid token format' 
            });
        }

        let telegramUrl;
        let requestBody;

        switch (action) {
            case 'sendMessage':
                if (!message) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Message is required for sendMessage action' 
                    });
                }
                telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
                requestBody = {
                    chat_id: chat_id,
                    text: message,
                    parse_mode: 'HTML'
                };
                break;

            case 'sendPhoto':
                if (!req.body.photo) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Photo data is required for sendPhoto action' 
                    });
                }
                telegramUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
                
                // Handle base64 photo data
                const photoBuffer = Buffer.from(req.body.photo, 'base64');
                const FormData = (await import('form-data')).default;
                const form = new FormData();
                form.append('chat_id', chat_id);
                form.append('photo', photoBuffer, {
                    filename: 'camera_photo.jpg',
                    contentType: 'image/jpeg'
                });
                if (caption) {
                    form.append('caption', caption);
                    form.append('parse_mode', 'HTML');
                }

                const photoResponse = await fetch(telegramUrl, {
                    method: 'POST',
                    body: form,
                    headers: form.getHeaders()
                });

                const photoResult = await photoResponse.json();
                
                if (photoResult.ok) {
                    return res.status(200).json({ 
                        success: true, 
                        message: 'Photo sent successfully',
                        data: photoResult 
                    });
                } else {
                    return res.status(400).json({ 
                        success: false, 
                        error: photoResult.description || 'Failed to send photo' 
                    });
                }

            case 'sendVideo':
                if (!req.body.video) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Video data is required for sendVideo action' 
                    });
                }
                telegramUrl = `https://api.telegram.org/bot${token}/sendVideo`;
                
                // Handle base64 video data
                const videoBuffer = Buffer.from(req.body.video, 'base64');
                const VideoFormData = (await import('form-data')).default;
                const videoForm = new VideoFormData();
                videoForm.append('chat_id', chat_id);
                videoForm.append('video', videoBuffer, {
                    filename: 'camera_video.mp4',
                    contentType: 'video/mp4'
                });
                if (caption) {
                    videoForm.append('caption', caption);
                    videoForm.append('parse_mode', 'HTML');
                }

                const videoResponse = await fetch(telegramUrl, {
                    method: 'POST',
                    body: videoForm,
                    headers: videoForm.getHeaders()
                });

                const videoResult = await videoResponse.json();
                
                if (videoResult.ok) {
                    return res.status(200).json({ 
                        success: true, 
                        message: 'Video sent successfully',
                        data: videoResult 
                    });
                } else {
                    return res.status(400).json({ 
                        success: false, 
                        error: videoResult.description || 'Failed to send video' 
                    });
                }

            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid action. Use: sendMessage, sendPhoto, or sendVideo' 
                });
        }

        // For sendMessage action
        if (action === 'sendMessage') {
            const response = await fetch(telegramUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (result.ok) {
                return res.status(200).json({ 
                    success: true, 
                    message: 'Message sent successfully',
                    data: result 
                });
            } else {
                return res.status(400).json({ 
                    success: false, 
                    error: result.description || 'Failed to send message' 
                });
            }
        }

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message 
        });
    }
}