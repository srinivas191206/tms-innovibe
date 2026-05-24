import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const { employeeId, selfieBase64, latitude, longitude } = await req.json();
    console.log('[DEBUG CHECK-IN PAYLOAD]', { 
      employeeId, 
      selfieBase64Length: selfieBase64?.length, 
      latitude, 
      longitude 
    });

    if (!employeeId || !selfieBase64) {
      return NextResponse.json({ error: 'Missing employee identifier or snapshot.' }, { status: 400 });
    }

    // 1. Resolve user IP Address
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 2. Convert selfie Base64 snapshot to binary file & write to public/uploads/
    const base64Data = selfieBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const selfieName = `selfie_${employeeId}_${Date.now()}.jpg`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, selfieName);
    fs.writeFileSync(filePath, buffer);
    const selfieRelativeUrl = `/uploads/${selfieName}`;

    // 3. Evaluate Lateness based on global settings
    let setting = await prisma.setting.findUnique({
      where: { id: 'global_settings' }
    });

    if (!setting) {
      setting = await prisma.setting.create({
        data: { id: 'global_settings' }
      });
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const [officeHour, officeMinute] = setting.officeStartTime.split(':').map(Number);
    
    let status = 'PRESENT';
    if (currentHour > officeHour || (currentHour === officeHour && currentMinute > officeMinute)) {
      status = 'LATE';
    }

    // 4. Save Attendance check-in to database
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: now,
        status,
        selfieUrl: selfieRelativeUrl,
        latitude: parseFloat(latitude) || null,
        longitude: parseFloat(longitude) || null,
        ipAddress
      }
    });

    // 5. If Late, notify employee & dispatch alert email to department head
    if (status === 'LATE') {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        include: {
          department: {
            include: {
              head: true
            }
          }
        }
      });

      // Notify the late employee
      await createNotification({
        userId: employeeId,
        type: 'LATE_ALERT',
        message: `You checked in LATE today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      });

      // Notify their Department Head
      if (employee?.department?.head) {
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        await createNotification({
          userId: employee.department.head.id,
          type: 'LATE_ALERT',
          message: `${employee.name} checked in LATE today at ${timeStr}.`,
          emailSubject: `Late Login Alert: ${employee.name}`,
          emailBody: `This is to alert you that team member ${employee.name} checked in LATE today at ${timeStr}.\n\nYou can review their attendance card details inside the department dashboard.`
        });
      }
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('[API CHECK-IN ERROR] Failed to record check-in:', error);
    return NextResponse.json({ error: 'Internal server error recording check-in.' }, { status: 500 });
  }
}
