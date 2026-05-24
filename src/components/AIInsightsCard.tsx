'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Brain, 
  HelpCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface DelayRisk {
  taskTitle: string;
  assignedTo: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

interface SmartAssignment {
  taskTitle: string;
  recommendedTo: string;
  reason: string;
}

interface AIInsightsResponse {
  systemSummary: string;
  delayRisks: DelayRisk[];
  smartAssignments: SmartAssignment[];
  productivityBoosters: string[];
}

export default function AIInsightsCard() {
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/insights');
      if (!res.ok) {
        throw new Error('Failed to query InnoVibe AI engines.');
      }
      const data = await res.json();
      setInsights(data);
    } catch (e: any) {
      setError(e.message || 'AI Telemetry connection offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4 relative overflow-hidden animate-pulse">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Brain className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold font-outfit text-indigo-400">Gemini Cognitive Insights</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Synthesizing corporate task telemetry & timings...</p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-indigo-400 animate-bounce" />
        </div>
        <div className="h-16 bg-secondary/40 border border-border/50 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-secondary/30 border border-border/40 rounded-2xl"></div>
          <div className="h-24 bg-secondary/30 border border-border/40 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-card border border-rose-500/20 rounded-3xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-rose-500">AI Synthesizer Connection Offline</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{error}</p>
          </div>
        </div>
        <button 
          onClick={fetchInsights} 
          className="p-2 hover:bg-secondary rounded-xl transition-colors border border-border text-muted-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-6 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
      {/* Decorative backdrop shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
      
      {/* AI Card Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/15">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-outfit text-foreground flex items-center gap-1.5">
              Gemini Cognitive Insights
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 rounded-lg text-[9px] font-extrabold uppercase tracking-wide">Live</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Empowered by real-time neural network corporate performance auditing.</p>
          </div>
        </div>
        
        <button 
          onClick={fetchInsights}
          className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-400 px-2.5 py-1 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Insights
        </button>
      </div>

      {/* 1. Executive Operations Summary */}
      <div className="p-4 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0 animate-pulse" />
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">Executive Summary</span>
            <p className="text-xs text-foreground/80 leading-relaxed font-light">{insights.systemSummary}</p>
          </div>
        </div>
      </div>

      {/* 2. Risks & Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Risk Alerts */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Delay Risk Matrix</span>
            <span className="text-[10px] text-muted-foreground font-semibold">{insights.delayRisks.length} flagged</span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {insights.delayRisks.map((risk, index) => {
              const colors = risk.risk === 'HIGH' 
                ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' 
                : risk.risk === 'MEDIUM' 
                ? 'bg-amber-500/5 border-amber-500/20 text-amber-500'
                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500';

              return (
                <div key={index} className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs truncate max-w-[170px] text-foreground/90">{risk.taskTitle}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase ${colors}`}>
                      {risk.risk} Risk
                    </span>
                  </div>
                  <div className="text-[10px] leading-relaxed text-muted-foreground font-light">
                    <span className="font-bold text-foreground/80">{risk.assignedTo}</span>: {risk.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart Assignments */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Smart Assignment Hub</span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Optimized
            </span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {insights.smartAssignments.map((assign, index) => (
              <div key={index} className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs truncate max-w-[170px] text-foreground/90">{assign.taskTitle}</p>
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 rounded-lg text-[9px] font-extrabold">
                    {assign.recommendedTo}
                  </span>
                </div>
                <div className="text-[10px] leading-relaxed text-muted-foreground font-light">
                  <span className="font-bold text-indigo-400">Recommendation</span>: {assign.reason}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Productivity Boosters (Actionable Tips) */}
      <div className="border-t border-border/60 pt-4 space-y-3">
        <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block">Neural Operations Recommendations</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {insights.productivityBoosters.map((tip, index) => (
            <div key={index} className="p-3 bg-secondary/30 hover:bg-secondary/45 border border-border/40 hover:border-border/60 rounded-xl flex items-start gap-2.5 transition-colors group cursor-pointer">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] leading-relaxed text-muted-foreground font-light group-hover:text-foreground/90 transition-colors">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
