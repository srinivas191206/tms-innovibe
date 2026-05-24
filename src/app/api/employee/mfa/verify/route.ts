import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { verifyTOTPCode } from '@/lib/totp';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated session' }, { status: 401 });
    }

    const { code, action } = await req.json(); // action: "ENABLE" or "DISABLE"

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'MFA setup keys have not been provisioned.' }, { status: 400 });
    }

    // Challenge check in standard TOTP skew
    const isValid = await verifyTOTPCode(user.twoFactorSecret, code);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification passcode. Please try again.' }, { status: 400 });
    }

    if (action === 'DISABLE') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null
        }
      });

      // Audit Log log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'MFA_DISABLED',
          details: 'Two-Factor Authentication was successfully disabled.'
        }
      });

      return NextResponse.json({ success: true, enabled: false });
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: true
        }
      });

      // Audit Log log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'MFA_ENABLED',
          details: 'Two-Factor Authentication was successfully activated.'
        }
      });

      return NextResponse.json({ success: true, enabled: true });
    }

  } catch (error: any) {
    console.error('[MFA VERIFICATION CHALLENGE ERROR] Verification failed:', error);
    return NextResponse.json({ error: 'MFA Verification failed: ' + error.message }, { status: 500 });
  }
}
