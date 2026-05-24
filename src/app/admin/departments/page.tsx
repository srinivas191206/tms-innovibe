import React from 'react';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import DepartmentsClient from './DepartmentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminDepartments() {
  // Fetch departments with their head details and member counts
  const departments = await prisma.department.findMany({
    include: {
      head: true,
      _count: {
        select: { members: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Fetch all users with DEPT_HEAD roles to assign as managers
  const eligibleHeads = await prisma.user.findMany({
    where: { role: 'DEPT_HEAD' },
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: { name: 'asc' }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit">Department Administration</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Establish corporate structures, appoint department heads, and monitor team sizing.</p>
        </div>
        <DepartmentsClient initialDepartments={departments} eligibleHeads={eligibleHeads} />
      </div>
    </DashboardLayout>
  );
}
