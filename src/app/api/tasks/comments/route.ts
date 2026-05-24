import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// 1. GET: Fetch comments for a specific task
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Missing task identifier.' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('[API COMMENTS GET ERROR] Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Internal server error fetching comments.' }, { status: 500 });
  }
}

// 2. POST: Add a new comment/discussion item to a task
export async function POST(req: NextRequest) {
  try {
    const { taskId, userId, content } = await req.json();

    if (!taskId || !userId || !content || content.trim() === '') {
      return NextResponse.json({ error: 'Missing mandatory comment details.' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
            role: true
          }
        }
      }
    });

    // Write a task history event for the comment activity log
    await prisma.taskHistory.create({
      data: {
        taskId,
        action: 'Added a comment/discussion entry',
        actorName: comment.user.name
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('[API COMMENTS POST ERROR] Failed to create comment:', error);
    return NextResponse.json({ error: 'Internal server error publishing comment.' }, { status: 500 });
  }
}
