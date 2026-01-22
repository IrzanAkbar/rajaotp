/**
 * 📦 Event Storage System
 * Manage bot events dari webhook dengan FIFO (keep last 1000)
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = process.cwd() + '/data';
const EVENTS_FILE = path.join(DATA_DIR, 'bot-events.json');
const MAX_EVENTS = 1000;

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initialize events file if not exists
function ensureEventsFile() {
  ensureDataDir();
  if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify({
      events: [],
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    }, null, 2));
  }
}

/**
 * Get all events
 * @returns {Array} Array of events
 */
export function getAllEvents() {
  ensureEventsFile();
  try {
    const data = fs.readFileSync(EVENTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.events || [];
  } catch (err) {
    console.error('Failed to read events:', err);
    return [];
  }
}

/**
 * Add new event
 * @param {Object} event - Event object with eventType, data, timestamp
 * @returns {Object} Added event with id
 */
export function addEvent(event: any) {
  ensureEventsFile();
  try {
    const data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
    
    // Create event with auto-id
    const newEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventType: event.eventType,
      data: event.data || {},
      timestamp: event.timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      processed: false
    };

    // Add event
    data.events.push(newEvent);

    // Keep only last 1000 (FIFO)
    if (data.events.length > MAX_EVENTS) {
      data.events = data.events.slice(-MAX_EVENTS);
    }

    // Update timestamp
    data.lastUpdated = new Date().toISOString();

    // Write back
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(data, null, 2));

    return newEvent;
  } catch (err) {
    console.error('Failed to add event:', err);
    return null;
  }
}

/**
 * Get events by type
 * @param {string} eventType - Type of event (order_success, order_refund, etc)
 * @returns {Array} Filtered events
 */
export function getEventsByType(eventType: string) {
  const events = getAllEvents();
  return events.filter((e: any) => e.eventType === eventType);
}

/**
 * Get events by user ID
 * @param {string} userId - Telegram user ID
 * @returns {Array} Filtered events
 */
export function getEventsByUserId(userId: string) {
  const events = getAllEvents();
  return events.filter((e: any) => e.data?.userId === userId);
}

/**
 * Get recent events
 * @param {number} limit - Number of events to return (default 50)
 * @returns {Array} Last N events
 */
export function getRecentEvents(limit: number = 50) {
  const events = getAllEvents();
  return events.slice(-limit).reverse();
}

/**
 * Get stats
 * @returns {Object} Stats object
 */
export function getStats() {
  const events = getAllEvents();
  
  const stats = {
    totalEvents: events.length,
    byType: {} as Record<string, number>,
    uniqueUsers: new Set(),
    latestEvent: events.length > 0 ? events[events.length - 1].timestamp : null,
    oldestEvent: events.length > 0 ? events[0].timestamp : null
  };

  events.forEach((event: any) => {
    // Count by type
    stats.byType[event.eventType] = (stats.byType[event.eventType] || 0) + 1;
    
    // Track unique users
    if (event.data?.userId) {
      stats.uniqueUsers.add(event.data.userId);
    }
  });

  return {
    ...stats,
    uniqueUsers: stats.uniqueUsers.size
  };
}

/**
 * Get events within date range
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {Array} Filtered events
 */
export function getEventsByDateRange(startDate: string, endDate: string) {
  const events = getAllEvents();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return events.filter((e: any) => {
    const eventTime = new Date(e.timestamp).getTime();
    return eventTime >= start && eventTime <= end;
  });
}

/**
 * Clear all events (admin only)
 * @returns {boolean} Success status
 */
export function clearAllEvents() {
  try {
    const emptyData = {
      events: [],
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(emptyData, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to clear events:', err);
    return false;
  }
}

/**
 * Delete event by ID
 * @param {string} eventId - Event ID
 * @returns {boolean} Success status
 */
export function deleteEvent(eventId: string) {
  try {
    const data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
    data.events = data.events.filter((e: any) => e.id !== eventId);
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to delete event:', err);
    return false;
  }
}

/**
 * Mark event as processed
 * @param {string} eventId - Event ID
 * @returns {boolean} Success status
 */
export function markEventProcessed(eventId: string) {
  try {
    const data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
    const event = data.events.find((e: any) => e.id === eventId);
    if (event) {
      event.processed = true;
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(data, null, 2));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to mark event processed:', err);
    return false;
  }
}

/**
 * Export events as CSV
 * @param {string} filePath - Output file path
 * @returns {boolean} Success status
 */
export function exportEventsCSV(filePath: string) {
  try {
    const events = getAllEvents();
    
    if (events.length === 0) {
      return false;
    }

    // CSV Header
    const header = 'ID,EventType,UserId,Timestamp,Data\n';
    
    // CSV Rows
    const rows = events.map((e: any) => {
      const dataStr = JSON.stringify(e.data).replace(/"/g, '""'); // Escape quotes
      return `${e.id},"${e.eventType}","${e.data?.userId || 'N/A'}","${e.timestamp}","${dataStr}"`;
    }).join('\n');

    fs.writeFileSync(filePath, header + rows);
    return true;
  } catch (err) {
    console.error('Failed to export CSV:', err);
    return false;
  }
}
