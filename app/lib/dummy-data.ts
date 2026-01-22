// Dummy user data
export interface BotUser {
  id: string;
  username: string;
  email: string;
  balance: number;
  lastActive: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

// Sample dummy data
const DUMMY_USERS: BotUser[] = [
  {
    id: '001',
    username: 'user_alpha',
    email: 'user.alpha@example.com',
    balance: 50000,
    lastActive: '2025-01-21T14:30:00',
    createdAt: '2024-12-01T10:00:00',
    status: 'active',
  },
  {
    id: '002',
    username: 'user_beta',
    email: 'user.beta@example.com',
    balance: 75500,
    lastActive: '2025-01-22T09:15:00',
    createdAt: '2024-12-05T11:30:00',
    status: 'active',
  },
  {
    id: '003',
    username: 'user_gamma',
    email: 'user.gamma@example.com',
    balance: 120000,
    lastActive: '2025-01-20T16:45:00',
    createdAt: '2024-11-20T08:00:00',
    status: 'active',
  },
  {
    id: '004',
    username: 'user_delta',
    email: 'user.delta@example.com',
    balance: 30000,
    lastActive: '2025-01-18T12:00:00',
    createdAt: '2024-11-10T15:20:00',
    status: 'inactive',
  },
  {
    id: '005',
    username: 'user_epsilon',
    email: 'user.epsilon@example.com',
    balance: 95000,
    lastActive: '2025-01-22T11:00:00',
    createdAt: '2024-12-15T09:45:00',
    status: 'active',
  },
  {
    id: '006',
    username: 'user_zeta',
    email: 'user.zeta@example.com',
    balance: 65000,
    lastActive: '2025-01-22T13:30:00',
    createdAt: '2024-12-20T14:15:00',
    status: 'active',
  },
  {
    id: '007',
    username: 'user_theta',
    email: 'user.theta@example.com',
    balance: 40000,
    lastActive: '2025-01-19T10:30:00',
    createdAt: '2024-12-10T16:00:00',
    status: 'active',
  },
  {
    id: '008',
    username: 'user_iota',
    email: 'user.iota@example.com',
    balance: 85000,
    lastActive: '2025-01-17T08:15:00',
    createdAt: '2024-11-25T12:30:00',
    status: 'inactive',
  },
];

export function getAllUsers(): BotUser[] {
  return JSON.parse(JSON.stringify(DUMMY_USERS));
}

export function getUserById(id: string): BotUser | undefined {
  return JSON.parse(JSON.stringify(DUMMY_USERS)).find((u: BotUser) => u.id === id);
}

export function searchUsers(query: string): BotUser[] {
  const users = JSON.parse(JSON.stringify(DUMMY_USERS));
  const lowerQuery = query.toLowerCase();
  return users.filter((u: BotUser) =>
    u.id.toLowerCase().includes(lowerQuery) ||
    u.username.toLowerCase().includes(lowerQuery) ||
    u.email.toLowerCase().includes(lowerQuery)
  );
}

export function updateUserBalance(id: string, newBalance: number): BotUser | null {
  // In real app, this would update database
  // For now, return the updated user object
  const user = DUMMY_USERS.find(u => u.id === id);
  if (user && newBalance >= 0) {
    return {
      ...user,
      balance: newBalance,
    };
  }
  return null;
}

export function getTodayActiveUsers(): number {
  const today = new Date().toDateString();
  return DUMMY_USERS.filter(u => {
    const lastActive = new Date(u.lastActive).toDateString();
    return lastActive === today;
  }).length;
}

export function getTotalBalance(): number {
  return DUMMY_USERS.reduce((sum, u) => sum + u.balance, 0);
}
