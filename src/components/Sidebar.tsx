/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  CalendarClock,
  Users,
  Calculator,
  BarChart3,
  BookOpenCheck,
  Settings as SettingsIcon,
  Scissors,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'intake'
  | 'orders'
  | 'scheduling'
  | 'workers'
  | 'feasibility'
  | 'analytics'
  | 'research'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingAttentionCount: number;
  totalActiveCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingAttentionCount,
  totalActiveCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'intake',
      label: 'New Customer Order',
      icon: <PlusCircle className="w-4 h-4" />,
    },
    {
      id: 'orders',
      label: 'Manage Orders',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: totalActiveCount,
    },
    {
      id: 'scheduling',
      label: 'Order Scheduling',
      icon: <CalendarClock className="w-4 h-4" />,
      badge: pendingAttentionCount > 0 ? pendingAttentionCount : undefined,
    },
    {
      id: 'workers',
      label: 'Worker Management',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'feasibility',
      label: 'Date Feasibility Checker',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: 'Reports & Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'research',
      label: 'Research Demonstration',
      icon: <BookOpenCheck className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon className="w-4 h-4" />,
    },
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#23150F] text-[#FAF7F2] flex flex-col border-r border-[#3A261D] transition-transform duration-200 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#3A261D]/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C89758] text-[#23150F] flex items-center justify-center font-bold shadow-xs">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="font-display text-lg font-bold tracking-tight text-[#FAF7F2]">
                TAILORTRACK
              </div>
              <div className="text-[11px] text-[#C89758] tracking-wider uppercase font-medium">
                Alteration Management
              </div>
            </div>
          </div>
        </div>

        {/* System Simulation Badge */}
        <div className="px-5 py-3 bg-[#1C100B] border-b border-[#3A261D]/50 text-xs text-[#A8988B] flex items-center justify-between">
          <span>Simulation Engine</span>
          <span className="text-[#C89758] font-mono text-[11px]">v1.0 Research</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#C89758] text-[#1C100B] shadow-xs'
                    : 'text-[#D8CEBD] hover:bg-[#2F1C14] hover:text-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#1C100B]' : 'text-[#C89758]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                      isActive
                        ? 'bg-[#1C100B] text-[#FAF7F2]'
                        : item.id === 'scheduling' && pendingAttentionCount > 0
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-[#3A261D] text-[#D8CEBD]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Research Study Citation Footer */}
        <div className="p-4 border-t border-[#3A261D] bg-[#1C100B]/80 text-[11px] text-[#A8988B] leading-relaxed">
          <div className="font-semibold text-[#D8CEBD] mb-1">Proposed Shop Model</div>
          <div className="line-clamp-2 italic text-[#958578]">
            "Promise-Date Quoting and Skill-Matched Job Assignment"
          </div>
          <div className="mt-2 pt-2 border-t border-[#3A261D]/60 flex items-center justify-between text-[10px] text-[#867568]">
            <span>6-Day Work Week · 8h/Day</span>
            <span className="text-[#C89758]">Active</span>
          </div>
        </div>
      </aside>
    </>
  );
};
