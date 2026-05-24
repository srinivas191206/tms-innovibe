'use client';

import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  ShieldCheck, 
  Activity, 
  Flame, 
  TrendingUp,
  Clock,
  Terminal,
  MapPin,
  Laptop
} from 'lucide-react';

interface DeptStat {
  name: string;
  completed: number;
  active: number;
  total: number;
}

interface EmployeeHeatmap {
  id: string;
  name: string;
  department: string;
  activeTasksCount: number;
}

interface LoginHistoryItem {
  id: string;
  createdAt: string | Date;
  status: string;
  ipAddress: string | null;
  device: string | null;
  location: string | null;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface AdminAnalyticsProps {
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  absentCount: number;
  departmentStats: DeptStat[];
  employeeHeatmap: EmployeeHeatmap[];
  loginHistories: LoginHistoryItem[];
}

export default function AdminAnalytics({
  presentCount,
  lateCount,
  halfDayCount,
  absentCount,
  departmentStats,
  employeeHeatmap,
  loginHistories
}: AdminAnalyticsProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedLogsTab, setSelectedLogsTab] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 border border-border glass rounded-3xl p-6 text-muted-foreground animate-pulse">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="font-outfit text-sm font-semibold tracking-wide text-indigo-400">Loading Corporate Analytics Engines...</span>
      </div>
    );
  }

  // 1. Prepare Attendance Data for Donut Chart
  const attendanceData = [
    { name: 'On Time (Present)', value: presentCount, color: '#10b981' },
    { name: 'Late Arrivals', value: lateCount, color: '#f59e0b' },
    { name: 'Half Day', value: halfDayCount, color: '#6366f1' },
    { name: 'Absent', value: absentCount, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // If no data is available for today yet
  const hasAttendanceData = attendanceData.length > 0;
  const dummyAttendanceData = [
    { name: 'No Check-ins Recorded Yet', value: 1, color: '#64748b' }
  ];

  const totalCheckIns = presentCount + lateCount + halfDayCount;

  // 2. Prepare Audit Log filtering
  const filteredLogs = loginHistories.filter(log => {
    if (selectedLogsTab === 'ALL') return true;
    return log.status === selectedLogsTab;
  });

  return (
    <div className="space-y-8">
      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart A: Attendance Rate Distribution */}
        <div className="p-6 bg-card border border-border rounded-3xl flex flex-col shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold font-outfit">Check-in Status Breakdown</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Distribution of today's active employee rosters.</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="h-64 flex items-center justify-center relative">
            {hasAttendanceData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontFamily: 'Outfit, sans-serif'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dummyAttendanceData}
                    innerRadius={70}
                    outerRadius={95}
                    dataKey="value"
                  >
                    <Cell fill="#334155" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Central summary indicators */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <p className="text-3xl font-extrabold font-outfit text-foreground leading-none">{totalCheckIns}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Logged Today</p>
            </div>
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-xl border border-border/40">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground/80 truncate">On Time</p>
                <p className="text-[10px] text-muted-foreground font-mono">{presentCount} members</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-xl border border-border/40">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground/80 truncate">Late Arrivals</p>
                <p className="text-[10px] text-muted-foreground font-mono">{lateCount} members</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-xl border border-border/40">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground/80 truncate">Half Day</p>
                <p className="text-[10px] text-muted-foreground font-mono">{halfDayCount} members</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-xl border border-border/40">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground/80 truncate">Absent</p>
                <p className="text-[10px] text-muted-foreground font-mono">{absentCount} members</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart B: Departmental Efficiency Bar Chart */}
        <div className="p-6 bg-card border border-border rounded-3xl flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold font-outfit">Department Task Delivery</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Completed vs active tasks comparison by department.</p>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="h-[310px]">
            {departmentStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl bg-secondary/10">
                No departmental tasks statistics found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentStats}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} 
                  />
                  <Bar dataKey="completed" name="Completed Tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="active" name="Active Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Roster Workload Capacity Heatmap */}
      <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
              Employee Workload Roster Heatmap
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Visualize active task assignment density to prevent team burnout.</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/20 border border-emerald-500/30"></span>
              Optimized (0-1 tasks)
            </span>
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="w-2.5 h-2.5 rounded-md bg-amber-500/20 border border-amber-500/30"></span>
              At Capacity (2-3 tasks)
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-2.5 h-2.5 rounded-md bg-rose-500/20 border border-rose-500/40 animate-pulse"></span>
              Overloaded (4+ tasks)
            </span>
          </div>
        </div>

        {employeeHeatmap.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl bg-secondary/10">
            No active employee rosters registered to track workload capacity.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {employeeHeatmap.map(emp => {
              const count = emp.activeTasksCount;
              let bg = 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15';
              let text = 'text-emerald-500';
              let desc = 'Optimized capacity';
              
              if (count >= 4) {
                bg = 'bg-rose-500/10 border-rose-500/25 hover:bg-rose-500/15 animate-pulse';
                text = 'text-rose-500';
                desc = 'Critical bottleneck';
              } else if (count >= 2) {
                bg = 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15';
                text = 'text-amber-500';
                desc = 'Moderate workload';
              }

              return (
                <div 
                  key={emp.id} 
                  className={`p-4 border rounded-2xl transition-all duration-200 cursor-pointer ${bg} flex flex-col justify-between h-28 relative group overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                  <div>
                    <p className="font-bold text-sm truncate leading-snug">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{emp.department}</p>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-85 block">{desc}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Active tasks</span>
                    </div>
                    <span className={`text-2xl font-black font-outfit ${text}`}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Central Security & Audit Queue */}
      <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Central Security Audit Queue
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time recording of secure workplace login transactions.</p>
          </div>
          
          {/* Logs filtering tabs */}
          <div className="flex bg-secondary/50 p-1 border border-border rounded-xl self-start sm:self-auto">
            <button 
              onClick={() => setSelectedLogsTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedLogsTab === 'ALL' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Log
            </button>
            <button 
              onClick={() => setSelectedLogsTab('SUCCESS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedLogsTab === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Success
            </button>
            <button 
              onClick={() => setSelectedLogsTab('FAILED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedLogsTab === 'FAILED' ? 'bg-rose-500/10 text-rose-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Failures
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/40 border-b border-border font-bold text-muted-foreground">
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">State</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Terminal Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No recent security check logs matching the criteria.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold">{log.user.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{log.user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-secondary/80 border border-border text-[10px] font-semibold text-muted-foreground uppercase">
                        {log.user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${
                        log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                        {log.status === 'SUCCESS' ? 'PASSED' : 'BLOCKED / FAIL'}
                      </span>
                    </td>
                    <td className="p-4 font-mono flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{log.ipAddress || '127.0.0.1'}</span>
                    </td>
                    <td className="p-4 text-muted-foreground truncate max-w-[200px] leading-snug">
                      <div className="flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{log.device || 'Secure REST Terminal'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
