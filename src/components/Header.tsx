/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Plus, RotateCcw, Clock, Calendar, Edit2 } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  ownerName?: string;
  onOpenMobileSidebar: () => void;
  onNewOrderClick: () => void;
  onResetDataClick: () => void;
  onEditNamesClick?: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Operations Dashboard',
    subtitle: 'Real-time capacity, active orders, and worker workloads',
  },
  intake: {
    title: 'Customer Order Intake',
    subtitle: 'Promise-date feasibility check and automated skill-matched assignment',
  },
  orders: {
    title: 'Order Management',
    subtitle: 'Full order lifecycle, status tracking, and tardiness monitoring',
  },
  scheduling: {
    title: 'Order Priority Scheduling',
    subtitle: 'Earliest Due Date (EDD) dispatch queue and daily deadlines',
  },
  workers: {
    title: 'Worker & Skill Capacity',
    subtitle: 'Roster qualifications, committed minutes, and workload balance',
  },
  feasibility: {
    title: 'Date Feasibility Simulator',
    subtitle: 'Interactive calculation sandbox for promise-date quoting',
  },
  analytics: {
    title: 'Reports & Performance Analytics',
    subtitle: 'On-time completion rates, worker utilization, and rejection metrics',
  },
  research: {
    title: 'Research Case Demonstrations',
    subtitle: 'Interactive test cases from the simulation-based research study',
  },
  settings: {
    title: 'Shop Configuration & Settings',
    subtitle: 'Schedules, standard lead times, data backup, and privacy retention',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  ownerName = 'Mikka Estorba Elicano',
  onOpenMobileSidebar,
  onNewOrderClick,
  onResetDataClick,
  onEditNamesClick,
}) => {
  const meta = TAB_TITLES[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D6] px-4 sm:px-8 py-4 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Titles */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-[#2C1810] hover:bg-[#EFEAE1] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="truncate">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#2C1810] tracking-tight truncate">
              {meta.title}
            </h1>
            <p className="hidden sm:block text-xs text-[#7B6A5C] truncate mt-0.5">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Operational indicators, Owner badge, and Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Owner Identity Badge with Quick Rename Trigger */}
          <button
            onClick={onEditNamesClick}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EFEAE1] border border-[#E0D7C9] text-xs transition-all group cursor-pointer text-left"
            title="Click to modify Owner and Worker names"
          >
            <div className="w-5 h-5 rounded-full bg-[#C89758] text-[#2C1810] flex items-center justify-center font-bold text-[10px]">
              ME
            </div>
            <div>
              <span className="text-[10px] text-[#8C7B6E] flex items-center gap-1 font-medium leading-none">
                Shop Owner <Edit2 className="w-2.5 h-2.5 text-[#C89758] group-hover:scale-110 transition-transform" />
              </span>
              <span className="font-semibold text-[#2C1810] leading-tight block truncate max-w-[150px]">
                {ownerName}
              </span>
            </div>
          </button>

          {/* Shop Hours indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EFEAE1]/70 border border-[#E3DBD0] text-xs text-[#5D4E43]">
            <Clock className="w-3.5 h-3.5 text-[#C89758]" />
            <span>8h/day (480m)</span>
          </div>

          {/* Reset Baseline button */}
          <button
            onClick={onResetDataClick}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#7B6A5C] hover:text-[#2C1810] hover:bg-[#EFEAE1] rounded-lg transition-colors border border-transparent hover:border-[#E0D7C9]"
            title="Reset to research baseline data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          {/* New Order Primary CTA */}
          <button
            onClick={onNewOrderClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-[#FAF7F2] bg-[#2C1810] hover:bg-[#3D2317] rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>
    </header>
  );
};
