import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/app/lib/admin-auth';
import { getAllUsersWithSaldo, searchBotUsers } from '@/app/lib/bot-data';

async function isAdminAuthorized(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return false;
  return await verifyAdminToken(token);
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthorized(req))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Get users from bot data (either all or search results)
    let users = search ? searchBotUsers(search) : getAllUsersWithSaldo();

    // Transform to match expected format
    const transformedUsers = users.map((u, index) => ({
      id: u.userId,
      username: `User_${u.userId}`,
      email: `user_${u.userId}@bot.local`,
      balance: u.saldo,
      lastActive: new Date().toISOString(), // Bot doesn't track this
      createdAt: new Date().toISOString(), // Bot doesn't track this
      status: u.saldo > 0 ? 'active' : 'inactive',
      telegramId: u.userId,
    }));

    // Pagination
    const total = transformedUsers.length;
    const start = (page - 1) * limit;
    const paginatedUsers = transformedUsers.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
