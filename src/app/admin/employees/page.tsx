import React from 'react';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import EmployeesClient from './EmployeesClient';

export const dynamic = 'force-dynamic';

export default async function AdminEmployees() {
  // Fetch all users with their associated department
  const users = await prisma.user.findMany({
    include: {
      department: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch all departments for selection dropdowns
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit">Employee Roster</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Approve new user accounts, modify role scopes, and assign employees to departments.</p>
        </div>
        <EmployeesClient initialUsers={users} departments={departments} />
      </div>
    </DashboardLayout>
  );
}
