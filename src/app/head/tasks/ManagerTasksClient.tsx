'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Briefcase, 
  Trash2, 
  Clock, 
  X, 
  User, 
  Kanban, 
  Activity, 
  GitMerge, 
  MessageCircle, 
  Send, 
  Check, 
  RotateCcw,
  RefreshCw
} from 'lucide-react';

interface ManagerTasksClientProps {
  tasks: any[];
  teamMembers: any[];
  managerId: string;
}

export default function ManagerTasksClient({
  tasks,
  teamMembers,
  managerId
}: ManagerTasksClientProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'gantt'>('kanban');
  
  // Comments states
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Creation form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('WEEKLY');
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setAssignedToId(teamMembers[0]?.id || '');
    setDeadline('');
    setIsRecurring(false);
    setRecurrenceInterval('WEEKLY');
    setDependencyIds([]);
    setErrorMsg('');
    setIsOpen(true);
  };

  const handleOpenDetails = (task: any) => {
    setActiveTask(task);
    fetchComments(task.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !assignedToId || !deadline) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          assignedToId,
          deadline: new Date(deadline).toISOString(),
          assignedById: managerId,
          isRecurring,
          recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
          dependencyIds: dependencyIds.length > 0 ? dependencyIds : undefined
        })
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to create task.');
      }
    } catch (e) {
      setErrorMsg('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        if (activeTask?.id === id) setActiveTask(null);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete task.');
      }
    } catch (e) {
      alert('Network connection error.');
    }
  };

  const handleAction = async (taskId: string, status: 'COMPLETED' | 'IN_PROGRESS', feedbackComment?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status,
          progress: status === 'COMPLETED' ? 100 : 50,
          comment: feedbackComment || (status === 'COMPLETED' ? 'Task reviewed and approved.' : 'Task reopened. Please address comments and resubmit.')
        })
      });

      if (res.ok) {
        setActiveTask(null);
        router.refresh();
      } else {
        alert('Failed to update task status.');
      }
    } catch (e) {
      console.error(e);
      alert('Network connection error.');
    } finally {
      setLoading(false);
    }
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
          userId: managerId,
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

  const toggleDependency = (id: string) => {
    if (dependencyIds.includes(id)) {
      setDependencyIds(dependencyIds.filter(depId => depId !== id));
    } else {
      setDependencyIds([...dependencyIds, id]);
    }
  };

  // Perform filtering
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || task.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
            />
          </div>

          {/* Status filters */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-card border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold shrink-0"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>

        {/* Board toggles */}
        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border gap-1 shrink-0 self-start sm:self-center font-bold text-xs select-none">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'kanban' ? 'bg-card text-indigo-400 shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
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

        {/* Create button */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all text-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Render layout */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground border border-border border-dashed rounded-2xl bg-card">
          No tasks delegated matching the filters.
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => handleOpenDetails(task)} onDelete={handleDelete} />
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView tasks={filteredTasks} onTaskClick={handleOpenDetails} />
      ) : (
        <GanttChartView tasks={filteredTasks} onTaskClick={handleOpenDetails} />
      )}

      {/* CREATION DRAWER PANEL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border-l border-border flex flex-col p-6 animate-in slide-in-from-right duration-300 relative shadow-2xl glass">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h4 className="font-bold text-lg font-outfit">Delegate Project Task</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Author structured sprints for team members.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 py-4 space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Audit API Schema Specifications"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Scope of Work / Description</label>
                <textarea
                  placeholder="Provide precise details, expectations, and resources..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold text-slate-800"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Target Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Assignee (Team Member)</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold text-slate-800"
                  required
                >
                  <option value="" disabled>-- Choose Associate --</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              {/* Dependencies selector */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold block">Prerequisite Task Dependencies</label>
                <div className="p-3 bg-secondary/20 border border-border rounded-2xl max-h-32 overflow-y-auto space-y-1">
                  {tasks.filter(t => t.status !== 'COMPLETED').length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No available active tasks for dependencies.</p>
                  ) : (
                    tasks.filter(t => t.status !== 'COMPLETED').map(t => (
                      <label key={t.id} className="flex items-center gap-2 text-[10px] text-slate-600 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dependencyIds.includes(t.id)}
                          onChange={() => toggleDependency(t.id)}
                          className="rounded text-indigo-600 accent-indigo-500"
                        />
                        <span>{t.title}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Recurrence Setup */}
              <div className="p-4 bg-secondary/10 border border-border rounded-2xl space-y-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-500 w-4 h-4"
                  />
                  <span>Configure Recurring Sprint Scheduling</span>
                </label>

                {isRecurring && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Recurrence Interval</label>
                    <select
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold text-slate-800"
                    >
                      <option value="DAILY">DAILY (Every morning)</option>
                      <option value="WEEKLY">WEEKLY (Every Monday)</option>
                      <option value="MONTHLY">MONTHLY (1st of month)</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl hover:shadow-lg active:scale-[0.98] transition-all text-xs cursor-pointer disabled:opacity-50 mt-6"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4" />
                    Delegate Task Sprint
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS & AUDIT DRAWER PANEL */}
      {activeTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white border-l border-slate-200 flex flex-row animate-in slide-in-from-right duration-300 relative shadow-2xl">
            
            {/* Left side: details & actions */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-100">
              <div className="p-6 border-b border-slate-100 bg-white shrink-0 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg font-outfit text-slate-900">Task Audit Panel</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Review deliverables, view sprint metrics, and manage status.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className={`px-2 py-0.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/15 rounded-lg text-[9px] font-bold uppercase tracking-wider`}>
                      {activeTask.priority} Priority
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider uppercase ${
                      activeTask.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      activeTask.status === 'REVIEW' ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {activeTask.status}
                    </span>
                  </div>

                  <h5 className="font-bold text-sm text-slate-900 leading-snug">{activeTask.title}</h5>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">{activeTask.description}</p>
                  
                  {activeTask.reopenedCount && activeTask.reopenedCount > 0 ? (
                    <div className="text-[10px] text-rose-500 font-extrabold flex items-center gap-1 border-t border-slate-200/50 pt-2">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reopened {activeTask.reopenedCount} times</span>
                    </div>
                  ) : null}

                  <p className="text-[10px] text-slate-400 border-t border-slate-200/50 pt-2">
                    Assigned to: <strong className="text-slate-600">{activeTask.assignedTo.name}</strong>
                  </p>
                </div>

                {/* Audit Actions */}
                {(activeTask.status === 'REVIEW' || activeTask.status === 'COMPLETED') && (
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl space-y-4">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Manager Review Operations</h5>
                    
                    {activeTask.updates && activeTask.updates[0]?.proofFile && (
                      <div className="p-3 bg-secondary/40 border border-border rounded-xl text-xs space-y-1">
                        <p className="font-bold text-slate-600">Employee Attachment deliverable:</p>
                        <a href={activeTask.updates[0].proofFile} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 font-bold hover:underline">View proof deliverable document</a>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAction(activeTask.id, 'COMPLETED')}
                        disabled={loading}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Approve & Close
                      </button>
                      <button
                        onClick={() => {
                          const feedback = prompt('Provide reopening feedback comment for the employee:');
                          if (feedback !== null) handleAction(activeTask.id, 'IN_PROGRESS', feedback);
                        }}
                        disabled={loading}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reject & Reopen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Comments discussion thread */}
            <div className="w-80 border-l border-slate-100 bg-slate-50/50 flex flex-col min-w-0">
              <div className="p-6 border-b border-slate-100 bg-white shrink-0 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 font-outfit">Discussion Thread</h4>
                  <p className="text-[10px] text-slate-400">Collaboration activity for this sprint.</p>
                </div>
                <button onClick={() => setActiveTask(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

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
                    const isOwn = c.userId === managerId;
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

// Sub-component: TaskCard
function TaskCard({ task, onClick, onDelete }: { task: any; onClick: () => void; onDelete: (id: string) => void }) {
  const daysLeft = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  
  return (
    <div
      onClick={onClick}
      className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-sm relative overflow-hidden group select-none cursor-pointer"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-2">
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider uppercase ${
            task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' :
            task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
            'bg-slate-500/10 text-muted-foreground'
          }`}>
            {task.priority} Priority
          </span>

          <div className="flex items-center gap-1.5">
            {task.isRecurring && (
              <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-500 border border-indigo-500/10 rounded text-[7px] font-extrabold uppercase">R</span>
            )}
            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider uppercase ${
              task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
              task.status === 'REVIEW' ? 'bg-indigo-500/10 text-indigo-400 animate-pulse' :
              task.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
              'bg-slate-500/10 text-muted-foreground'
            }`}>
              {task.status}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-sm leading-snug group-hover:text-indigo-400 transition-colors truncate max-w-[200px]">{task.title}</h4>
          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed font-light">{task.description}</p>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-muted-foreground">Task Completion Rate</span>
            <span className="text-indigo-400">{task.progress}%</span>
          </div>
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${task.progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-6 flex justify-between items-center text-[10px] leading-none text-muted-foreground shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center font-bold text-[9px] text-muted-foreground">
            {task.assignedTo.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-slate-500 truncate max-w-[80px]">{task.assignedTo.name}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className={`font-semibold flex items-center gap-1 ${daysLeft < 0 ? 'text-rose-500' : daysLeft <= 2 ? 'text-amber-500' : ''}`}>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}</span>
          </span>

          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/15 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Calendar View component
function CalendarView({ tasks, onTaskClick }: { tasks: any[]; onTaskClick: (task: any) => void }) {
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
function GanttChartView({ tasks, onTaskClick }: { tasks: any[]; onTaskClick: (task: any) => void }) {
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
