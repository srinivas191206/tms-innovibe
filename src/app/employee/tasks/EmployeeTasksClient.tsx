'use client';

import React, { useState, useEffect } from 'react';
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
  MessageCircle,
  Kanban,
  Calendar,
  Activity,
  GitMerge,
  Send
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
  dependencies?: { dependsOn: { title: string; status: string } }[];
  isRecurring?: boolean;
  recurrenceInterval?: string | null;
  reopenedCount?: number;
  createdAt?: string | Date;
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
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'gantt'>('kanban');
  
  // Comments states
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Update states
  const [status, setStatus] = useState('PENDING');
  const [progress, setProgress] = useState(0);
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchComments = async (taskId: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/tasks/comments?taskId=${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleOpenUpdate = (task: Task) => {
    setActiveTask(task);
    setStatus(task.status);
    setProgress(task.progress);
    setComment('');
    setFile(null);
    setErrorMsg('');
    setSuccess(false);
    fetchComments(task.id);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTask) return;

    try {
      const res = await fetch('/api/tasks/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: activeTask.id,
          userId: employeeId,
          content: newComment.trim()
        })
      });

      if (res.ok) {
        const newC = await res.json();
        setComments([...comments, newC]);
        setNewComment('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    let proofFileUrl = '';

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

  return (
    <div className="space-y-6">
      {/* Search and view toggle row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by task title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
          />
        </div>

        {/* Tab View Selector */}
        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border gap-1 shrink-0 self-start sm:self-center font-bold text-xs select-none">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'kanban' ? 'bg-card text-indigo-400 shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'calendar' ? 'bg-card text-indigo-400 shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'gantt' ? 'bg-card text-indigo-400 shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Gantt Chart</span>
          </button>
        </div>
      </div>

      {/* Render selected view */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {/* PENDING COLUMN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Pending ({filteredTasks.filter(t => t.status === 'PENDING').length})</h3>
            </div>
            <div className="space-y-3">
              {filteredTasks.filter(t => t.status === 'PENDING').map(t => (
                <TaskCard key={t.id} task={t} onClick={() => handleOpenUpdate(t)} />
              ))}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">In Progress ({filteredTasks.filter(t => t.status === 'IN_PROGRESS').length})</h3>
            </div>
            <div className="space-y-3">
              {filteredTasks.filter(t => t.status === 'IN_PROGRESS').map(t => (
                <TaskCard key={t.id} task={t} onClick={() => handleOpenUpdate(t)} />
              ))}
            </div>
          </div>

          {/* REVIEW COLUMN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Under Review ({filteredTasks.filter(t => t.status === 'REVIEW').length})</h3>
            </div>
            <div className="space-y-3">
              {filteredTasks.filter(t => t.status === 'REVIEW').map(t => (
                <TaskCard key={t.id} task={t} onClick={() => handleOpenUpdate(t)} />
              ))}
            </div>
          </div>

          {/* COMPLETED COLUMN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Completed ({filteredTasks.filter(t => t.status === 'COMPLETED').length})</h3>
            </div>
            <div className="space-y-3">
              {filteredTasks.filter(t => t.status === 'COMPLETED').map(t => (
                <TaskCard key={t.id} task={t} onClick={() => handleOpenUpdate(t)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'calendar' && (
        <CalendarView tasks={filteredTasks} onTaskClick={handleOpenUpdate} />
      )}

      {viewMode === 'gantt' && (
        <GanttChartView tasks={filteredTasks} onTaskClick={handleOpenUpdate} />
      )}

      {/* DRAWER POPUP PANEL */}
      {activeTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white border-l border-slate-200 flex flex-row animate-in slide-in-from-right duration-300 relative shadow-2xl">
            
            {/* Left side: Task progress form & history */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-100">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
                <div>
                  <h4 className="font-bold text-lg font-outfit text-slate-900">Task Control Room</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Track execution metrics and proof deliverables.</p>
                </div>
                <button
                  onClick={() => setActiveTask(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 sm:hidden"
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
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-indigo-600">Sprint Directives</h5>
                      {activeTask.isRecurring && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[8px] font-extrabold tracking-wide uppercase">
                          Recurring {activeTask.recurrenceInterval}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-snug">{activeTask.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-light">{activeTask.description}</p>
                    
                    {/* Pre-requisite warnings */}
                    {activeTask.dependencies && activeTask.dependencies.length > 0 && (
                      <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                        <span className="text-[9px] font-extrabold text-amber-700 flex items-center gap-1">
                          <GitMerge className="w-3.5 h-3.5" />
                          PREREQUISITE TASK DEPENDENCIES:
                        </span>
                        <div className="space-y-0.5 text-[9px] font-medium text-slate-600 leading-tight">
                          {activeTask.dependencies.map((dep, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 rounded px-1.5 py-0.5">
                              <span>{dep.dependsOn.title}</span>
                              <span className={`px-1 rounded text-[7px] font-bold ${
                                dep.dependsOn.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700 animate-pulse'
                              }`}>{dep.dependsOn.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTask.reopenedCount && activeTask.reopenedCount > 0 ? (
                      <div className="text-[10px] text-rose-500 font-extrabold flex items-center gap-1.5 border-t border-slate-200/50 pt-2 mt-2">
                        <History className="w-3.5 h-3.5 animate-spin duration-1000" />
                        <span>REOPENED COUNT: {activeTask.reopenedCount} times</span>
                      </div>
                    ) : null}

                    <p className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/50">
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
                        Completion progress metric
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
                      className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-xs cursor-pointer disabled:opacity-50"
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
                        Progress Log Timeline
                      </h5>
                    </div>

                    <div className="relative space-y-0">
                      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-200"></div>

                      {activeTask.updates.map((update, idx) => {
                        const date = new Date(update.createdAt);
                        const isLatest = idx === 0;

                        return (
                          <div key={update.id} className="flex gap-3 pb-4 relative">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                              update.proofFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <FileCheck className="w-4 h-4 text-slate-400" />
                            </div>

                            <div className="flex-1 min-w-0 pt-1">
                              <p className="text-[11px] font-bold text-slate-800">{update.progress}% Complete</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                              {update.comment && (
                                <p className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl mt-1.5 leading-relaxed italic">"{update.comment}"</p>
                              )}
                              {update.proofFile && (
                                <a href={update.proofFile} target="_blank" rel="noopener noreferrer" className="text-[9px] text-emerald-600 font-bold hover:underline mt-1 inline-block">View Deliverable</a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Live task discussion thread */}
            <div className="w-80 border-l border-slate-100 bg-slate-50/50 flex flex-col min-w-0">
              <div className="p-6 border-b border-slate-100 bg-white shrink-0 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 font-outfit">Discussion Thread</h4>
                  <p className="text-[10px] text-slate-400">Collaboration activity for this sprint.</p>
                </div>
                <button
                  onClick={() => setActiveTask(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 hidden sm:block"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 space-y-1">
                    <MessageCircle className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-[10px] text-slate-400">Start the conversation! Post comments below.</p>
                  </div>
                ) : (
                  comments.map((c) => {
                    const isOwn = c.userId === employeeId;
                    const date = new Date(c.createdAt);
                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={c.id} className={`flex flex-col max-w-[85%] ${isOwn ? 'ml-auto items-end' : 'items-start'}`}>
                        <span className="text-[8px] font-extrabold text-slate-400 mb-0.5">{c.user.name} ({c.user.role})</span>
                        <div className={`p-3 rounded-2xl text-[11px] shadow-sm font-medium ${
                          isOwn ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-150 text-slate-700 rounded-tl-none'
                        }`}>
                          {c.content}
                        </div>
                        <span className="text-[7px] text-slate-400 mt-0.5 font-mono">{timeStr}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input section */}
              <form onSubmit={handleAddComment} className="p-4 border-t border-slate-100 bg-white flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Post comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-[11px]"
                />
                <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl active:scale-95 transition-transform flex items-center justify-center shrink-0 cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Inline Sub-component: TaskCard
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const daysLeft = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  
  return (
    <div
      onClick={onClick}
      className="p-4 bg-card border border-border hover:border-indigo-500/40 rounded-xl space-y-3 shadow-sm transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-md select-none group"
    >
      <div className="space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-xs group-hover:text-indigo-400 transition-colors leading-snug truncate max-w-[150px]">{task.title}</h4>
          {task.isRecurring && (
            <span className="shrink-0 px-1.5 py-0.2 bg-indigo-50 text-indigo-500 rounded text-[7px] font-extrabold tracking-wide uppercase">R</span>
          )}
        </div>
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

      <div className="flex justify-between items-center text-[9px] text-muted-foreground border-t border-border/40 pt-2.5">
        <span className={`font-semibold flex items-center gap-1 ${daysLeft < 0 ? 'text-rose-500 font-bold' : daysLeft <= 2 ? 'text-amber-500' : 'text-slate-500'}`}>
          <Clock className="w-3 h-3 text-indigo-400" />
          {daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}

// Monthly Calendar View component
function CalendarView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (task: Task) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const startDayOfWeek = startOfMonth.getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-sm text-slate-800 font-outfit">{monthNames[month]} {year}</h4>
        <div className="flex gap-2 font-bold text-xs">
          <button onClick={prevMonth} className="px-2.5 py-1.5 border border-border rounded-xl hover:bg-secondary cursor-pointer transition-colors">Prev</button>
          <button onClick={nextMonth} className="px-2.5 py-1.5 border border-border rounded-xl hover:bg-secondary cursor-pointer transition-colors">Next</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-muted-foreground uppercase tracking-wide">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={idx} className="h-24 bg-secondary/10 rounded-xl border border-transparent"></div>;
          
          const dayTasks = tasks.filter(t => {
            const tDate = new Date(t.deadline);
            return tDate.getDate() === day.getDate() && tDate.getMonth() === day.getMonth() && tDate.getFullYear() === day.getFullYear();
          });

          return (
            <div key={idx} className="h-24 p-2 bg-secondary/20 border border-border/40 rounded-xl flex flex-col justify-between overflow-hidden">
              <span className="text-[10px] font-bold text-slate-500 font-mono">{day.getDate()}</span>
              <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-none">
                {dayTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer truncate ${
                      t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'REVIEW' ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                      t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Gantt Chart View component
function GanttChartView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (task: Task) => void }) {
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const markers = [];
  const start = new Date();
  start.setHours(0,0,0,0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    markers.push(d);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 overflow-x-auto space-y-4 shadow-sm">
      <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">Sprint Timeline (Next 14 Days)</h4>
      <div className="min-w-[800px] space-y-4">
        {/* Timeline Header */}
        <div className="grid grid-cols-12 gap-1 border-b border-border pb-2 text-[9px] font-extrabold text-muted-foreground uppercase text-center">
          <div className="col-span-3 text-left">Task Details</div>
          <div className="col-span-9 grid grid-cols-14 gap-1">
            {markers.map((m, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span>{m.toLocaleDateString([], { weekday: 'narrow' })}</span>
                <span className="font-mono text-[8px] text-slate-400 mt-0.5">{m.getDate()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Gantt Rows */}
        <div className="space-y-3">
          {sortedTasks.map(t => {
            const createdDate = new Date(t.createdAt || start);
            const deadlineDate = new Date(t.deadline);
            
            const startOffset = Math.max(0, Math.min(13, Math.floor((createdDate.getTime() - start.getTime()) / (1000 * 3600 * 24))));
            const endOffset = Math.max(startOffset, Math.min(13, Math.floor((deadlineDate.getTime() - start.getTime()) / (1000 * 3600 * 24))));
            const span = endOffset - startOffset + 1;

            return (
              <div key={t.id} className="grid grid-cols-12 gap-1 items-center hover:bg-secondary/10 py-1 rounded-xl px-1 transition-colors">
                <div className="col-span-3 truncate cursor-pointer pr-2" onClick={() => onTaskClick(t)}>
                  <p className="font-bold text-xs leading-snug truncate">{t.title}</p>
                  <p className="text-[8px] text-muted-foreground">Due: {deadlineDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="col-span-9 grid grid-cols-14 gap-1 relative h-6">
                  <div
                    onClick={() => onTaskClick(t)}
                    style={{ gridColumnStart: startOffset + 1, gridColumnEnd: `span ${span}` }}
                    className={`h-5 rounded-lg flex items-center justify-between px-2 cursor-pointer shadow-sm text-[8px] font-bold text-white transition-all hover:scale-[1.01] ${
                      t.status === 'COMPLETED' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                      t.status === 'REVIEW' ? 'bg-gradient-to-r from-indigo-500 to-indigo-400 animate-pulse' :
                      t.status === 'IN_PROGRESS' ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                      'bg-gradient-to-r from-slate-400 to-slate-350'
                    }`}
                  >
                    <span className="truncate">{t.progress}%</span>
                    <span className="shrink-0">{span}d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
