import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized credentials.' }, { status: 401 });
    }

    const { name, password, photo, gender, dob } = await req.json();
    const userId = session.user.id;

    const updateData: any = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (photo !== undefined) {
      updateData.photo = photo;
    }

    if (gender !== undefined) {
      updateData.gender = gender;
    }

    if (dob !== undefined) {
      updateData.dob = dob;
    }

    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        photo: true,
        departmentId: true,
        gender: true,
        dob: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('[API UPDATE PROFILE ERROR] Failed:', error);
    return NextResponse.json({ error: 'Internal server error updating profile.' }, { status: 500 });
  }
}
