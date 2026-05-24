import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import EmployeeSettingsClient from './EmployeeSettingsClient';

export const dynamic = 'force-dynamic';

export default async function EmployeeSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;

  // Fetch fresh user data from the database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      photo: true,
      gender: true,
      dob: true,
      twoFactorEnabled: true,
    }
  });

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit">My Profile & Security Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your personal demographics, update login credentials, and capture or upload your profile picture.</p>
        </div>
        
        {/* Render interactive settings dashboard */}
        <EmployeeSettingsClient initialUser={user} />
      </div>
    </DashboardLayout>
  );
}
