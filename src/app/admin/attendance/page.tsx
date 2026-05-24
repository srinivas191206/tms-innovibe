import React from 'react';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import AttendanceClient from './AttendanceClient';

export const dynamic = 'force-dynamic';

export default async function AdminAttendancePage() {
  // Fetch all historical attendance logs
  const records = await prisma.attendance.findMany({
    include: {
      employee: {
        include: {
          department: true
        }
      }
    },
    orderBy: { checkIn: 'desc' }
  });

  // Fetch standard employees list for dropdown filter
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    select: {
      id: true,
      name: true
    },
    orderBy: { name: 'asc' }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit">Corporate Attendance Logs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Review facial check-in selfies, audit geolocation coordinates, and examine network IP footprints.</p>
        </div>
        <AttendanceClient initialRecords={records} employees={employees} />
      </div>
    </DashboardLayout>
  );
}
