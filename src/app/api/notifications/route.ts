import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// 1. GET: Retrieve user's in-app notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('[API NOTIFICATIONS GET ERROR] Failed to fetch alerts:', error);
    return NextResponse.json({ error: 'Internal server error fetching alerts.' }, { status: 500 });
  }
}

// 2. PUT: Mark all notifications as READ
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('[API NOTIFICATIONS PUT ERROR] Failed to clear notifications:', error);
    return NextResponse.json({ error: 'Internal server error clearing alerts.' }, { status: 500 });
  }
}

// 3. PATCH: Mark a single notification as READ
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing notification identifier.' }, { status: 400 });
    }

    const updated = await prisma.notification.updateMany({
      where: {
        id,
        userId: session.user.id
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({ success: true, message: 'Notification cleared.' });
  } catch (error) {
    console.error('[API NOTIFICATIONS PATCH ERROR] Failed to clear alert:', error);
    return NextResponse.json({ error: 'Internal server error clearing alert.' }, { status: 500 });
  }
}
