// File: /api2/index.js

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { action, token, chat_id, message, caption, photo, video } = req.body;

        if (!token || !chat_id) {
            return res.status(400).json({ success: false, error: 'Missing token or chat_id' });
        }

        if (!token.match(/^\d+:[A-Za-z0-9_-]+$/)) {
            return res.status(400).json({ success: false, error: 'Invalid token format' });
        }

        let telegramUrl;
        let requestOptions;

        switch (action) {
            case 'sendMessage':
                if (!message) {
                    return res.status(400).json({ success: false, error: 'Message required' });
                }
                telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
                requestOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chat_id,
                        text: message,
                        parse_mode: 'HTML'
                    })
                };
                break;

            case 'sendPhoto':
                if (!photo) {
                    return res.status(400).json({ success: false, error: 'Photo required' });
                }
                telegramUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
                
                const photoBuffer = Buffer.from(photo, 'base64');
                const FormData = (await import('form-data')).default;
                const photoForm = new FormData();
                photoForm.append('chat_id', chat_id);
                photoForm.append('photo', photoBuffer, {
                    filename: 'photo.jpg',
                    contentType: 'image/jpeg'
                });
                if (caption) {
                    photoForm.append('caption', caption);
                    photoForm.append('parse_mode', 'HTML');
                }

                const photoResponse = await fetch(telegramUrl, {
                    method: 'POST',
                    body: photoForm,
                    headers: photoForm.getHeaders()
                });
                const photoResult = await photoResponse.json();
                
                if (photoResult.ok) {
                    return res.status(200).json({ success: true, message: 'Photo sent', data: photoResult });
                } else {
                    return res.status(400).json({ success: false, error: photoResult.description });
                }

            case 'sendVideo':
                if (!video) {
                    return res.status(400).json({ success: false, error: 'Video required' });
                }
                telegramUrl = `https://api.telegram.org/bot${token}/sendVideo`;
                
                const videoBuffer = Buffer.from(video, 'base64');
                const VideoFormData = (await import('form-data')).default;
                const videoForm = new VideoFormData();
                videoForm.append('chat_id', chat_id);
                videoForm.append('video', videoBuffer, {
                    filename: 'video.mp4',
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
                    return res.status(200).json({ success: true, message: 'Video sent', data: videoResult });
                } else {
                    return res.status(400).json({ success: false, error: videoResult.description });
                }

            default:
                return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        if (action === 'sendMessage') {
            const response = await fetch(telegramUrl, requestOptions);
            const result = await response.json();

            if (result.ok) {
                return res.status(200).json({ success: true, message: 'Message sent', data: result });
            } else {
                return res.status(400).json({ success: false, error: result.description });
            }
        }

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
    }
