'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Plus, Search, Edit2, Trash2, Mail, Briefcase, Key, Shield, UserCheck, X } from 'lucide-react';

interface EmployeesClientProps {
  initialUsers: any[];
  departments: any[];
}

export default function EmployeesClient({
  initialUsers,
  departments
}: EmployeesClientProps) {
  const router = useRouter();
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  
  // Panel UI states
  const [isOpen, setIsOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  
  // Form fields state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [departmentId, setDepartmentId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle open creation drawer
  const handleOpenCreate = () => {
    setEditUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('EMPLOYEE');
    setDepartmentId('');
    setErrorMsg('');
    setIsOpen(true);
  };

  // Handle open edit drawer
  const handleOpenEdit = (user: any) => {
    setEditUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Empty = don't update password
    setRole(user.role);
    setDepartmentId(user.departmentId || '');
    setErrorMsg('');
    setIsOpen(true);
  };

  // Submit create or edit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    setErrorMsg('');

    const isEdit = !!editUser;
    const url = '/api/admin/employees';
    const method = isEdit ? 'PATCH' : 'POST';
    const body = {
      id: isEdit ? editUser.id : undefined,
      name,
      email,
      password: password || undefined,
      role,
      departmentId: departmentId || null
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to submit employee form.');
      }
    } catch (e) {
      setErrorMsg('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Delete employee account
  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This will remove all their tasks and attendance records.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/employees?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete employee.');
      }
    } catch (e) {
      alert('Network connection error.');
    }
  };

  // Perform search and filter logic
  const filteredUsers = initialUsers.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = 
      filterDept === 'ALL' || 
      (filterDept === 'NONE' && !user.departmentId) || 
      user.departmentId === filterDept;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
            />
          </div>

          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2.5 bg-card border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold shrink-0"
          >
            <option value="ALL">All Departments</option>
            <option value="NONE">No Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 gradient-bg-indigo text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all text-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Approve New User
        </button>
      </div>

      {/* Employees Grid list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/40 border-b border-border font-bold text-muted-foreground">
                <th className="p-4">Employee Details</th>
                <th className="p-4">Department</th>
                <th className="p-4">Dashboard Role</th>
                <th className="p-4">Appointed On</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No employees found matching the filters.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-bg-indigo flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-snug">{u.name}</p>
                          <p className="text-muted-foreground text-[10px] leading-none mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-muted-foreground">
                        {u.department?.name || <span className="italic text-muted-foreground/60">No Department</span>}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold tracking-wider uppercase ${
                        u.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400' :
                        u.role === 'DEPT_HEAD' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-slate-500/10 text-muted-foreground'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-colors border border-transparent hover:border-indigo-500/15 cursor-pointer inline-flex"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/15 cursor-pointer inline-flex"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER POPUP PANEL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border-l border-border flex flex-col p-6 animate-in slide-in-from-right duration-300 relative shadow-2xl glass">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h4 className="font-bold text-lg font-outfit">{editUser ? 'Edit Employee Account' : 'Approve Employee Account'}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{editUser ? 'Modify credentials and roles.' : 'Create a new corporate log.'}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Error messaging */}
            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 py-4 space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Employee Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g. Luke Skywalker"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="e.g. luke@innovibe.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">
                  {editUser ? 'Password (Leave blank to keep current)' : 'Security Password'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder={editUser ? '••••••••' : 'Enter login password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                    required={!editUser}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Dashboard Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold"
                  >
                    <option value="EMPLOYEE">Employee (Standard access)</option>
                    <option value="DEPT_HEAD">Department Head (Team control)</option>
                    <option value="ADMIN">Administrator (Full root control)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Department Allocation</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold"
                  >
                    <option value="">No Department Assigned</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
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
                    <UserCheck className="w-4 h-4" />
                    {editUser ? 'Save Account Changes' : 'Create & Approve Account'}
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
