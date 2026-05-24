'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RotateCcw, FileText, ExternalLink, Calendar } from 'lucide-react';

interface HeadClientProps {
  reviewTasks: any[];
}

export default function HeadClient({ reviewTasks }: HeadClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (taskId: string, status: 'COMPLETED' | 'IN_PROGRESS') => {
    setLoading(taskId);
    try {
      const res = await fetch(`/api/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status,
          progress: status === 'COMPLETED' ? 100 : 50,
          comment: status === 'COMPLETED' ? 'Task reviewed and approved.' : 'Task reopened. Please address comments and resubmit.'
        })
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to update task status.');
      }
    } catch (e) {
      console.error(e);
      alert('Network connection error.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {reviewTasks.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground border border-border border-dashed rounded-2xl bg-card">
          No deliverables in the review queue.
        </div>
      ) : (
        reviewTasks.map((task) => {
          const lastUpdate = task.updates?.[0];
          
          return (
            <div key={task.id} className="p-5 bg-card border border-border rounded-2xl space-y-3.5 shadow-sm">
              <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-sm leading-snug">{task.title}</h4>
                  <span className="shrink-0 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[9px] font-bold tracking-wider uppercase">Review</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Assignee: <strong>{task.assignedTo.name}</strong></p>
              </div>

              {/* Submission details */}
              {lastUpdate && (
                <div className="p-3 bg-secondary/50 border border-border rounded-xl text-xs space-y-2 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-semibold text-muted-foreground text-[10px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Submitted {new Date(lastUpdate.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <p className="text-slate-500 text-[11px] italic bg-background p-2.5 rounded-lg border border-border/40">
                    "{lastUpdate.comment}"
                  </p>

                  {/* Proof File link */}
                  {lastUpdate.proofFile && (
                    <a
                      href={lastUpdate.proofFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-400 font-bold bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Review Deliverable Proof</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleAction(task.id, 'COMPLETED')}
                  disabled={loading !== null}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-emerald-600/10"
                >
                  {loading === task.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Approve Task
                </button>
                
                <button
                  onClick={() => handleAction(task.id, 'IN_PROGRESS')}
                  disabled={loading !== null}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-amber-600/10"
                >
                  {loading === task.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  Reopen Task
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
