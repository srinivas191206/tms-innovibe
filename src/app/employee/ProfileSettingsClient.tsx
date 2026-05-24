'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Camera, Lock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProfileSettingsClient() {
  const { data: session, update } = useSession();
  
  const [name, setName] = useState(session?.user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState(session?.user?.photo || '');
  
  const [fileLoading, setFileLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPhoto(data.filePath);
        setStatus({ type: 'SUCCESS', text: 'New photo uploaded successfully! Click save to apply changes.' });
      } else {
        const data = await res.json();
        setStatus({ type: 'ERROR', text: data.error || 'Failed to upload photo.' });
      }
    } catch (err) {
      setStatus({ type: 'ERROR', text: 'Connection error during upload.' });
    } finally {
      setFileLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus({ type: 'ERROR', text: 'Name cannot be empty.' });
      return;
    }

    if (password) {
      if (password.length < 6) {
        setStatus({ type: 'ERROR', text: 'Password must be at least 6 characters.' });
        return;
      }
      if (password !== confirmPassword) {
        setStatus({ type: 'ERROR', text: 'Passwords do not match.' });
        return;
      }
    }

    setSaveLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          photo: photo || null,
          password: password || undefined,
        }),
      });

      if (res.ok) {
        // Sync the NextAuth Session Client Context immediately!
        await update({
          name: name.trim(),
          photo: photo || null,
        });

        setPassword('');
        setConfirmPassword('');
        setStatus({ type: 'SUCCESS', text: 'Profile changes successfully synchronized!' });
      } else {
        const data = await res.json();
        setStatus({ type: 'ERROR', text: data.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setStatus({ type: 'ERROR', text: 'Network connection failure.' });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold font-outfit text-slate-900">Personal Settings</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Keep your corporate credentials and contact files verified.</p>
      </div>

      {status && (
        <div className={`flex items-start gap-2 p-3.5 border rounded-xl text-xs leading-relaxed animate-in fade-in duration-200 ${
          status.type === 'SUCCESS' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {status.type === 'SUCCESS' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{status.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Avatar Upload Frame */}
        <div className="flex items-center gap-4">
          <div className="relative group select-none cursor-pointer">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt="Avatar Profile"
                className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <User className="w-7 h-7" />
              </div>
            )}
            
            {/* Upload Hover Target Overlay */}
            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
              <Camera className="w-5 h-5" />
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={fileLoading || saveLoading}
              />
            </label>

            {fileLoading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Avatar Photo</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Click photo to upload custom JPG/PNG file.</p>
          </div>
        </div>

        {/* Name input */}
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-semibold block">Full Corporate Name</label>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saveLoading}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none text-xs text-slate-900"
            required
          />
        </div>

        {/* Change Password Block */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Security Credentials (Optional)</label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600 font-semibold">New Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={saveLoading}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-600 font-semibold">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={saveLoading}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none text-xs text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saveLoading || fileLoading}
          className="w-full flex items-center justify-center gap-1.5 gradient-bg-indigo text-white font-bold py-2 rounded-xl hover:shadow-md hover:shadow-indigo-500/10 active:scale-[0.98] transition-all text-xs cursor-pointer disabled:opacity-50"
        >
          {saveLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            'Save Changes & Sync'
          )}
        </button>
      </form>
    </div>
  );
}
