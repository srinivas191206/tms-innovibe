'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Mail, Save, Check } from 'lucide-react';

interface SettingsClientProps {
  initialSetting: any;
}

export default function SettingsClient({ initialSetting }: SettingsClientProps) {
  const router = useRouter();
  
  const [officeStartTime, setOfficeStartTime] = useState(initialSetting.officeStartTime);
  const [officeEndTime, setOfficeEndTime] = useState(initialSetting.officeEndTime);
  const [emailsEnabled, setEmailsEnabled] = useState(initialSetting.emailsEnabled);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeStartTime,
          officeEndTime,
          emailsEnabled
        })
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update settings.');
      }
    } catch (e) {
      setErrorMsg('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-card border border-border p-8 rounded-3xl space-y-6 shadow-sm">
      <div>
        <h3 className="text-lg font-bold font-outfit">Corporate Schedule & Alerts</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Control late arrivals policies and notification pipelines.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4" />
          Settings updated successfully. Operational limits applied.
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Time */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Office Start Hour (Late Threshold)
            </label>
            <input
              type="time"
              value={officeStartTime}
              onChange={(e) => setOfficeStartTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-semibold"
              required
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Selfie check-ins clocked beyond this specific timestamp will automatically be stamped as <strong>LATE</strong>.
            </p>
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              Office Close Hour (Expected Check-out)
            </label>
            <input
              type="time"
              value={officeEndTime}
              onChange={(e) => setOfficeEndTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-semibold"
              required
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              The checkpoint threshold to evaluate missing checkouts and trigger automated alerts.
            </p>
          </div>
        </div>

        {/* Email Alerts Toggle */}
        <div className="border-t border-border pt-6 flex items-start justify-between gap-6">
          <div className="space-y-1">
            <label className="text-sm font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              Automated Email Alerts Pipeline
            </label>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              Toggle this control to switch off SMTP email alerts. In-app alerts will continue to populate normally inside dashboards.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEmailsEnabled(!emailsEnabled)}
            className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
              emailsEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                emailsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        {/* Submit */}
        <div className="border-t border-border pt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-1.5 gradient-bg-indigo text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all text-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Commit Configurations
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
