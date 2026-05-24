import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import TeamAttendanceClient from './TeamAttendanceClient';

export const dynamic = 'force-dynamic';

export default async function TeamAttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // 1. Identify which department this manager oversees
  const department = await prisma.department.findFirst({
    where: { headId: session.user.id },
    include: {
      members: {
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!department) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-2xl max-w-xl mx-auto">
          Please ask the Administrator to assign you to a department to view team attendance.
        </div>
      </DashboardLayout>
    );
  }

  const teamMemberIds = department.members.map((m) => m.id);

  // 2. Fetch historic attendance logs for team members only
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: teamMemberIds }
    },
    include: {
      employee: {
        include: {
          department: true
        }
      }
    },
    orderBy: { checkIn: 'desc' }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit">Team Attendance Audit</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Inspect physical check-in selfies, verify team GPS pins, and monitor late logins.</p>
        </div>
        <TeamAttendanceClient 
          initialRecords={attendances} 
          teamMembers={department.members} 
        />
      </div>
    </DashboardLayout>
  );
}
