import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// 1. POST: Employee applies for leave
export async function POST(req: NextRequest) {
  try {
    const { employeeId, startDate, endDate, reason } = await req.json();

    if (!employeeId || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Missing mandatory leave parameters.' }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason
      }
    });

    // Notify the employee's department head
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

    if (employee?.department?.head) {
      const startStr = new Date(startDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
      const endStr = new Date(endDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      await createNotification({
        userId: employee.department.head.id,
        type: 'LEAVE_SUBMITTED',
        message: `${employee.name} applied for leave (${startStr} - ${endStr}).`,
        emailSubject: `New Leave Application: ${employee.name}`,
        emailBody: `Your team member, ${employee.name}, has submitted a leave application for the duration of ${startStr} to ${endStr}.\n\nReason: "${reason}"\n\nPlease log in to the dashboard to approve or reject this request.`
      });
    }

    return NextResponse.json(leave);
  } catch (error) {
    console.error('[API LEAVES POST ERROR] Failed to log leave application:', error);
    return NextResponse.json({ error: 'Internal server error saving request.' }, { status: 500 });
  }
}

// 2. PATCH: Admin/Manager approves or rejects leave
export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing leave identifier or audit status.' }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status }
    });

    // Notify employee about the audit decision
    const startStr = new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
    const endStr = new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' });

    await createNotification({
      userId: leave.employeeId,
      type: 'LEAVE_STATUS',
      message: `Your leave request for ${startStr} - ${endStr} has been ${status.toUpperCase()}.`,
      emailSubject: `Leave Request Update: ${status}`,
      emailBody: `Your leave request for the duration of ${startStr} to ${endStr} has been reviewed and marked as ${status} by your department administration.`
    });

    return NextResponse.json(leave);
  } catch (error) {
    console.error('[API LEAVES PATCH ERROR] Failed to audit leave request:', error);
    return NextResponse.json({ error: 'Internal server error auditing request.' }, { status: 500 });
  }
}
