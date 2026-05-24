'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Plus, Trash2, Award, Users, Trash } from 'lucide-react';

interface DepartmentsClientProps {
  initialDepartments: any[];
  eligibleHeads: any[];
}

export default function DepartmentsClient({
  initialDepartments,
  eligibleHeads
}: DepartmentsClientProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [headId, setHeadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, headId: headId || null })
      });

      if (res.ok) {
        setName('');
        setHeadId('');
        router.refresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to create department.');
      }
    } catch (e) {
      setErrorMsg('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignHead = async (deptId: string, selectedHeadId: string) => {
    setActionLoading(deptId);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deptId, headId: selectedHeadId || null })
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update department head.');
      }
    } catch (e) {
      alert('Network connection error.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department? Any members will be decoupled, and this action cannot be undone.')) {
      return;
    }

    setActionLoading(deptId);
    try {
      const res = await fetch(`/api/admin/departments?id=${deptId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete department.');
      }
    } catch (e) {
      alert('Network connection error.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 1. Create Department Form Panel */}
      <div className="bg-card border border-border p-6 rounded-2xl h-fit space-y-6">
        <div>
          <h3 className="text-lg font-bold font-outfit">Create Department</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Initialize a new organizational team.</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-semibold">Department Name</label>
            <input
              type="text"
              placeholder="e.g. Sales, Marketing, HR"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm placeholder:text-muted-foreground/60"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-semibold">Assign Manager (Optional)</label>
            <select
              value={headId}
              onChange={(e) => setHeadId(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="" className="bg-card">-- Select Manager --</option>
              {eligibleHeads.map((head) => (
                <option key={head.id} value={head.id} className="bg-card">
                  {head.name} ({head.email})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 gradient-bg-indigo text-white font-bold py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Initialize Team
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. Departments Grid List */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold font-outfit">Active Departments ({initialDepartments.length})</h3>

        {initialDepartments.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground border border-border border-dashed rounded-2xl bg-card">
            No departments defined yet. Establish one using the creation console.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialDepartments.map((dept) => (
              <div key={dept.id} className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{dept.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span>{dept._count?.members || 0} active employees</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(dept.id)}
                    disabled={actionLoading === dept.id}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/15 cursor-pointer disabled:opacity-50"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

                <div className="border-t border-border pt-4 mt-2 space-y-2">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Appointed Manager</label>
                  
                  <div className="relative">
                    <Award className="absolute left-3 top-3 w-4 h-4 text-indigo-400" />
                    <select
                      value={dept.headId || ''}
                      onChange={(e) => handleAssignHead(dept.id, e.target.value)}
                      disabled={actionLoading === dept.id}
                      className="w-full pl-9 pr-4 py-2 bg-secondary/35 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-semibold"
                    >
                      <option value="" className="bg-card">No Manager Assigned</option>
                      {eligibleHeads.map((head) => (
                        <option key={head.id} value={head.id} className="bg-card">
                          {head.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
