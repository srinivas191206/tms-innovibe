import prisma from './db';
import { sendEmail } from './email';

interface NotificationParams {
  userId: string;
  type: string; // e.g., "TASK_ASSIGNED", "LATE_ALERT", "LEAVE_STATUS", "MISSING_CHECKOUT", "TASK_REVIEW"
  message: string;
  emailSubject?: string;
  emailBody?: string;
}

export async function createNotification({
  userId,
  type,
  message,
  emailSubject,
  emailBody,
}: NotificationParams) {
  try {
    // 1. Create the persistent in-app notification in PostgreSQL
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        read: false,
      },
    });

    // 2. Fetch user details to dispatch email in the background
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user && emailSubject && emailBody) {
      const plainText = `Hi ${user.name},\n\n${emailBody}\n\n---\nInnovibe TMS & AI Attendance Portal\nThis is an automated system notification. Please do not reply directly.`;
      
      const htmlBody = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
          <h2 style="color: #6366f1; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">Innovibe Notification</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #334155;">Hello <strong>${user.name}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155; padding: 15px 0; font-style: italic;">
            "${emailBody}"
          </p>
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
            Sent by Innovibe TMS & AI Attendance Portal.
          </div>
        </div>
      `;

      // Async send (do not await to keep APIs lightning fast)
      sendEmail({
        to: user.email,
        subject: emailSubject,
        text: plainText,
        html: htmlBody,
      }).catch((err) => {
        console.error(`[BG EMAIL ERROR] Could not dispatch notification email for user ${userId}:`, err);
      });
    }

    return notification;
  } catch (error) {
    console.error(`[NOTIFICATION ERROR] Failed to create in-app alert for user ${userId}:`, error);
    return null;
  }
}
