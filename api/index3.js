// ===== SEND LOCATION =====
if (action === 'sendLocation') {
    const { latitude, longitude } = req.body;
    
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