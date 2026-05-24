import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import ManagerTasksClient from './ManagerTasksClient';

export const dynamic = 'force-dynamic';

export default async function ManagerTasksPage() {
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
          Please ask the Administrator to assign you to a department to enable task delegation.
        </div>
      </DashboardLayout>
    );
  }

  const teamMemberIds = department.members.map((m) => m.id);

  // 2. Fetch all team tasks
  const tasks = await prisma.task.findMany({
    where: {
      assignedToId: { in: teamMemberIds }
    },
    include: {
      assignedTo: true,
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
          <h2 className="text-2xl font-bold font-outfit">Task Administration</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Delegate priorities, check team deadlines, and audit submission checkpoints.</p>
        </div>
        <ManagerTasksClient 
          tasks={tasks} 
          teamMembers={department.members} 
          managerId={session.user.id} 
        />
      </div>
    </DashboardLayout>
  );
}
