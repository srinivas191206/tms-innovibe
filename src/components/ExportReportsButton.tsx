'use client';

import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  ChevronDown, 
  FileText,
  Clock,
  Briefcase,
  FileCheck
} from 'lucide-react';

interface ExportReportsButtonProps {
  tasks?: any[];
  attendance?: any[];
  leaves?: any[];
  filenamePrefix?: string;
}

export default function ExportReportsButton({
  tasks = [],
  attendance = [],
  leaves = [],
  filenamePrefix = 'innovibe'
}: ExportReportsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const downloadCSV = (data: any[], typeName: string) => {
    if (data.length === 0) {
      alert(`No ${typeName} records are currently loaded to export.`);
      return;
    }

    // Flatten nested objects (e.g. employee name, department name) for cleaner CSV output
    const flattenedData = data.map(item => {
      const flat: Record<string, any> = {};
      
      const traverse = (obj: any, prefix = '') => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const val = obj[key];
            if (val && typeof val === 'object' && !(val instanceof Date)) {
              traverse(val, `${prefix}${key}_`);
            } else if (val instanceof Date) {
              flat[`${prefix}${key}`] = val.toISOString();
            } else {
              flat[`${prefix}${key}`] = val;
            }
          }
        }
      };
      
      traverse(item);
      return flat;
    });

    const headers = Object.keys(flattenedData[0]);
    const csvContent = [
      headers.join(','),
      ...flattenedData.map(row => 
        headers.map(header => {
          let val = row[header];
          if (val === null || val === undefined) val = '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}_${typeName}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  const handlePrintPDF = () => {
    window.print();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Export Operational Center
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop close target */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 mt-2.5 w-60 bg-card border border-border rounded-2xl shadow-xl z-50 py-2.5 glass animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="px-3.5 py-1.5 border-b border-border/60 mb-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Download CSV Spreadsheets</span>
            </div>

            {tasks.length > 0 && (
              <button
                onClick={() => downloadCSV(tasks, 'tasks')}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Task Roster ({tasks.length})
              </button>
            )}

            {attendance.length > 0 && (
              <button
                onClick={() => downloadCSV(attendance, 'attendance')}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                Attendance Log ({attendance.length})
              </button>
            )}

            {leaves.length > 0 && (
              <button
                onClick={() => downloadCSV(leaves, 'leaves')}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                <FileCheck className="w-4 h-4 text-rose-400" />
                Leave Registry ({leaves.length})
              </button>
            )}

            <div className="px-3.5 py-1.5 border-t border-border/60 mt-2 pt-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Document Options</span>
            </div>

            <button
              onClick={handlePrintPDF}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              Print Dashboard (PDF)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
