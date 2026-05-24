import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// 1. POST: Create task (Manager/Admin)
export async function POST(req: NextRequest) {
  try {
    const { title, description, priority, deadline, assignedToId, assignedById, isRecurring, recurrenceInterval, dependencyIds } = await req.json();

    if (!title || !description || !priority || !deadline || !assignedToId || !assignedById) {
      return NextResponse.json({ error: 'Missing mandatory task assignment fields.' }, { status: 400 });
    }

    // Fetch actor name for audit logs
    const manager = await prisma.user.findUnique({
      where: { id: assignedById },
      select: { name: true }
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        deadline: new Date(deadline),
        assignedToId,
        assignedById,
        status: 'PENDING',
        progress: 0,
        isRecurring: !!isRecurring,
        recurrenceInterval: recurrenceInterval || null,
        dependencies: dependencyIds && dependencyIds.length > 0 ? {
          create: dependencyIds.map((depId: string) => ({
            dependsOnId: depId
          }))
        } : undefined
      }
    });

    // Write history log
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        action: 'Task Created & Assigned',
        actorName: manager?.name || 'Manager'
      }
    });

    // Notify employee
    const dateStr = new Date(deadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    await createNotification({
      userId: assignedToId,
      type: 'TASK_ASSIGNED',
      message: `A new task has been assigned to you: "${title}".`,
      emailSubject: `New Task Assigned: ${title}`,
      emailBody: `A new task has been delegated to you by ${manager?.name || 'administration'}:\n\nTitle: "${title}"\nDescription: "${description}"\nTarget Deadline: ${dateStr}\nPriority: ${priority}\n\nPlease check your employee task board inside the portal to begin work.`
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('[API TASKS POST ERROR] Failed to delegate task:', error);
    return NextResponse.json({ error: 'Internal server error allocating task.' }, { status: 500 });
  }
}

// 2. PATCH: Update task progress, submit deliverables, or audit reviews
export async function PATCH(req: NextRequest) {
  try {
    const { id, status, progress, comment, proofFile, employeeId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing task identifier.' }, { status: 400 });
    }

    // Fetch existing task details first to assess actor
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        assignedBy: true
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (typeof progress === 'number') updateData.progress = progress;

    // Increment reopened count if manager reopens
    const isEmployee = employeeId && employeeId === existingTask.assignedToId;
    const isReopening = !isEmployee && status === 'IN_PROGRESS' && (existingTask.status === 'REVIEW' || existingTask.status === 'COMPLETED');
    if (isReopening) {
      updateData.reopenedCount = { increment: 1 };
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData
    });

    // Evaluate actors and workflow state changes
    const actorName = isEmployee ? existingTask.assignedTo.name : existingTask.assignedBy.name;

    // Trigger specific logs and notification paths
    if (isEmployee) {
      // 2A. Employee updates task
      if (status === 'REVIEW') {
        // Record task deliverable proof, comment AND progress snapshot
        await prisma.taskUpdate.create({
          data: {
            taskId: id,
            employeeId: employeeId,
            comment: comment || 'Task submitted for review.',
            proofFile: proofFile || null,
            progress: typeof progress === 'number' ? progress : existingTask.progress
          }
        });

        await prisma.taskHistory.create({
          data: {
            taskId: id,
            action: 'Submitted deliverables for Manager audit',
            actorName
          }
        });

        // Notify manager
        await createNotification({
          userId: existingTask.assignedById,
          type: 'TASK_REVIEW',
          message: `${actorName} submitted task for review: "${task.title}".`,
          emailSubject: `Task Review Submission: ${task.title}`,
          emailBody: `Team member ${actorName} has completed work and submitted deliverables for review for the task:\n\n"${task.title}"\n\nComment: "${comment || 'No comment added'}"\n\nPlease log in to the manager panel to review the deliverables and complete or reopen the task.`
        });
      } else {
        // Progress slider update — record timestamped progress snapshot
        await prisma.taskUpdate.create({
          data: {
            taskId: id,
            employeeId: employeeId,
            comment: comment || `Progress updated to ${progress}%`,
            proofFile: null,
            progress: typeof progress === 'number' ? progress : existingTask.progress
          }
        });

        await prisma.taskHistory.create({
          data: {
            taskId: id,
            action: `Updated completion progress to ${progress}%`,
            actorName
          }
        });
      }
    } else {
      // 2B. Manager audits task (COMPLETED or IN_PROGRESS reopen)
      if (status === 'COMPLETED') {
        await prisma.taskHistory.create({
          data: {
            taskId: id,
            action: 'Task Deliverables Approved & Completed',
            actorName
          }
        });

        // Notify employee
        await createNotification({
          userId: existingTask.assignedToId,
          type: 'TASK_COMPLETED',
          message: `Your task "${task.title}" was APPROVED by your manager.`,
          emailSubject: `Task Approved & Completed: ${task.title}`,
          emailBody: `Excellent work! Your department manager has reviewed your submission for the task "${task.title}" and approved it.\n\nThis task is now marked as COMPLETED.`
        });
      } else if (isReopening) {
        // Reopened by manager
        await prisma.taskHistory.create({
          data: {
            taskId: id,
            action: `Task Reopened by Manager (Reopen Count: ${existingTask.reopenedCount + 1})`,
            actorName
          }
        });

        // Notify employee
        await createNotification({
          userId: existingTask.assignedToId,
          type: 'TASK_REOPENED',
          message: `Your task "${task.title}" was REOPENED by your manager.`,
          emailSubject: `Task Reopened: ${task.title}`,
          emailBody: `Your department manager has reviewed your submission for the task "${task.title}" and requested further edits.\n\nManager Feedback: "${comment || 'No comment left'}"\n\nPlease address the feedback and resubmit.`
        });
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('[API TASKS PATCH ERROR] Failed to update task:', error);
    return NextResponse.json({ error: 'Internal server error updating task.' }, { status: 500 });
  }
}

// 3. DELETE: Wipe task assignment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing task identifier.' }, { status: 400 });
    }

    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('[API TASKS DELETE ERROR] Failed to delete task:', error);
    return NextResponse.json({ error: 'Internal server error deleting task.' }, { status: 500 });
  }
}
