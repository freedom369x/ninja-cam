// Vercel Serverless Function - /api/index.js
// Fixed version with proper form-data handling

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

        console.log('🔥 Received request:', { action, chat_id, hasToken: !!token });

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
                
                console.log('📤 Sending message to Telegram...');
                
                const msgResponse = await fetch(telegramUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                const msgResult = await msgResponse.json();
                console.log('📥 Telegram response:', msgResult);

                if (msgResult.ok) {
                    return res.status(200).json({ 
                        success: true, 
                        message: 'Message sent successfully',
                        data: msgResult 
                    });
                } else {
                    return res.status(400).json({ 
                        success: false, 
                        error: msgResult.description || 'Failed to send message' 
                    });
                }

            case 'sendPhoto':
                if (!req.body.photo) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Photo data is required for sendPhoto action' 
                    });
                }
                
                console.log('📸 Processing photo...');
                console.log('📊 Photo data length:', req.body.photo.length);
                
                telegramUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
                
                try {
                    // Handle base64 photo data
                    const photoBuffer = Buffer.from(req.body.photo, 'base64');
                    console.log('✅ Buffer created, size:', photoBuffer.length, 'bytes');
                    
                    // Import form-data dynamically
                    const FormData = (await import('form-data')).default;
                    console.log('✅ FormData module loaded');
                    
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
                    
                    console.log('📤 Uploading photo to Telegram...');

                    const photoResponse = await fetch(telegramUrl, {
                        method: 'POST',
                        body: form,
                        headers: form.getHeaders()
                    });

                    console.log('📥 Telegram photo response status:', photoResponse.status);
                    
                    const responseText = await photoResponse.text();
                    console.log('📥 Raw response:', responseText.substring(0, 200));
                    
                    let photoResult;
                    try {
                        photoResult = JSON.parse(responseText);
                    } catch (parseError) {
                        console.error('❌ JSON parse error:', parseError);
                        return res.status(500).json({ 
                            success: false, 
                            error: 'Failed to parse Telegram response',
                            details: responseText.substring(0, 500)
                        });
                    }
                    
                    if (photoResult.ok) {
                        console.log('✅ Photo sent successfully');
                        return res.status(200).json({ 
                            success: true, 
                            message: 'Photo sent successfully',
                            data: photoResult 
                        });
                    } else {
                        console.error('❌ Telegram error:', photoResult.description);
                        return res.status(400).json({ 
                            success: false, 
                            error: photoResult.description || 'Failed to send photo' 
                        });
                    }
                } catch (photoError) {
                    console.error('❌ Photo processing error:', photoError);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Failed to process photo',
                        details: photoError.message,
                        stack: photoError.stack
                    });
                }

            case 'sendVideo':
                if (!req.body.video) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Video data is required for sendVideo action' 
                    });
                }
                
                console.log('🎥 Processing video...');
                console.log('📊 Video data length:', req.body.video.length);
                
                telegramUrl = `https://api.telegram.org/bot${token}/sendVideo`;
                
                try {
                    // Handle base64 video data
                    const videoBuffer = Buffer.from(req.body.video, 'base64');
                    console.log('✅ Video buffer created, size:', videoBuffer.length, 'bytes');
                    
                    // Import form-data dynamically
                    const FormData = (await import('form-data')).default;
                    console.log('✅ FormData module loaded');
                    
                    const videoForm = new FormData();
                    videoForm.append('chat_id', chat_id);
                    videoForm.append('video', videoBuffer, {
                        filename: 'camera_video.mp4',
                        contentType: 'video/mp4'
                    });
                    if (caption) {
                        videoForm.append('caption', caption);
                        videoForm.append('parse_mode', 'HTML');
                    }
                    
                    console.log('📤 Uploading video to Telegram...');

                    const videoResponse = await fetch(telegramUrl, {
                        method: 'POST',
                        body: videoForm,
                        headers: videoForm.getHeaders()
                    });

                    console.log('📥 Telegram video response status:', videoResponse.status);
                    
                    const videoResponseText = await videoResponse.text();
                    console.log('📥 Raw response:', videoResponseText.substring(0, 200));
                    
                    let videoResult;
                    try {
                        videoResult = JSON.parse(videoResponseText);
                    } catch (parseError) {
                        console.error('❌ JSON parse error:', parseError);
                        return res.status(500).json({ 
                            success: false, 
                            error: 'Failed to parse Telegram response',
                            details: videoResponseText.substring(0, 500)
                        });
                    }
                    
                    if (videoResult.ok) {
                        console.log('✅ Video sent successfully');
                        return res.status(200).json({ 
                            success: true, 
                            message: 'Video sent successfully',
                            data: videoResult 
                        });
                    } else {
                        console.error('❌ Telegram error:', videoResult.description);
                        return res.status(400).json({ 
                            success: false, 
                            error: videoResult.description || 'Failed to send video' 
                        });
                    }
                } catch (videoError) {
                    console.error('❌ Video processing error:', videoError);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Failed to process video',
                        details: videoError.message,
                        stack: videoError.stack
                    });
                }

            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid action. Use: sendMessage, sendPhoto, or sendVideo' 
                });
        }

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message,
            stack: error.stack
        });
    }
}