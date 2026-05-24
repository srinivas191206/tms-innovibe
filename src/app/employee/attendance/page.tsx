import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import AttendanceScannerClient from './AttendanceScannerClient';

export const dynamic = 'force-dynamic';

export default async function EmployeeAttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Today's boundaries
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Check today's logged attendance
  const todayAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId: session.user.id,
      checkIn: {
        gte: startOfToday,
        lte: endOfToday
      }
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit">AI Biometric Portal</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Situate your face inside the dashed reticle and ensure location permissions are active to log your entry.</p>
        </div>
        <AttendanceScannerClient todayAttendance={todayAttendance} userId={session.user.id} />
      </div>
    </DashboardLayout>
  );
}
