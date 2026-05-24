import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// 1. POST: Create new department
export async function POST(req: NextRequest) {
  try {
    const { name, headId } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Department name is mandatory.' }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json({ error: 'A department already exists with this name.' }, { status: 400 });
    }

    const dept = await prisma.department.create({
      data: {
        name,
        headId: headId || null
      }
    });

    // If headId is provided, link that manager to this department immediately
    if (headId) {
      await prisma.user.update({
        where: { id: headId },
        data: { departmentId: dept.id }
      });
    }

    return NextResponse.json(dept);
  } catch (error) {
    console.error('[API ADMIN DEPT POST ERROR] Failed to create department:', error);
    return NextResponse.json({ error: 'Internal server error creating team.' }, { status: 500 });
  }
}

// 2. PATCH: Update department manager
export async function PATCH(req: NextRequest) {
  try {
    const { id, headId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing department identifier.' }, { status: 400 });
    }

    // Update department manager
    const dept = await prisma.department.update({
      where: { id },
      data: {
        headId: headId || null
      }
    });

    // If a manager is linked, update their department id as well
    if (headId) {
      await prisma.user.update({
        where: { id: headId },
        data: { departmentId: id }
      });
    }

    return NextResponse.json(dept);
  } catch (error) {
    console.error('[API ADMIN DEPT PATCH ERROR] Failed to update manager:', error);
    return NextResponse.json({ error: 'Internal server error editing team manager.' }, { status: 500 });
  }
}

// 3. DELETE: De-register department
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing department identifier.' }, { status: 400 });
    }

    // Decouple members first to prevent constraint violations
    await prisma.user.updateMany({
      where: { departmentId: id },
      data: { departmentId: null }
    });

    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    console.error('[API ADMIN DEPT DELETE ERROR] Failed to delete department:', error);
    return NextResponse.json({ error: 'Internal server error deleting team.' }, { status: 500 });
  }
}
