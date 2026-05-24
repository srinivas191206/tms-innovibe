import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { generateTOTPSecret } from '@/lib/totp';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated session' }, { status: 401 });
    }

    // 1. Generate standard Base32 secret key
    const secret = generateTOTPSecret();

    // 2. Temporarily write it to the database pending verification challenge
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret
      }
    });

    // 3. Compile otpauth URI for barcode scan compatibility
    const issuer = 'InnoVibe';
    const email = session.user.email;
    const qrUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

    return NextResponse.json({
      secret,
      qrUri
    });

  } catch (error: any) {
    console.error('[MFA SETUP ERROR] Failed provisioning TOTP secret:', error);
    return NextResponse.json({ error: 'MFA setup provisioning failed: ' + error.message }, { status: 500 });
  }
}
