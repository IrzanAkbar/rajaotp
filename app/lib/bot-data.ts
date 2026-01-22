/**
 * Bot Data Access Layer
 * 
 * Module ini membaca data langsung dari struktur bot RajaOTP:
 * - users.json: Array of Telegram user IDs
 * - database/saldoOtp.json: Object {userId: saldo}
 * 
 * ⚠️ NOTES:
 * - Semua operasi read-only (tidak memodifikasi bot data)
 * - Data dimuat fresh setiap kali dipanggil (no cache)
 * - Safe error handling untuk file yang missing/corrupt
 */

import fs from 'fs';
import path from 'path';

// Lokasi file bot (relative ke project root)
const BOT_USERS_FILE = path.join(process.cwd(), 'users.json');
const BOT_SALDO_FILE = path.join(process.cwd(), 'botraja', 'database', 'saldoOtp.json');

/**
 * Load JSON file safely with fallback
 */
function loadJsonSafe(filePath: string, defaultValue: any = null): any {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return defaultValue;
  }
}

/**
 * Get all user IDs from bot
 * Returns: string[] of Telegram user IDs
 */
export function getBotUserIds() {
  try {
    const users = loadJsonSafe(BOT_USERS_FILE, []);
    if (!Array.isArray(users)) {
      console.error('❌ users.json is not an array');
      return [];
    }
    return users;
  } catch (error) {
    console.error('Error getting bot user IDs:', error);
    return [];
  }
}

/**
 * Get all saldo data from bot
 * Returns: Object {userId: saldo}
 */
function getBotSaldoData() {
  try {
    const saldoData = loadJsonSafe(BOT_SALDO_FILE, {});
    if (typeof saldoData !== 'object' || Array.isArray(saldoData)) {
      console.error('❌ saldoOtp.json is not an object');
      return {};
    }
    return saldoData;
  } catch (error) {
    console.error('Error getting bot saldo data:', error);
    return {};
  }
}

/**
 * Get total user count
 */
export function getTotalUsers() {
  return getBotUserIds().length;
}

/**
 * Get user saldo
 * Returns: number (default 0 if user not found)
 */
export function getUserSaldo(userId: string): number {
  const saldoData = getBotSaldoData();
  const saldo = Number(saldoData[userId]) || 0;
  
  // Validasi saldo tidak negatif
  if (saldo < 0) {
    console.warn(`⚠️ Negative saldo detected for user ${userId}: ${saldo}`);
    return 0;
  }
  
  return saldo;
}

/**
 * Get total balance across all users
 */
export function getTotalBalance(): number {
  const saldoData = getBotSaldoData();
  return Object.values(saldoData).reduce((sum: number, saldo: any) => {
    const num = Number(saldo) || 0;
    return sum + (num >= 0 ? num : 0); // Hanya tambah saldo positif
  }, 0);
}

/**
 * Get all users with their saldo info
 * Returns: Array of {userId, saldo}
 */
export function getAllUsersWithSaldo() {
  const userIds = getBotUserIds();
  const saldoData = getBotSaldoData();

  return userIds
    .map(userId => ({
      userId,
      saldo: getUserSaldo(userId),
    }))
    .sort((a, b) => b.saldo - a.saldo); // Sort by saldo descending
}

/**
 * Search users by ID or partial match
 */
export function searchBotUsers(query: string) {
  if (!query) return getAllUsersWithSaldo();

  const userIds = getBotUserIds();
  const saldoData = getBotSaldoData();
  const lowerQuery = query.toLowerCase();

  return userIds
    .filter(userId => userId.toLowerCase().includes(lowerQuery))
    .map(userId => ({
      userId,
      saldo: getUserSaldo(userId),
    }))
    .sort((a, b) => b.saldo - a.saldo);
}

/**
 * Check if user exists in bot
 */
export function isBotUser(userId: string): boolean {
  const userIds = getBotUserIds();
  return userIds.includes(userId.toString());
}

/**
 * Count active users (users yang punya saldo > 0)
 */
export function getActiveUsersCount(): number {
  const saldoData = getBotSaldoData();
  return Object.values(saldoData).filter(saldo => {
    const num = Number(saldo) || 0;
    return num > 0;
  }).length;
}

/**
 * Get user rank by saldo (1-based)
 */
export function getUserRank(userId: string) {
  const allUsers = getAllUsersWithSaldo();
  const index = allUsers.findIndex(u => u.userId === userId.toString());
  return index >= 0 ? index + 1 : null;
}

/**
 * Get bot statistics summary
 */
export function getBotStatistics() {
  return {
    totalUsers: getTotalUsers(),
    totalBalance: getTotalBalance(),
    activeUsers: getActiveUsersCount(),
    timestamp: new Date().toISOString(),
  };
}

export default {
  getBotUserIds,
  getTotalUsers,
  getUserSaldo,
  getTotalBalance,
  getAllUsersWithSaldo,
  searchBotUsers,
  isBotUser,
  getActiveUsersCount,
  getUserRank,
  getBotStatistics,
};
