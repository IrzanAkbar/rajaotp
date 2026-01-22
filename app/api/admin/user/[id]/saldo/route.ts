import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/app/lib/admin-auth';
import { getAllUsers } from '@/app/lib/dummy-data';

async function isAdminAuthorized(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return false;
  return await verifyAdminToken(token);
}

// Store for updated balances (in real app, this would be database)
const updatedBalances: Record<string, number> = {};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthorized(req))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { balance } = await req.json();

    // Validation
    if (balance === undefined || balance === null) {
      return NextResponse.json(
        { error: 'Balance is required' },
        { status: 400 }
      );
    }

    if (typeof balance !== 'number' || balance < 0) {
      return NextResponse.json(
        { error: 'Balance must be a positive number' },
        { status: 400 }
      );
    }

    // Find user
    const user = getAllUsers().find(u => u.id === id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update balance (in memory)
    updatedBalances[id] = balance;

    return NextResponse.json({
      success: true,
      message: 'Balance updated successfully',
      data: {
        ...user,
        balance,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
