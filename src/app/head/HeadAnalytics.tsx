'use client';

import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  Briefcase, 
  Clock, 
  Award,
  Users
} from 'lucide-react';

interface StatusStatItem {
  name: string;
  value: number;
  color: string;
}

interface TeamAttendanceTrendItem {
  date: string;
  rate: number;
}

interface HeadAnalyticsProps {
  taskStatusDistribution: StatusStatItem[];
  attendanceTrend: TeamAttendanceTrendItem[];
}

export default function HeadAnalytics({
  taskStatusDistribution,
  attendanceTrend
}: HeadAnalyticsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2 border border-border glass rounded-3xl p-6 text-muted-foreground animate-pulse">
        <Users className="w-6 h-6 text-indigo-400 animate-spin" />
        <span className="font-outfit text-xs font-semibold text-indigo-400/80">Loading department metrics...</span>
      </div>
    );
  }

  const hasTaskData = taskStatusDistribution.some(t => t.value > 0);
  const totalTasks = taskStatusDistribution.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* 1. Team Deliverables Overview (Donut Chart) */}
      <div className="p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold font-outfit flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Team Task Status Distribution
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Summary of all tasks currently assigned in the department.</p>
          </div>
          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-bold">LIVE</span>
        </div>

        <div className="h-48 flex items-center justify-center relative my-2">
          {hasTaskData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusDistribution.filter(t => t.value > 0)}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {taskStatusDistribution.filter(t => t.value > 0).map((entry, index) => (
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
            <div className="text-center text-xs text-muted-foreground italic">No tasks have been assigned yet.</div>
          )}

          {hasTaskData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <p className="text-2xl font-extrabold font-outfit text-foreground leading-none">{totalTasks}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Tasks</p>
            </div>
          )}
        </div>

        {/* Legend grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          {taskStatusDistribution.map((item, idx) => (
            <div key={idx} className="p-2 bg-secondary/35 border border-border/40 rounded-xl flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
              <div className="min-w-0 leading-tight">
                <p className="font-bold text-foreground truncate">{item.name}</p>
                <p className="text-muted-foreground font-mono mt-0.5">{item.value} tasks</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Team Attendance Reliability Trend (Line/Area Chart) */}
      <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold font-outfit flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Department Attendance Integrity
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Roster presence percentage across the last 7 working days.</p>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-bold">RELIABILITY</span>
        </div>

        <div className="h-56">
          {attendanceTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl bg-secondary/10">
              No historical team attendance recorded.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceTrend}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    fontFamily: 'Outfit, sans-serif'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  name="Attendance %" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
