'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutDashboard,
  Users,
  Building,
  CalendarDays,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  User,
  Clock,
  Briefcase,
  FileCheck
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  // Admin Navigation
  { name: 'Admin Overview', href: '/admin', icon: LayoutDashboard, roles: ['ADMIN'] },
  { name: 'Manage Departments', href: '/admin/departments', icon: Building, roles: ['ADMIN'] },
  { name: 'Manage Employees', href: '/admin/employees', icon: Users, roles: ['ADMIN'] },
  { name: 'Attendance Logs', href: '/admin/attendance', icon: CalendarDays, roles: ['ADMIN'] },
  { name: 'Office Timings', href: '/admin/settings', icon: Settings, roles: ['ADMIN'] },
  
  // Department Head Navigation
  { name: 'Head Overview', href: '/head', icon: LayoutDashboard, roles: ['DEPT_HEAD'] },
  { name: 'Assign Tasks', href: '/head/tasks', icon: Briefcase, roles: ['DEPT_HEAD'] },
  { name: 'Team Attendance', href: '/head/attendance', icon: CalendarDays, roles: ['DEPT_HEAD'] },
  
  // Employee Navigation
  { name: 'My Portal', href: '/employee', icon: LayoutDashboard, roles: ['EMPLOYEE', 'DEPT_HEAD', 'ADMIN'] },
  { name: 'AI Face Attendance', href: '/employee/attendance', icon: Clock, roles: ['EMPLOYEE', 'DEPT_HEAD', 'ADMIN'] },
  { name: 'My Tasks', href: '/employee/tasks', icon: Briefcase, roles: ['EMPLOYEE', 'DEPT_HEAD', 'ADMIN'] },
  { name: 'Leave Requests', href: '/employee/leaves', icon: FileCheck, roles: ['EMPLOYEE', 'DEPT_HEAD', 'ADMIN'] },
  { name: 'My Settings', href: '/employee/settings', icon: Settings, roles: ['EMPLOYEE', 'DEPT_HEAD', 'ADMIN'] }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userRole = session?.user?.role || 'EMPLOYEE';
  const filteredNavItems = SIDEBAR_ITEMS.filter((item) => item.roles.includes(userRole));

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch in-app notifications
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [status]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to mark notifications as read:', e);
    }
  };

  const markSingleAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-[#1e1b4b] to-[#020617] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-400 font-medium tracking-wide animate-pulse">Syncing session secure tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card text-card-foreground shrink-0 select-none">
        <div className="h-16 flex items-center px-6 border-b border-border bg-accent/20">
          <span className="font-extrabold text-xl tracking-tight text-indigo-500 font-outfit">INNOVIBE <span className="text-foreground/80 font-normal text-sm">TMS+AI</span></span>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'gradient-bg-indigo text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 shrink-0 transition-transform duration-300 ${isActive ? 'rotate-3 scale-110' : 'group-hover:scale-110'}`} />
                {item.name}
                {isActive && <ChevronRight className="ml-auto w-4 h-4 text-white" />}
              </a>
            );
          })}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-border bg-accent/25">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full gradient-bg-indigo flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{session?.user?.role?.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/65 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg font-outfit uppercase tracking-wider hidden sm:block">
              {filteredNavItems.find((item) => item.href === pathname)?.name || 'Portal'}
            </h1>
          </div>

          {/* Quick Actions (Header Right) */}
          <div className="flex items-center gap-3">


            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-colors duration-200 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Tray */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 py-3 glass animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-border">
                    <span className="font-bold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-500 font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto px-2 py-2 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">You have no new alerts.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markSingleAsRead(n.id)}
                          className={`p-3 rounded-xl transition-colors cursor-pointer text-xs ${
                            n.read ? 'hover:bg-secondary/40' : 'bg-indigo-500/10 hover:bg-indigo-500/15 border-l-2 border-indigo-500'
                          }`}
                        >
                          <div className="flex justify-between font-bold mb-1">
                            <span className="text-indigo-400 capitalize">{n.type.toLowerCase().replace('_', ' ')}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content Frame */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 3. MOBILE SIDEBAR DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex animate-in fade-in duration-200">
          <div className="w-64 bg-card border-r border-border flex flex-col p-4 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between pb-6 border-b border-border">
              <span className="font-extrabold text-lg text-indigo-500 font-outfit">INNOVIBE TMS</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                      isActive
                        ? 'gradient-bg-indigo text-white'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 shrink-0" />
                    {item.name}
                  </a>
                );
              })}
            </nav>
            <div className="border-t border-border pt-4 mt-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full gradient-bg-indigo flex items-center justify-center text-white font-bold">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold">{session?.user?.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{session?.user?.role?.toLowerCase()}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
          {/* Close tap target overlay */}
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)}></div>
        </div>
      )}
    </div>
  );
}
