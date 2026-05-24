import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employee identifier.' }, { status: 400 });
    }

    // 1. Fetch today's boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Look up today's active check-in record
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkIn: {
          gte: startOfToday,
          lte: endOfToday
        },
        checkOut: null
      }
    });

    if (!activeAttendance) {
      return NextResponse.json({ error: 'No active check-in record found for today.' }, { status: 400 });
    }

    // 3. Log check-out timestamp
    const attendance = await prisma.attendance.update({
      where: { id: activeAttendance.id },
      data: {
        checkOut: new Date()
      }
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('[API CHECK-OUT ERROR] Failed to record check-out:', error);
    return NextResponse.json({ error: 'Internal server error recording check-out.' }, { status: 500 });
  }
}
