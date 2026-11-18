
import { createHash } from 'node:crypto';

function sha256(value: string): string {
  return createHash('sha256')
    .update(value)
    .digest('hex');
}

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

async function hashUserData(userData: any = {}) {
  const result: Record<string, any> = {};

  if (userData.em) {
    result.em = [sha256(normalize(userData.em))];
  }

  if (userData.ph) {
    result.ph = [
      sha256(String(userData.ph).replace(/\D/g, '')),
    ];
  }

  if (userData.fn) {
    result.fn = [sha256(normalize(userData.fn))];
  }

  if (userData.ln) {
    result.ln = [sha256(normalize(userData.ln))];
  }

  if (userData.external_id) {
    result.external_id = [
      sha256(normalize(userData.external_id)),
    ];
  }

  if (userData.fbp) {
    result.fbp = userData.fbp;
  }

  if (userData.fbc) {
    result.fbc = userData.fbc;
  }

  return result;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
    });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body || {};

    const {
      eventName,
      eventSourceUrl,
      userData = {},
      customData = {},
      eventId,
    } = body;

    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const testEventCode = process.env.META_TEST_EVENT_CODE?.trim();

    if (!pixelId || !accessToken) {
      console.error('HYDEE: Meta environment variables missing.');

      return res.status(500).json({
        success: false,
        error: 'Meta server configuration is missing.',
      });
    }

    if (
      typeof eventName !== 'string' ||
      !/^[A-Za-z][A-Za-z0-9_]*$/.test(eventName)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event name.',
      });
    }

    const eventTime = Math.floor(Date.now() / 1000);

    const forwardedFor = req.headers['x-forwarded-for'];

    const clientIp =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.socket?.remoteAddress;

    const hashedUserData = await hashUserData(userData);

    // Accept both HYDEE domains and reject unrelated URLs.
    let safeEventSourceUrl = 'https://hydee.shop/';

    if (typeof eventSourceUrl === 'string') {
      try {
        const parsedUrl = new URL(eventSourceUrl);

        const allowedHosts = [
          'hydee.shop',
          'www.hydee.shop',
        ];

        if (
          parsedUrl.protocol === 'https:' &&
          allowedHosts.includes(parsedUrl.hostname)
        ) {
          safeEventSourceUrl = parsedUrl.toString();
        }
      } catch {
        // Use the canonical website URL if parsing fails.
      }
    }

    const payload: Record<string, any> = {
      data: [
        {
          event_name: eventName,
          event_time: eventTime,
          event_id: eventId || `hydee_${eventTime}`,

          event_source_url: safeEventSourceUrl,

          action_source: 'website',

          user_data: {
            ...hashedUserData,
            client_ip_address: clientIp,
            client_user_agent: req.headers['user-agent'],
          },

          custom_data: customData || {},
        },
      ],
    };

    // Add Test Event Code only when configured in Vercel.
    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    const apiVersion =
      process.env.META_GRAPH_API_VERSION || 'v26.0';

    const metaUrl =
      `https://graph.facebook.com/${apiVersion}/${pixelId}/events`;

    const params = new URLSearchParams({
      access_token: accessToken,
    });

    const response = await fetch(
      `${metaUrl}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('HYDEE Meta CAPI rejected event:', result);

      return res.status(response.status).json({
        success: false,
        error: 'Meta rejected the event.',
        details: result,
      });
    }

    console.log(
      `HYDEE CAPI Success: ${eventName}`,
      eventId
    );

    return res.status(200).json({
      success: true,
      eventName,
      eventId,
      result,
    });

  } catch (error: any) {
    console.error('HYDEE CAPI Server Error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
}
