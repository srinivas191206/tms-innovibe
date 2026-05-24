'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  UploadCloud, 
  ArrowRight,
  X,
  Search,
  TrendingUp,
  History,
  FileCheck,
  MessageCircle
} from 'lucide-react';

interface TaskUpdate {
  id: string;
  comment: string;
  progress: number | null;
  proofFile: string | null;
  createdAt: string | Date;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  deadline: string | Date;
  assignedBy: { name: string };
  updates: TaskUpdate[];
}

interface EmployeeTasksClientProps {
  tasks: Task[];
  employeeId: string;
}

export default function EmployeeTasksClient({
  tasks,
  employeeId
}: EmployeeTasksClientProps) {
  const router = useRouter();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Update state variables
  const [status, setStatus] = useState('PENDING');
  const [progress, setProgress] = useState(0);
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleOpenUpdate = (task: Task) => {
    setActiveTask(task);
    setStatus(task.status);
    setProgress(task.progress);
    setComment('');
    setFile(null);
    setErrorMsg('');
    setSuccess(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    let proofFileUrl = '';

    // If there is an uploaded deliverable file, upload it first!
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          proofFileUrl = uploadData.filePath;
        } else {
          setErrorMsg('Failed to upload proof document.');
          setLoading(false);
          return;
        }
      } catch (e) {
        setErrorMsg('Error establishing connection to upload service.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTask.id,
          status,
          progress,
          comment: comment || undefined,
          proofFile: proofFileUrl || undefined,
          employeeId
        })
      });

      if (res.ok) {
        setSuccess(true);
        setActiveTask(null);
        router.refresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update task.');
      }
    } catch (e) {
      setErrorMsg('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingColumn = filteredTasks.filter(t => t.status === 'PENDING');
  const inProgressColumn = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const reviewColumn = filteredTasks.filter(t => t.status === 'REVIEW');
  const completedColumn = filteredTasks.filter(t => t.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Search rows */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by task title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
        />
      </div>

      {/* Kanban Layout splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        
        {/* PENDING COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Pending ({pendingColumn.length})</h3>
          </div>
          <div className="space-y-3">
            {pendingColumn.map(t => (
              <TaskCard key={t.id} task={t} onClick={() => handleOpenUpdate(t)} />
            ))}
          </div>
        </div>

        {/* IN PROGRESS COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">In Progress ({inProgressColumn.length})</h3>
          </div>
          <div className="space-y-3">
            {inProgressColumn.map(t => (
              <TaskCard key={t.id} task={t} onClick={() => handleOpenUpdate(t)} />
            ))}
          </div>
        </div>

        {/* REVIEW COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Under Review ({reviewColumn.length})</h3>
          </div>
          <div className="space-y-3">
            {reviewColumn.map(t => (
              <TaskCard key={t.id} task={t} onClick={() => handleOpenUpdate(t)} />
            ))}
          </div>
        </div>

        {/* COMPLETED COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Completed ({completedColumn.length})</h3>
          </div>
          <div className="space-y-3">
            {completedColumn.map(t => (
              <TaskCard key={t.id} task={t} onClick={() => handleOpenUpdate(t)} />
            ))}
          </div>
        </div>

      </div>

      {/* DRAWER POPUP PANEL */}
      {activeTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300 relative shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h4 className="font-bold text-lg font-outfit text-slate-900">Update Task Progress</h4>
                <p className="text-xs text-slate-500 mt-0.5">Changes are timestamped and logged automatically.</p>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">

              {/* Error notifications */}
              {errorMsg && (
                <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleUpdate} className="p-6 space-y-5">
                
                {/* Task descriptions */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h5 className="font-bold text-xs text-indigo-600">Assignment Description</h5>
                  <p className="text-sm font-bold text-slate-900">{activeTask.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">{activeTask.description}</p>
                  <p className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-200">
                    Delegated by: <strong className="text-slate-600">{activeTask.assignedBy.name}</strong>
                  </p>
                </div>

                {/* Status Select */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Workflow Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={activeTask.status === 'COMPLETED'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold text-slate-800"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="REVIEW">SUBMIT FOR REVIEW</option>
                    {activeTask.status === 'COMPLETED' && <option value="COMPLETED">COMPLETED</option>}
                  </select>
                </div>

                {/* Slider for Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      Self-rated Completion
                    </span>
                    <span className="text-sm font-extrabold text-indigo-600 font-mono">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    disabled={activeTask.status === 'COMPLETED'}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Comments & upload attachments */}
                {activeTask.status !== 'COMPLETED' && (
                  <>
                    <div className="space-y-1 border-t border-slate-100 pt-4">
                      <label className="text-xs text-slate-600 font-semibold">
                        Progress Note <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        placeholder="Describe what you completed, what's left, any blockers..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-xs resize-none text-slate-800 placeholder:text-slate-400"
                      />
                    </div>

                    {status === 'REVIEW' && (
                      <div className="space-y-2">
                        <label className="text-xs text-slate-600 font-semibold block">Attach Work Deliverable</label>
                        <div className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-4 bg-slate-50 transition-all text-center flex flex-col items-center justify-center relative cursor-pointer group">
                          <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <UploadCloud className="w-8 h-8 text-indigo-400 group-hover:scale-105 transition-transform" />
                          <span className="text-xs font-bold text-slate-500 mt-2">
                            {file ? file.name : 'Click to select deliverable file'}
                          </span>
                          <span className="text-[10px] text-slate-400 leading-none mt-1">
                            Images, PDFs, or ZIP archives under 10MB
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Submit */}
                {activeTask.status !== 'COMPLETED' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all text-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Save Progress Update
                      </>
                    )}
                  </button>
                )}
              </form>

              {/* ─── TIMESTAMPED PROGRESS HISTORY ─── */}
              {activeTask.updates && activeTask.updates.length > 0 && (
                <div className="px-6 pb-6 space-y-3">
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                    <History className="w-4 h-4 text-indigo-500" />
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Progress History ({activeTask.updates.length} entries)
                    </h5>
                  </div>

                  <div className="relative space-y-0">
                    {/* Vertical connector line */}
                    <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-200"></div>

                    {activeTask.updates.map((update, idx) => {
                      const date = new Date(update.createdAt);
                      const dateStr = date.toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      });
                      const timeStr = date.toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit', hour12: true
                      });
                      const isLatest = idx === 0;

                      return (
                        <div key={update.id} className="flex gap-3 pb-4 relative">
                          {/* Timeline dot */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                            update.proofFile
                              ? 'bg-emerald-50 border-emerald-200'
                              : isLatest
                              ? 'bg-indigo-50 border-indigo-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}>
                            {update.proofFile ? (
                              <FileCheck className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <TrendingUp className={`w-4 h-4 ${isLatest ? 'text-indigo-600' : 'text-slate-400'}`} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-1">
                            {/* Progress badge + timestamp on same row */}
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {update.progress !== null && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${
                                  (update.progress ?? 0) >= 100
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : (update.progress ?? 0) >= 50
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {update.progress}% complete
                                </span>
                              )}
                              {isLatest && (
                                <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-bold uppercase tracking-wide">
                                  Latest
                                </span>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                              <Clock className="w-3 h-3" />
                              <span>{timeStr}</span>
                              <span className="text-slate-300">·</span>
                              <span>{dateStr}</span>
                            </div>

                            {/* Comment */}
                            {update.comment && update.comment !== `Progress updated to ${update.progress}%` && (
                              <div className="mt-2 flex items-start gap-1.5">
                                <MessageCircle className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-slate-600 leading-relaxed italic">
                                  "{update.comment}"
                                </p>
                              </div>
                            )}

                            {/* Proof file link */}
                            {update.proofFile && (
                              <a
                                href={update.proofFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-600 font-semibold hover:underline"
                              >
                                <FileCheck className="w-3 h-3" />
                                View attached deliverable
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state for history */}
              {activeTask.updates && activeTask.updates.length === 0 && (
                <div className="mx-6 mb-6 p-4 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50">
                  <History className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-[11px] text-slate-400">No progress updates yet. Save your first update above.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Sub-component: TaskCard
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-card border border-border hover:border-indigo-500/40 rounded-xl space-y-3.5 shadow-sm transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-md select-none group"
    >
      <div className="space-y-1">
        <h4 className="font-bold text-xs group-hover:text-indigo-400 transition-colors leading-snug">{task.title}</h4>
        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-light">{task.description}</p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-extrabold text-muted-foreground uppercase">
          <span>Completion</span>
          <span>{task.progress}%</span>
        </div>
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${task.progress}%` }}></div>
        </div>
      </div>

      {/* Last update timestamp if any */}
      {task.updates && task.updates.length > 0 && (
        <div className="text-[9px] text-indigo-400 font-semibold flex items-center gap-1">
          <History className="w-3 h-3" />
          Last updated: {new Date(task.updates[0].createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
          })}, {new Date(task.updates[0].createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short'
          })}
        </div>
      )}

      <div className="flex justify-between items-center text-[9px] text-muted-foreground border-t border-border/40 pt-2.5">
        <span className="font-semibold text-slate-500 truncate max-w-[120px] flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-indigo-400" />
          {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}
