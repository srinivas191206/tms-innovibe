import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import LeavesClient from '@/components/LeavesClient';

export const dynamic = 'force-dynamic';

export default async function EmployeeLeavesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Retrieve leave applications submitted by this employee
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: session.user.id
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit">Leave Application Terminal</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Submit out of office requests, monitor manager approvals, and log reasons.</p>
        </div>
        <LeavesClient initialLeaves={leaves} employeeId={session.user.id} />
      </div>
    </DashboardLayout>
  );
}
