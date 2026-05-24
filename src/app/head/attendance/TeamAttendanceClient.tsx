'use client';

import React, { useState } from 'react';
import { Search, MapPin, Eye, Calendar, Clock, Network, X } from 'lucide-react';

interface TeamAttendanceClientProps {
  initialRecords: any[];
  teamMembers: any[];
}

export default function TeamAttendanceClient({
  initialRecords,
  teamMembers
}: TeamAttendanceClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Apply filters
  const filteredRecords = initialRecords.filter((rec) => {
    const matchesSearch = rec.employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMember = selectedMember === 'ALL' || rec.employeeId === selectedMember;
    const matchesStatus = selectedStatus === 'ALL' || rec.status === selectedStatus;
    
    return matchesSearch && matchesMember && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search team member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
            />
          </div>

          {/* Member selector */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold"
          >
            <option value="ALL">All Team Members</option>
            {teamMembers.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:border-indigo-500 outline-none text-xs font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="HALF_DAY">HALF_DAY</option>
            <option value="ABSENT">ABSENT</option>
          </select>
        </div>
      </div>

      {/* Roster Logs Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/40 border-b border-border font-bold text-muted-foreground">
                <th className="p-4">Employee Details</th>
                <th className="p-4">Check In</th>
                <th className="p-4">Check Out</th>
                <th className="p-4">Lateness</th>
                <th className="p-4">Network IP</th>
                <th className="p-4">GPS Location</th>
                <th className="p-4 text-center">Audit Picture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No team records found matching filters.</td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const checkInDate = new Date(r.checkIn);
                  const checkOutDate = r.checkOut ? new Date(r.checkOut) : null;
                  
                  return (
                    <tr key={r.id} className="hover:bg-secondary/15 transition-colors">
                      {/* Name */}
                      <td className="p-4 font-bold flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full gradient-bg-indigo flex items-center justify-center text-white font-bold text-[10px]">
                          {r.employee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[120px]">{r.employee.name}</span>
                      </td>

                      {/* Check In */}
                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center gap-1 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{checkInDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                          <span>{checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Check Out */}
                      <td className="p-4 space-y-0.5">
                        {checkOutDate ? (
                          <>
                            <div className="flex items-center gap-1 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>{checkOutDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                              <span>{checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold">In Office</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider uppercase ${
                          r.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400' :
                          r.status === 'LATE' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      {/* Network IP */}
                      <td className="p-4 font-mono text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Network className="w-3.5 h-3.5 text-slate-400 animate-none" />
                          <span>{r.ipAddress || '127.0.0.1'}</span>
                        </div>
                      </td>

                      {/* GPS Location */}
                      <td className="p-4 text-muted-foreground font-mono">
                        {r.latitude && r.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}</span>
                          </a>
                        ) : (
                          <span className="italic text-muted-foreground/40">--</span>
                        )}
                      </td>

                      {/* Audit Picture */}
                      <td className="p-4 text-center">
                        {r.selfieUrl ? (
                          <div className="relative inline-block group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.selfieUrl}
                              alt="Selfie"
                              className="w-8 h-8 rounded-lg object-cover border border-border shadow-sm cursor-pointer hover:opacity-85 transition-all mx-auto"
                              onClick={() => setZoomImage(r.selfieUrl)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/45 rounded-lg">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 italic">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELFIE LIGHTBOX MODAL */}
      {zoomImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-card border border-border p-6 rounded-3xl relative glass shadow-2xl space-y-4">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
            >
              <X className="w-6 h-6" />
            </button>
            <h4 className="font-bold text-sm font-outfit">Audit Check-in Capture</h4>
            <div className="aspect-square w-full rounded-2xl overflow-hidden border border-border shadow-inner bg-slate-950/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomImage}
                alt="Audit Check-in Capture"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal text-center">
              Timestamp and facial biometric signatures validated by Innovibe scanner.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
