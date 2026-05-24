import prisma from './db';
import { createNotification } from './notifications';

export async function runOperationalEscalationAudit() {
  try {
    const now = new Date();

    // ==========================================
    // 1. OVERDUE TASK ESCALATIONS
    // ==========================================
    // Fetch all active tasks that have passed their deadline
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS', 'REVIEW'] },
        deadline: { lt: now }
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            departmentId: true
          }
        }
      }
    });

    for (const task of overdueTasks) {
      const uniqueEscalationKey = `[OVERDUE ESCALATION] Task "${task.title}" is overdue since ${task.deadline.toISOString().split('T')[0]}`;
      
      // Prevent duplicate notification alerts
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: task.assignedTo.id,
          message: { contains: task.title },
          type: 'TASK_ESCALATION'
        }
      });

      if (!existingNotification) {
        // A. Notify the assignee
        await createNotification({
          userId: task.assignedTo.id,
          type: 'TASK_ESCALATION',
          message: `Your assigned task "${task.title}" is overdue! Deadline was ${task.deadline.toLocaleDateString()}. Please submit updates immediately.`,
          emailSubject: `[ACTION REQUIRED] Overdue Task Notification: ${task.title}`,
          emailBody: `Your task "${task.title}" has missed its designated deadline of ${task.deadline.toLocaleDateString()}. Please update the progress or coordinate with your manager.`
        });

        // B. Notify the Department Head (if employee is in a department)
        if (task.assignedTo.departmentId) {
          const dept = await prisma.department.findUnique({
            where: { id: task.assignedTo.departmentId },
            select: { headId: true }
          });

          if (dept?.headId) {
            await createNotification({
              userId: dept.headId,
              type: 'TASK_ESCALATION',
              message: `Alert: Task "${task.title}" assigned to ${task.assignedTo.name} has exceeded its deadline (${task.deadline.toLocaleDateString()}).`,
              emailSubject: `[OVERDUE ESCALATION] ${task.assignedTo.name} - Overdue Task Alert`,
              emailBody: `This is a department head escalation alert. The task "${task.title}" assigned to ${task.assignedTo.name} has missed its scheduled deadline of ${task.deadline.toLocaleDateString()}.`
            });
          }
        }
      }
    }

    // ==========================================
    // 2. LATE ARRIVALS ESCALATIONS
    // ==========================================
    // Fetch all LATE attendances recorded today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayLateEntries = await prisma.attendance.findMany({
      where: {
        status: 'LATE',
        checkIn: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true
          }
        }
      }
    });

    for (const entry of todayLateEntries) {
      if (entry.employee.departmentId) {
        const dept = await prisma.department.findUnique({
          where: { id: entry.employee.departmentId },
          select: { headId: true, name: true }
        });

        if (dept?.headId) {
          const timeStr = new Date(entry.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const escalationMsg = `Escalation: ${entry.employee.name} arrived LATE today at ${timeStr} in the ${dept.name} department.`;

          // Prevent duplicate late arrival notification triggers
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: dept.headId,
              type: 'LATE_ALERT',
              message: { contains: entry.employee.name }
            }
          });

          if (!existingNotif) {
            await createNotification({
              userId: dept.headId,
              type: 'LATE_ALERT',
              message: escalationMsg,
              emailSubject: `[ATTENDANCE LATE ESCALATION] ${entry.employee.name} - Late arrival recorded`,
              emailBody: `${entry.employee.name} checked in LATE today at ${timeStr}. This notification is escalated as a regular department operational standard.`
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('[BG AUDIT ERROR] Failed running automatic escalation triggers:', error);
  }
}
