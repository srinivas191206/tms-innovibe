'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Calendar, FileText, ChevronRight, Briefcase, Trash2, Clock, X, User } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Creation form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [deadline, setDeadline] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setAssignedToId(teamMembers[0]?.id || '');
    setDeadline('');
    setErrorMsg('');
    setIsOpen(true);
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
          assignedById: managerId
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
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete task.');
      }
    } catch (e) {
      alert('Network connection error.');
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
          {/* Search inputs */}
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

        {/* Create button */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 gradient-bg-indigo text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all text-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Grid of Tasks */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground border border-border border-dashed rounded-2xl bg-card">
          No tasks delegated matching the chosen filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const daysLeft = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            
            return (
              <div key={task.id} className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-sm relative overflow-hidden group">
                <div className="space-y-4">
                  {/* Top tags */}
                  <div className="flex justify-between items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider uppercase ${
                      task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' :
                      task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-500/10 text-muted-foreground'
                    }`}>
                      {task.priority} Priority
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider uppercase ${
                      task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                      task.status === 'REVIEW' ? 'bg-indigo-500/10 text-indigo-400 animate-pulse' :
                      task.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-500/10 text-muted-foreground'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm leading-snug group-hover:text-indigo-400 transition-colors">{task.title}</h4>
                    <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{task.description}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground">Task Completion Rate</span>
                      <span className="text-indigo-400">{task.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-bg-indigo rounded-full transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer details */}
                <div className="border-t border-border pt-4 mt-6 flex justify-between items-center text-[10px] leading-none text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center font-bold text-[9px] text-muted-foreground">
                      {task.assignedTo.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-500 truncate max-w-[90px]">{task.assignedTo.name}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`font-semibold flex items-center gap-1 ${daysLeft < 0 ? 'text-rose-500' : daysLeft <= 2 ? 'text-amber-500' : ''}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}</span>
                    </span>

                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/15 cursor-pointer inline-flex"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER POPUP PANEL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border-l border-border flex flex-col p-6 animate-in slide-in-from-right duration-300 relative shadow-2xl glass">
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

            {/* Error notifications */}
            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 py-4 space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Task Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g. Audit API Schema Specifications"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs animate-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Scope of Work / Description</label>
                <textarea
                  placeholder="Provide precise details, expectations, and resources..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                {/* Deadline */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Assignee (Team Member)</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold"
                    required
                  >
                    <option value="" disabled>-- Choose Associate --</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 gradient-bg-indigo text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all text-xs cursor-pointer disabled:opacity-50 mt-6"
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
    </div>
  );
}
