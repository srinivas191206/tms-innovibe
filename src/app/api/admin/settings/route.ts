import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// PUT: Modify global office timing configurations
export async function PUT(req: NextRequest) {
  try {
    const { officeStartTime, officeEndTime, emailsEnabled } = await req.json();

    const setting = await prisma.setting.upsert({
      where: { id: 'global_settings' },
      update: {
        officeStartTime,
        officeEndTime,
        emailsEnabled: !!emailsEnabled
      },
      create: {
        id: 'global_settings',
        officeStartTime,
        officeEndTime,
        emailsEnabled: !!emailsEnabled
      }
    });

    // Also update current environment variables temporarily
    process.env.EMAILS_ENABLED = emailsEnabled ? 'true' : 'false';

    return NextResponse.json(setting);
  } catch (error) {
    console.error('[API ADMIN SETTINGS PUT ERROR] Failed to save settings:', error);
    return NextResponse.json({ error: 'Internal server error updating configuration.' }, { status: 500 });
  }
}
