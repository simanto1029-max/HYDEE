import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers allow
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { eventName, eventSourceUrl, userData, customData, eventId } = req.body;
    
    const pixelId = process.env.VITE_META_PIXEL_ID || process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      console.error('Missing Meta Pixel ID or Access Token in environment variables');
      return res.status(500).json({ error: 'Server configuration error: Missing Pixel ID or Token' });
    }

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: eventSourceUrl || 'https://hydee.com.bd',
          action_source: 'website',
          event_id: eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          user_data: {
            em: userData?.em ? [userData.em] : undefined,
            ph: userData?.ph ? [userData.ph] : undefined,
            fn: userData?.fn ? [userData.fn] : undefined,
            ln: userData?.ln ? [userData.ln] : undefined,
            client_ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            client_user_agent: req.headers['user-agent'],
          },
          custom_data: customData || {},
        },
      ],
    };

    const fbResponse = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error('Meta CAPI Error Response:', result);
      return res.status(fbResponse.status).json({ error: result });
    }

    return res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error('Meta CAPI Exception:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
