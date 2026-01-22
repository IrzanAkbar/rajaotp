/**
 * Get bot events
 * GET /api/bot/events?type=order_success&limit=50
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllEvents,
  getEventsByType,
  getEventsByUserId,
  getRecentEvents,
  getStats,
  getEventsByDateRange
} from '@/app/lib/bot-event-storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const eventType = searchParams.get('type');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const statsOnly = searchParams.get('stats') === 'true';

    let events = [];

    // Get stats only
    if (statsOnly) {
      const stats = getStats();
      return NextResponse.json({
        success: true,
        stats
      });
    }

    // Filter by date range
    if (startDate && endDate) {
      events = getEventsByDateRange(startDate, endDate);
    }
    // Filter by type
    else if (eventType) {
      events = getEventsByType(eventType);
    }
    // Filter by user ID
    else if (userId) {
      events = getEventsByUserId(userId);
    }
    // Get recent events
    else {
      events = getRecentEvents(limit);
    }

    // Apply limit
    if (!startDate && !endDate) {
      events = events.slice(0, limit);
    }

    const stats = getStats();

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
      stats
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
