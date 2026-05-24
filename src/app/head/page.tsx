import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Briefcase, 
  Clock, 
  CheckSquare, 
  MapPin, 
  AlertTriangle,
  Award,
  BookOpen,
  Cake,
  Bell
} from 'lucide-react';
import HeadClient from './HeadClient';
import HeadAnalytics from './HeadAnalytics';
import ExportReportsButton from '@/components/ExportReportsButton';
import { runOperationalEscalationAudit } from '@/lib/escalation';

/** Returns true if the given DOB string (YYYY-MM-DD) falls on tomorrow (year-agnostic) */
function isBirthdayTomorrow(dobString: string | null): boolean {
  if (!dobString) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const parts = dobString.split('-');
  if (parts.length < 3) return false;
  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);
  return tomorrow.getMonth() + 1 === birthMonth && tomorrow.getDate() === birthDay;
}

export const dynamic = 'force-dynamic';

export default async function HeadDashboard() {
  // Trigger background operational escalations and delay triggers dynamically
  runOperationalEscalationAudit().catch(err => console.error("[BG ESCALATION ERR] Trigger failed:", err));

  const session = await getServerSession(authOptions);
  if (!session) return null;

  // 1. Identify which department this manager oversees
  const department = await prisma.department.findFirst({
    where: { headId: session.user.id },
    include: {
      members: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          dob: true,
          role: true
        }
      }
    }
  });

  if (!department) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center space-y-6 py-12 animate-in fade-in duration-300">
          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-3xl w-16 h-16 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-outfit">Onboarding Manager Account</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your profile is registered as a <strong>Department Head</strong>, but you have not been linked to manage any department yet.
            </p>
          </div>
          <div className="p-5 bg-card border border-border rounded-2xl text-xs text-left leading-relaxed max-w-md mx-auto space-y-2">
            <span className="font-bold text-indigo-400 block mb-1">Administrative Steps:</span>
            <p>1. Log in as an Administrator (`admin@innovibe.com`).</p>
            <p>2. Open "Manage Departments" in the sidebar.</p>
            <p>3. Create a department (e.g. "Engineering") and appoint `{session.user.name}` as Manager.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 2. Fetch today's date bounds
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const teamMemberIds = department.members.map((m) => m.id);

  // 3. Fetch today's team attendance
  const teamAttendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: teamMemberIds },
      checkIn: { gte: startOfToday, lte: endOfToday }
    },
    include: { employee: true }
  });

  // 4. Fetch team tasks
  const teamTasks = await prisma.task.findMany({
    where: { assignedToId: { in: teamMemberIds } },
    include: {
      assignedTo: true,
      updates: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 5. Fetch team leaves
  const teamLeaves = await prisma.leaveRequest.findMany({
    where: { employeeId: { in: teamMemberIds } },
    include: { employee: true },
    orderBy: { createdAt: 'desc' }
  });

  // Compute metrics
  const totalTeamTasks = teamTasks.length;
  const pendingTasks = teamTasks.filter((t) => t.status === 'PENDING').length;
  const inProgressTasks = teamTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedTasks = teamTasks.filter((t) => t.status === 'COMPLETED').length;
  const reviewTasks = teamTasks.filter((t) => t.status === 'REVIEW');

  const presentToday = teamAttendances.length;
  const absentToday = Math.max(0, department.members.length - presentToday);
  const lateTodayCount = teamAttendances.filter((a) => a.status === 'LATE').length;

  // Birthday reminders – department members celebrating tomorrow
  const tomorrowBirthdays = department.members.filter((m) => isBirthdayTomorrow(m.dob));

  // Compute analytics status distribution
  const taskStatusDistribution = [
    { name: 'Pending', value: pendingTasks, color: '#64748b' },
    { name: 'In Progress', value: inProgressTasks, color: '#6366f1' },
    { name: 'Awaiting Audit', value: reviewTasks.length, color: '#f59e0b' },
    { name: 'Completed', value: completedTasks, color: '#10b981' }
  ];

  // Compute team attendance rate over the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 10); // Fetch 10 days back to cover weekends

  const recentTeamAttendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: teamMemberIds },
      checkIn: { gte: sevenDaysAgo }
    },
    select: {
      checkIn: true
    }
  });

  const attendancesByDate: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    attendancesByDate[dateStr] = 0;
  }

  recentTeamAttendances.forEach(att => {
    const dateStr = new Date(att.checkIn).toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (attendancesByDate[dateStr] !== undefined) {
      attendancesByDate[dateStr]++;
    }
  });

  const totalTeamSize = department.members.length;
  const attendanceTrend = Object.keys(attendancesByDate).map(date => {
    const count = attendancesByDate[date];
    const rate = totalTeamSize > 0 ? Math.round((count / totalTeamSize) * 100) : 0;
    return {
      date,
      rate: Math.min(100, rate)
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Department Banner Header */}
        <div className="p-6 bg-gradient-to-br from-[#1e1b4b]/60 to-[#0f172a]/60 border border-border rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6 glass">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 rounded-lg text-[10px] font-extrabold tracking-wider uppercase">Managed Department</span>
            <h2 className="text-2xl font-bold font-outfit mt-1">{department.name} Operations Hub</h2>
            <p className="text-xs text-muted-foreground">Monitor employee workloads, verify face attendance captures, and audit deliverables.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <ExportReportsButton 
              tasks={teamTasks} 
              attendance={teamAttendances} 
              leaves={teamLeaves} 
              filenamePrefix={`head_${department.name.toLowerCase()}`}
            />
            <div className="text-center bg-secondary/50 border border-border rounded-2xl px-5 py-3 min-w-[100px]">
              <p className="text-2xl font-extrabold font-outfit text-indigo-400">{department.members.length}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">Team Sizing</p>
            </div>
            <div className="text-center bg-secondary/50 border border-border rounded-2xl px-5 py-3 min-w-[100px]">
              <p className="text-2xl font-extrabold font-outfit text-emerald-400">{presentToday}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">Online Now</p>
            </div>
          </div>
        </div>

        {/* 🎂 DEPARTMENT BIRTHDAY REMINDER BANNER */}
        {tomorrowBirthdays.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-5 shadow-md">
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-orange-300/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-200">
                  <Cake className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Birthday Alert</span>
                  </div>
                  <p className="text-sm font-bold text-amber-900 mt-0.5">
                    {tomorrowBirthdays.length === 1
                      ? `${tomorrowBirthdays[0].name}'s birthday is tomorrow — send wishes! 🎉`
                      : `${tomorrowBirthdays.length} team members celebrate their birthdays tomorrow!`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                {tomorrowBirthdays.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-2 px-3 py-2 bg-white/80 border border-amber-200 rounded-xl shadow-sm"
                  >
                    <span className="text-base leading-none">🎂</span>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{person.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Summary */}

        {/* STATS CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Active Assignments</p>
              <p className="text-3xl font-extrabold font-outfit">{totalTeamTasks}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Awaiting Audit</p>
              <p className="text-3xl font-extrabold font-outfit text-indigo-500">{reviewTasks.length}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Lateness Alerts</p>
              <p className="text-3xl font-extrabold font-outfit text-amber-500">{lateTodayCount}</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Absences Today</p>
              <p className="text-3xl font-extrabold font-outfit text-rose-500">{absentToday}</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Dynamic Head Analytics Charts */}
        <HeadAnalytics
          taskStatusDistribution={taskStatusDistribution}
          attendanceTrend={attendanceTrend}
        />

        {/* WORKSPACE PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workload Roster */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold font-outfit">Team Capacity & Timings</h3>
            
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border font-bold text-muted-foreground">
                      <th className="p-4">Employee</th>
                      <th className="p-4">Today's Entry</th>
                      <th className="p-4">Check-in Status</th>
                      <th className="p-4">Active Tasks Ratio</th>
                      <th className="p-4">GPS Anchor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {department.members.map((member) => {
                      const todayAtt = teamAttendances.find((a) => a.employeeId === member.id);
                      const memberTasks = teamTasks.filter((t) => t.assignedToId === member.id);
                      const openTasks = memberTasks.filter((t) => t.status !== 'COMPLETED').length;

                      return (
                        <tr key={member.id} className="hover:bg-secondary/15 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="font-bold text-sm leading-snug">{member.name}</p>
                              <p className="text-muted-foreground text-[10px] mt-0.5">{member.email}</p>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-semibold">
                            {todayAtt 
                              ? new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : <span className="text-rose-500/60 font-sans italic font-normal">Unrecorded</span>}
                          </td>
                          <td className="p-4">
                            {todayAtt ? (
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                                todayAtt.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-500' :
                                todayAtt.status === 'LATE' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-rose-500/10 text-rose-500'
                              }`}>
                                {todayAtt.status}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-bold">ABSENT</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-500">
                              {openTasks} active / {memberTasks.length} total
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground font-mono">
                            {todayAtt?.latitude ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>{todayAtt.latitude.toFixed(3)}, {todayAtt.longitude?.toFixed(3)}</span>
                              </span>
                            ) : (
                              <span className="italic text-muted-foreground/40">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Deliverables Review Queue */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-outfit">Deliverables Audit Queue ({reviewTasks.length})</h3>
            <HeadClient reviewTasks={reviewTasks} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
