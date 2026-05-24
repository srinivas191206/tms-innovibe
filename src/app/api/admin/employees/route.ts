import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

// 1. POST: Create employee account
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, departmentId } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing mandatory account fields.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return NextResponse.json({ error: 'An account is already registered with this email.' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        password: hashedPassword,
        role,
        departmentId: departmentId || null
      }
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('[API ADMIN EMP POST ERROR] Failed to create employee:', error);
    return NextResponse.json({ error: 'Internal server error creating account.' }, { status: 500 });
  }
}

// 2. PATCH: Modify employee details
export async function PATCH(req: NextRequest) {
  try {
    const { id, name, email, password, role, departmentId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing user identifier.' }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role;
    
    // Convert empty string/null explicitly for departments
    updateData.departmentId = departmentId || null;

    // Hash and append password only if user typed one
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('[API ADMIN EMP PATCH ERROR] Failed to update employee:', error);
    return NextResponse.json({ error: 'Internal server error editing account.' }, { status: 500 });
  }
}

// 3. DELETE: De-register employee
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing user identifier.' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Employee wiped successfully.' });
  } catch (error) {
    console.error('[API ADMIN EMP DELETE ERROR] Failed to delete user:', error);
    return NextResponse.json({ error: 'Internal server error deleting account.' }, { status: 500 });
  }
}
