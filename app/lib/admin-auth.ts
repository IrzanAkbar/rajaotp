// Simple admin authentication utilities
import { cookies } from 'next/headers';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123'; // Change in production
const ADMIN_TOKEN_SECRET = 'admin-secret-key-2025';

export interface AdminSession {
  username: string;
  token: string;
  timestamp: number;
}

// Create admin token
export async function createAdminToken(username: string, password: string): Promise<string | null> {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = Buffer.from(`${username}:${ADMIN_TOKEN_SECRET}:${Date.now()}`).toString('base64');
    return token;
  }
  return null;
}

// Verify admin token
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, secret] = decoded.split(':');
    return username === ADMIN_USERNAME && secret === ADMIN_TOKEN_SECRET;
  } catch {
    return false;
  }
}

// Get admin session from cookies
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) return null;
    
    const isValid = await verifyAdminToken(token);
    if (!isValid) return null;
    
    return {
      username: ADMIN_USERNAME,
      token,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

// Set admin token in cookies
export async function setAdminToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Clear admin session
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
}
