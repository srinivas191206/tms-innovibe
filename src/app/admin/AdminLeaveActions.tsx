'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

export default function AdminLeaveActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    setLoading(status);
    try {
      const res = await fetch(`/api/leaves`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status })
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to update leave request status.');
      }
    } catch (e) {
      console.error('Leave action error:', e);
      alert('Network connection error.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => handleAction('APPROVED')}
        disabled={loading !== null}
        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-emerald-600/10"
      >
        {loading === 'APPROVED' ? (
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
        Approve
      </button>
      <button
        onClick={() => handleAction('REJECTED')}
        disabled={loading !== null}
        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-rose-600/10"
      >
        {loading === 'REJECTED' ? (
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
        Reject
      </button>
    </div>
  );
}
