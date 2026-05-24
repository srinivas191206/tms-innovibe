'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';

interface LeavesClientProps {
  initialLeaves: any[];
  employeeId: string;
}

export default function LeavesClient({ initialLeaves, employeeId }: LeavesClientProps) {
  const router = useRouter();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    // Dates validation
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start date must occur before end date.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          reason
        })
      });

      if (res.ok) {
        setStartDate('');
        setEndDate('');
        setReason('');
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to submit leave request.');
      }
    } catch (e) {
      setErrorMsg('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
      {/* Leave request form */}
      <div className="bg-card border border-border p-6 rounded-2xl h-fit space-y-6">
        <div>
          <h3 className="text-lg font-bold font-outfit">Apply For Leave</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Submit an administrative absence request.</p>
        </div>

        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Leave request logged. Awaiting review.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-semibold">Reason for Absence</label>
            <textarea
              placeholder="Provide a detailed explanation for your absence request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 gradient-bg-indigo text-white font-bold py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all text-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Submit Application
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Log timeline */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold font-outfit">Leave Timelines ({initialLeaves.length})</h3>

        {initialLeaves.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground border border-border border-dashed rounded-2xl bg-card">
            You have no leave history entries recorded.
          </div>
        ) : (
          <div className="space-y-3.5">
            {initialLeaves.map((l) => (
              <div key={l.id} className="p-5 bg-card border border-border rounded-2xl space-y-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:scale-[1.01] transition-transform">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        {new Date(l.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(l.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Applied {new Date(l.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 bg-secondary/35 border border-border/40 p-2.5 rounded-xl leading-relaxed italic">
                    "{l.reason}"
                  </p>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 ${
                    l.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                    l.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {l.status === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
                    {l.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                    {l.status === 'PENDING' && <Clock className="w-3.5 h-3.5 animate-pulse" />}
                    <span>{l.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
