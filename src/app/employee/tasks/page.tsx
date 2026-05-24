import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import EmployeeTasksClient from './EmployeeTasksClient';

export const dynamic = 'force-dynamic';

export default async function EmployeeTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Retrieve tasks delegated to this employee
  const tasks = await prisma.task.findMany({
    where: {
      assignedToId: session.user.id
    },
    include: {
      assignedBy: true,
      updates: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit">My Active Tasks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track deliverables, update your progress metrics, and upload proof attachments for manager review.</p>
        </div>
        <EmployeeTasksClient tasks={tasks} employeeId={session.user.id} />
      </div>
    </DashboardLayout>
  );
}
