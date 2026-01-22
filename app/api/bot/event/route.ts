/**
 * 🌐 Bot Event Webhook Receiver
 * POST /api/bot/event
 * 
 * Receives webhook events from RajaOTP Bot and stores them
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  addEvent,
  getStats,
  getRecentEvents
} from '@/app/lib/bot-event-storage';

// Secret key from environment
const BOT_SECRET_KEY = process.env.BOT_SECRET_KEY || 'dev_secret_key_change_in_production';

/**
 * Validate authorization header
 */
function validateAuthorization(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization') || '';
  
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7); // Remove "Bearer "
  return token === BOT_SECRET_KEY;
}

/**
 * Validate webhook payload
 */
function validatePayload(body: any): { valid: boolean; error?: string } {
  if (!body.eventType) {
    return { valid: false, error: 'Missing eventType' };
  }

  const allowedEventTypes = [
    'order_success',
    'order_refund',
    'saldo_update',
    'deposit_success',
    'bot_error',
    'daily_report'
  ];

  if (!allowedEventTypes.includes(body.eventType)) {
    return { valid: false, error: `Invalid eventType: ${body.eventType}` };
  }

  if (!body.timestamp) {
    return { valid: false, error: 'Missing timestamp' };
  }

  if (!body.data || typeof body.data !== 'object') {
    return { valid: false, error: 'Missing or invalid data object' };
  }

  return { valid: true };
}

/**
 * Handle POST request
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validate Authorization
    if (!validateAuthorization(req)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Invalid or missing Authorization header'
        },
        { status: 401 }
      );
    }

    // 2. Parse JSON body
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON payload'
        },
        { status: 400 }
      );
    }

    // 3. Validate payload
    const validation = validatePayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error
        },
        { status: 400 }
      );
    }

    // 4. Add event to storage
    const event = addEvent({
      eventType: body.eventType,
      data: body.data,
      timestamp: body.timestamp
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to store event'
        },
        { status: 500 }
      );
    }

    // 5. Log event (for debugging)
    console.log(`✅ Event stored: ${body.eventType}`, {
      eventId: event.id,
      userId: body.data?.userId,
      timestamp: body.timestamp
    });

    // 6. Get updated stats
    const stats = getStats();

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        eventId: event.id,
        message: 'Event received and stored',
        stats: {
          totalEvents: stats.totalEvents,
          uniqueUsers: stats.uniqueUsers
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Webhook receiver error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET request (for testing / debugging)
 */
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET not allowed in production' },
      { status: 403 }
    );
  }

  try {
    const recentEvents = getRecentEvents(10);
    const stats = getStats();

    return NextResponse.json({
      message: 'Bot Event Webhook Receiver (Development)',
      stats,
      recentEvents,
      endpoint: '/api/bot/event',
      method: 'POST',
      required_headers: {
        Authorization: 'Bearer <BOT_SECRET_KEY>'
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
