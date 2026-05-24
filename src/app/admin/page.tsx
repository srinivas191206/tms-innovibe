import React from 'react';
import prisma from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Building, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  MapPin,
  CalendarCheck,
  Cake,
  Bell
} from 'lucide-react';
import AdminLeaveActions from './AdminLeaveActions';

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

export default async function AdminDashboard() {
  // 1. Gather general statistics
  const totalEmployees = await prisma.user.count({
    where: { role: 'EMPLOYEE' }
  });

  const totalDepts = await prisma.department.count();

  // 2. Fetch today's date bounds
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 3. Fetch today's attendance logs
  const todayAttendances = await prisma.attendance.findMany({
    where: {
      checkIn: {
        gte: startOfToday,
        lte: endOfToday
      }
    },
    include: {
      employee: {
        include: {
          department: true
        }
      }
    },
    orderBy: {
      checkIn: 'desc'
    }
  });

  const presentCount = todayAttendances.filter(a => a.status === 'PRESENT').length;
  const lateCount = todayAttendances.filter(a => a.status === 'LATE').length;
  const halfDayCount = todayAttendances.filter(a => a.status === 'HALF_DAY').length;
  
  const totalCheckedIn = todayAttendances.length;
  const absentCount = Math.max(0, totalEmployees - totalCheckedIn);

  // 4. Fetch pending leaves
  const pendingLeaves = await prisma.leaveRequest.findMany({
    where: { status: 'PENDING' },
    include: { employee: true },
    orderBy: { createdAt: 'desc' }
  });

  // 5. Fetch users for birthday reminders (all employees + heads)
  const allUsersWithDob = await prisma.user.findMany({
    where: {
      role: { in: ['EMPLOYEE', 'DEPT_HEAD'] },
      dob: { not: null }
    },
    select: { id: true, name: true, role: true, dob: true }
  });

  const tomorrowBirthdays = allUsersWithDob.filter((u) => isBirthdayTomorrow(u.dob));

  // Calculate high-fidelity metrics
  const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 100;
  const lateRate = totalCheckedIn > 0 ? Math.round((lateCount / totalCheckedIn) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header summary banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-border glass relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h2 className="text-2xl font-bold font-outfit">Corporate Operations Hub</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time statistics, anomalous check-in detection, and task tracking pipelines.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-secondary/50 border border-border shrink-0 self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sync status: Operational
          </div>
        </div>

        {/* 🎂 BIRTHDAY REMINDER BANNER */}
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
                      ? '1 team member celebrates tomorrow!'
                      : `${tomorrowBirthdays.length} team members celebrate tomorrow!`}
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
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{person.name}</p>
                      <p className="text-[9px] text-amber-600 font-semibold uppercase tracking-wide">
                        {person.role === 'DEPT_HEAD' ? 'Dept. Head' : 'Employee'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1. KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 bg-card border border-border rounded-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Headcount</span>
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-outfit">{totalEmployees}</p>
            <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold mt-2.5">
              <Building className="w-3.5 h-3.5" />
              <span>{totalDepts} active departments</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-card border border-border rounded-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Present Today</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-outfit">{presentCount}</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{attendanceRate}% attendance rate</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-card border border-border rounded-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Late Arrivals</span>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-outfit text-amber-500">{lateCount}</p>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mt-2.5">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>{lateRate}% of arrivals are late</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 bg-card border border-border rounded-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Absent / Out Of Office</span>
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-outfit text-rose-500">{absentCount}</p>
            <div className="flex items-center gap-1 text-xs text-rose-400 font-semibold mt-2.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>{pendingLeaves.length} active leave applications</span>
            </div>
          </div>
        </div>

        {/* 2. DYNAMIC WORKSPACE SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Today's Check-ins Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-outfit">Today's Check-in Log ({todayAttendances.length})</h3>
              <a href="/admin/attendance" className="text-xs text-indigo-500 font-semibold hover:underline">View comprehensive logs &rarr;</a>
            </div>
            
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border font-bold text-muted-foreground">
                      <th className="p-4">Employee</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Check In</th>
                      <th className="p-4">Check Out</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {todayAttendances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">No check-ins recorded today.</td>
                      </tr>
                    ) : (
                      todayAttendances.map((a) => (
                        <tr key={a.id} className="hover:bg-secondary/15 transition-colors">
                          <td className="p-4 font-bold flex items-center gap-2.5">
                            {a.selfieUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={a.selfieUrl} 
                                alt="Selfie" 
                                className="w-7 h-7 rounded-full object-cover border border-border shadow-sm shrink-0" 
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] shrink-0 text-muted-foreground">
                                {a.employee.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="truncate max-w-[120px]">{a.employee.name}</span>
                          </td>
                          <td className="p-4 text-muted-foreground">{a.employee.department?.name || 'N/A'}</td>
                          <td className="p-4 font-mono font-semibold">
                            {new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 font-mono">
                            {a.checkOut 
                              ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : <span className="text-muted-foreground/60 italic font-sans">Active</span>}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              a.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-500' :
                              a.status === 'LATE' ? 'bg-amber-500/10 text-amber-500' :
                              a.status === 'HALF_DAY' ? 'bg-indigo-500/10 text-indigo-500' :
                              'bg-rose-500/10 text-rose-500'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground flex items-center gap-1 leading-none">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate max-w-[100px]">{a.latitude?.toFixed(4)}, {a.longitude?.toFixed(4)}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pending Leaves Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-outfit">Active Leave Requests ({pendingLeaves.length})</h3>
            
            <div className="space-y-4">
              {pendingLeaves.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-border border-dashed rounded-2xl bg-card">
                  No active leave requests to audit.
                </div>
              ) : (
                pendingLeaves.map((leave) => (
                  <div key={leave.id} className="p-5 bg-card border border-border rounded-2xl space-y-3.5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm">{leave.employee.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{leave.employee.email}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg text-[9px] font-bold tracking-wider uppercase">Pending</span>
                    </div>

                    <div className="p-3 bg-secondary/50 border border-border rounded-xl text-xs space-y-1.5 leading-relaxed">
                      <div className="font-semibold text-muted-foreground flex justify-between">
                        <span>Duration:</span>
                        <span className="text-foreground">
                          {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] italic mt-1 bg-background p-2 rounded-lg border border-border/40">
                        "{leave.reason}"
                      </p>
                    </div>

                    {/* Server Action / API Trigger Button Wrapper */}
                    <AdminLeaveActions requestId={leave.id} />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
