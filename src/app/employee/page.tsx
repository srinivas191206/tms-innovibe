import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import ProfileSettingsClient from './ProfileSettingsClient';
import { 
  Clock, 
  Briefcase, 
  FileText, 
  Bell, 
  CheckCircle, 
  ScanFace, 
  MapPin, 
  CalendarCheck,
  Play
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // 1. Fetch today's date bounds
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 2. Fetch today's attendance log
  const todayAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId: session.user.id,
      checkIn: {
        gte: startOfToday,
        lte: endOfToday
      }
    }
  });

  // 3. Fetch task counts
  const totalTasks = await prisma.task.count({
    where: { assignedToId: session.user.id }
  });

  const activeTasks = await prisma.task.count({
    where: {
      assignedToId: session.user.id,
      status: { in: ['PENDING', 'IN_PROGRESS', 'REVIEW'] }
    }
  });

  // 4. Fetch pending leave requests
  const pendingLeaves = await prisma.leaveRequest.findMany({
    where: { employeeId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  // 5. Fetch recent notifications
  const recentNotifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Personalized Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl border border-border glass relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h2 className="text-2xl font-bold font-outfit">Hello, {session.user.name} 👋</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Welcome to your daily workplace control terminal.</p>
          </div>
          
          {/* Quick Check-in CTA */}
          <div className="shrink-0">
            {todayAttendance ? (
              todayAttendance.checkOut ? (
                <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  Day Completed (Checked Out)
                </div>
              ) : (
                <a
                  href="/employee/attendance"
                  className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  Currently Checked In (Check Out Now)
                </a>
              )
            ) : (
              <a
                href="/employee/attendance"
                className="flex items-center gap-2 text-xs font-bold px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer animate-pulse"
              >
                <ScanFace className="w-4 h-4" />
                AI Face Check-in Required
              </a>
            )}
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Work Attendance State */}
          <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Attendance State</span>
            <div className="flex justify-between items-center">
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                todayAttendance ? (todayAttendance.status === 'LATE' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500') : 'bg-rose-500/10 text-rose-500 animate-pulse'
              }`}>
                {todayAttendance ? todayAttendance.status : 'ABSENT (UNCHECKED)'}
              </span>
              <Clock className="w-5 h-5 text-muted-foreground/60" />
            </div>
            {todayAttendance && (
              <p className="text-[10px] text-muted-foreground">
                Checked in at <strong>{new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </p>
            )}
          </div>

          {/* Active Workload */}
          <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Active Tasks</span>
            <div className="flex justify-between items-center">
              <p className="text-3xl font-extrabold font-outfit">{activeTasks}</p>
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Across <strong>{totalTasks}</strong> total assignments
            </p>
          </div>

          {/* Leaves Status */}
          <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Leaves Request</span>
            <div className="flex justify-between items-center">
              <p className="text-3xl font-extrabold font-outfit">
                {pendingLeaves.filter(l => l.status === 'PENDING').length}
              </p>
              <CalendarCheck className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-[10px] text-muted-foreground">Pending administrative audits</p>
          </div>

          {/* Quick Alert logs count */}
          <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">In-App Alerts</span>
            <div className="flex justify-between items-center">
              <p className="text-3xl font-extrabold font-outfit">
                {recentNotifications.filter(n => !n.read).length}
              </p>
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-[10px] text-muted-foreground">Unread visual alerts</p>
          </div>
        </div>

        {/* WORKSPACE DETAILED LOGS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Alerts & Leaves */}
          <div className="lg:col-span-2 space-y-8">
            {/* Notifications Log */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-outfit">Recent Visual Alerts</h3>
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm divide-y divide-border/60">
                {recentNotifications.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-6">You have no recent alerts logged.</p>
                ) : (
                  recentNotifications.map((notif, idx) => (
                    <div key={notif.id} className={`pt-3.5 first:pt-0 flex items-start gap-4 text-xs ${notif.read ? 'opacity-70' : ''}`}>
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-400 capitalize">{notif.type.toLowerCase().replace('_', ' ')}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-500 leading-relaxed font-light">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Leaves status grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold font-outfit">My Leave Applications</h3>
                <a href="/employee/leaves" className="text-xs text-indigo-500 font-semibold hover:underline">Apply &rarr;</a>
              </div>

              <div className="space-y-4">
                {pendingLeaves.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-border border-dashed rounded-2xl bg-card">
                    No historical applications recorded.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pendingLeaves.map((l) => (
                      <div key={l.id} className="p-4 bg-card border border-border rounded-2xl space-y-3.5 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold leading-none">
                            {new Date(l.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(l.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                            l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                            l.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {l.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 bg-secondary/40 p-2 rounded-lg leading-relaxed mt-2.5">
                          "{l.reason}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Profile Settings */}
          <div className="space-y-4">
            <ProfileSettingsClient />
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
