import React from 'react';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettings() {
  // Retrieve global settings. If missing, automatically initialize them.
  let setting = await prisma.setting.findUnique({
    where: { id: 'global_settings' }
  });

  if (!setting) {
    setting = await prisma.setting.create({
      data: {
        id: 'global_settings',
        officeStartTime: '09:00',
        officeEndTime: '17:00',
        emailsEnabled: true
      }
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-outfit">Portal Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Configure corporate work schedules, office lateness thresholds, and email dispatch switches.</p>
        </div>
        <SettingsClient initialSetting={setting} />
      </div>
    </DashboardLayout>
  );
}
