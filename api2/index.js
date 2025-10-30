// File: api2/index.js
// Vercel Serverless Function for Telegram Bot API Proxy

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    const { token, chat_id, action, data } = req.body;

    // Validate required fields
    if (!token || !chat_id || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: token, chat_id, or action' 
      });
    }

    let telegramResponse;
    
    // Handle sendMessage
    if (action === 'sendMessage') {
      if (!data.text) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing text field for sendMessage' 
        });
      }
      
      telegramResponse = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat_id,
            text: data.text,
            parse_mode: data.parse_mode || 'HTML',
            disable_web_page_preview: data.disable_web_page_preview || false,
          }),
        }
      );
    }
    // Handle sendPhoto
    else if (action === 'sendPhoto') {
      if (!data.photo) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing photo data' 
        });
      }

      // Convert base64 to buffer
      const base64Data = data.photo.split(',')[1] || data.photo;
      const buffer = Buffer.from(base64Data, 'base64');
      
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      form.append('chat_id', chat_id);
      form.append('photo', buffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });
      
      if (data.caption) {
        form.append('caption', data.caption);
        form.append('parse_mode', data.parse_mode || 'HTML');
      }

      telegramResponse = await fetch(
        `https://api.telegram.org/bot${token}/sendPhoto`,
        {
          method: 'POST',
          body: form,
          headers: form.getHeaders(),
        }
      );
    }
    // Handle sendVideo
    else if (action === 'sendVideo') {
      if (!data.video) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing video data' 
        });
      }

      const base64Data = data.video.split(',')[1] || data.video;
      const buffer = Buffer.from(base64Data, 'base64');
      
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      form.append('chat_id', chat_id);
      form.append('video', buffer, { filename: 'video.mp4', contentType: 'video/mp4' });
      
      if (data.caption) {
        form.append('caption', data.caption);
        form.append('parse_mode', data.parse_mode || 'HTML');
      }

      telegramResponse = await fetch(
        `https://api.telegram.org/bot${token}/sendVideo`,
        {
          method: 'POST',
          body: form,
          headers: form.getHeaders(),
        }
      );
    }
    else {
      return res.status(400).json({ 
        success: false, 
        error: `Unsupported action: ${action}` 
      });
    }

    const result = await telegramResponse.json();

    if (telegramResponse.ok) {
      return res.status(200).json({ 
        success: true, 
        data: result 
      });
    } else {
      return res.status(telegramResponse.status).json({ 
        success: false, 
        error: result.description || 'Telegram API error',
        details: result 
      });
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