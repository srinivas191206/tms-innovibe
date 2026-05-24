'use client';

import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Calendar 
} from 'lucide-react';

interface AttendanceTrendItem {
  date: string;
  checkInTimeDecimal: number; // e.g. 9.5 for 09:30
  label: string; // e.g. "09:30"
  status: string;
}

interface TaskCompletionItem {
  date: string;
  count: number;
}

interface EmployeeAnalyticsProps {
  attendanceTrend: AttendanceTrendItem[];
  taskCompletions: TaskCompletionItem[];
  officeStartTime: string; // e.g. "09:00"
}

export default function EmployeeAnalytics({
  attendanceTrend,
  taskCompletions,
  officeStartTime
}: EmployeeAnalyticsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2 border border-border glass rounded-3xl p-6 text-muted-foreground animate-pulse">
        <Clock className="w-6 h-6 text-indigo-400 animate-spin" />
        <span className="font-outfit text-xs font-semibold text-indigo-400/80">Loading personal metrics tracker...</span>
      </div>
    );
  }

  // Parse office start time decimal (e.g. "09:00" -> 9.0)
  const officeStartParts = officeStartTime.split(':');
  const officeStartDecimal = officeStartParts.length >= 2 
    ? parseInt(officeStartParts[0], 10) + parseInt(officeStartParts[1], 10) / 60
    : 9.0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* 1. Task Completion Momentum Chart */}
      <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold font-outfit flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Productivity Momentum (Last 30 Days)
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Rolling task completion counts per interval.</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-bold">ACTIVE</span>
        </div>

        <div className="h-56">
          {taskCompletions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl bg-secondary/10">
              No tasks completed in the last 30 days. Complete tasks to see momentum!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={taskCompletions}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="Tasks Completed" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#completionGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Punctuality and Timing Log Chart */}
      <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold font-outfit flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
              Check-in Precision Log (Last 7 Days)
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Visual representation of check-in times relative to start time ({officeStartTime}).</p>
          </div>
          <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[9px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Sync Log
          </span>
        </div>

        <div className="h-56">
          {attendanceTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl bg-secondary/10">
              No recent attendance logs recorded. Start checking in to trace metrics!
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
                  domain={[7, 12]} // Lock around work arrival bounds 7 AM - 12 PM
                  ticks={[7, 8, 9, 10, 11, 12]}
                  tickFormatter={(val) => `${val}:00`}
                />
                <Tooltip
                  formatter={(value: any, name, props) => [`${props.payload.label} (${props.payload.status})`, 'Arrival Time']}
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    fontFamily: 'Outfit, sans-serif'
                  }}
                />
                
                {/* Reference line for office start time */}
                <Line 
                  type="monotone" 
                  dataKey="checkInTimeDecimal" 
                  name="Arrival Time" 
                  stroke="#6366f1" 
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
