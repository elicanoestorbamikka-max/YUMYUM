/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Clock,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  User,
  Scissors,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Order, ShopSettings, Worker } from '../types';
import {
  formatDate,
  formatFriendlyDate,
  getDayName,
  getRequiredSkill,
  parseDate,
} from '../utils/feasibilityEngine';

interface OrderSchedulingProps {
  orders: Order[];
  workers: Worker[];
  settings: ShopSettings;
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onNavigateToManageOrders: () => void;
}

export const OrderScheduling: React.FC<OrderSchedulingProps> = ({
  orders,
  workers,
  settings,
  onUpdateOrderStatus,
  onNavigateToManageOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('active'); // active, all, or specific
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('timeline');

  const todayStr = useMemo(() => formatDate(new Date()), []);

  // Filtered and Sorted by EDD (Earliest Due Date first)
  const scheduledOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (selectedStatus === 'active') {
          if (o.status !== 'Accepted' && o.status !== 'In Progress' && o.status !== 'Ready') {
            return false;
          }
        } else if (selectedStatus !== 'all' && o.status !== selectedStatus) {
          return false;
        }

        if (selectedWorkerId !== 'All' && o.assignedWorkerId !== selectedWorkerId) {
          return false;
        }

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchId = o.id.toLowerCase().includes(q);
          const matchName = o.customerName.toLowerCase().includes(q);
          if (!matchId && !matchName) return false;
        }

        return true;
      })
      .sort((a, b) => a.quotedPickupDate.localeCompare(b.quotedPickupDate));
  }, [orders, selectedStatus, selectedWorkerId, searchTerm]);

  // Group by Quoted Pickup Date for Timeline mode
  const dateGroups = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    for (const order of scheduledOrders) {
      const d = order.quotedPickupDate;
      if (!groups[d]) groups[d] = [];
      groups[d].push(order);
    }
    return Object.entries(groups).sort(([dA], [dB]) => dA.localeCompare(dB));
  }, [scheduledOrders]);

  // Color Indicator helper based on Section 7:
  // Green: Accepted
  // Yellow: Pending or In Progress
  // Blue: Ready
  // Gray: Picked Up
  // Red: Declined or Requires Attention
  const getSchedulingColorClasses = (order: Order) => {
    if (order.status === 'Declined' || order.isOverride || order.isLate) {
      return {
        border: 'border-l-4 border-l-rose-500 border-[#E8E2D6]',
        badge: 'text-rose-700 bg-rose-50 border-rose-200',
        label: order.isLate ? 'Late Attention' : order.isOverride ? 'Owner Override' : 'Declined',
      };
    }
    if (order.status === 'Accepted') {
      return {
        border: 'border-l-4 border-l-emerald-500 border-[#E8E2D6]',
        badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        label: 'Accepted (Scheduled)',
      };
    }
    if (order.status === 'In Progress') {
      return {
        border: 'border-l-4 border-l-amber-500 border-[#E8E2D6]',
        badge: 'text-amber-700 bg-amber-50 border-amber-200',
        label: 'In Progress (Active Work)',
      };
    }
    if (order.status === 'Ready') {
      return {
        border: 'border-l-4 border-l-blue-500 border-[#E8E2D6]',
        badge: 'text-blue-700 bg-blue-50 border-blue-200',
        label: 'Ready for Collection',
      };
    }
    return {
      border: 'border-l-4 border-l-slate-400 border-[#E8E2D6]',
      badge: 'text-slate-600 bg-slate-100 border-slate-200',
      label: 'Picked Up',
    };
  };

  return (
    <div className="space-y-6">
      {/* Overview & Rule Banner */}
      <div className="bg-white rounded-xl p-5 border border-[#E8E2D6] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#C89758]" />
            <h2 className="font-display text-lg font-bold text-[#2C1810]">
              Earliest Due Date (EDD) Priority Scheduling
            </h2>
          </div>
          <p className="text-xs text-[#7B6A5C] mt-1">
            Jobs are sequenced strictly by quoted delivery deadline to prevent tardiness and optimize throughput.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] rounded-lg border border-[#E0D7C9]">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'timeline'
                ? 'bg-[#2C1810] text-[#FAF7F2] shadow-xs'
                : 'text-[#7B6A5C] hover:text-[#2C1810]'
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-[#2C1810] text-[#FAF7F2] shadow-xs'
                : 'text-[#7B6A5C] hover:text-[#2C1810]'
            }`}
          >
            Prioritized Table
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-[#E8E2D6] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#8C7B6E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order ID or customer..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs"
            />
          </div>

          {/* Worker Filter */}
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E0D7C9] bg-white text-xs text-[#2C1810]"
          >
            <option value="All">All Tailor Workbenches</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.role})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E0D7C9] bg-white text-xs text-[#2C1810]"
          >
            <option value="active">Active Schedule (Accepted, In Progress, Ready)</option>
            <option value="all">All Records</option>
            <option value="Accepted">Accepted Only</option>
            <option value="In Progress">In Progress Only</option>
            <option value="Ready">Ready Only</option>
            <option value="Declined">Declined Only</option>
          </select>
        </div>

        {/* Legend */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] text-[#7B6A5C]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Accepted
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Ready
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Attention/Late
          </span>
        </div>
      </div>

      {/* VIEW 1: Timeline By Quoted Date */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {dateGroups.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-[#E8E2D6] text-xs text-[#7B6A5C]">
              No scheduled orders match current filters.
            </div>
          ) : (
            dateGroups.map(([dateStr, ordersOnDate]) => {
              const totalMins = ordersOnDate.reduce((sum, o) => sum + (o.estimatedMinutes || 0), 0);
              const isToday = dateStr === todayStr;

              return (
                <div key={dateStr} className="bg-white rounded-xl border border-[#E8E2D6] overflow-hidden shadow-xs">
                  {/* Date Header Strip */}
                  <div className={`px-5 py-3 border-b flex items-center justify-between text-xs ${
                    isToday
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950 font-bold'
                      : 'bg-[#FAF7F2] border-[#E8E2D6] text-[#2C1810]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-sm font-bold">
                        {formatFriendlyDate(dateStr)} ({getDayName(dateStr)})
                      </span>
                      {isToday && (
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">
                          TODAY'S DISPATCH
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[#7B6A5C]">
                      <span>{ordersOnDate.length} order(s)</span>
                      <span className="mx-2">·</span>
                      <span className="font-semibold text-[#2C1810]">{totalMins} min committed</span>
                    </div>
                  </div>

                  {/* Orders Cards Grid on this day */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ordersOnDate.map((order) => {
                      const assigned = workers.find((w) => w.id === order.assignedWorkerId);
                      const style = getSchedulingColorClasses(order);
                      const reqSkill = getRequiredSkill(order.alterationType, settings);

                      return (
                        <div
                          key={order.id}
                          className={`p-4 rounded-lg bg-white border shadow-2xs hover:shadow-xs transition-shadow space-y-2 ${style.border}`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-[#2C1810]">{order.id}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${style.badge}`}>
                              {order.status}
                            </span>
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#2C1810] truncate">
                              {order.customerName}
                            </div>
                            <div className="text-xs text-[#7B6A5C] mt-0.5">
                              {order.alterationType} · {order.garmentType}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#EFEAE1] flex items-center justify-between text-[11px] text-[#7B6A5C]">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#C89758]" />
                              <span className="font-medium text-[#2C1810]">
                                {assigned ? assigned.name : 'Unassigned'}
                              </span>
                            </div>
                            <div className="font-mono font-semibold text-[#2C1810]">
                              {order.estimatedMinutes} min
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[#8C7B6E] pt-1">
                            <span>Skill: {reqSkill}</span>
                            {order.isOverride && (
                              <span className="text-amber-800 font-semibold">Override</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: Prioritized Earliest Due Date (EDD) Table */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-[#E8E2D6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8E2D6] text-[#7B6A5C]">
                  <th className="py-3 px-4 font-semibold">Priority #</th>
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Alteration Type</th>
                  <th className="py-3 px-4 font-semibold">Required Skill</th>
                  <th className="py-3 px-4 font-semibold">Est. Min</th>
                  <th className="py-3 px-4 font-semibold">Assigned Tailor</th>
                  <th className="py-3 px-4 font-semibold">Requested Date</th>
                  <th className="py-3 px-4 font-semibold">Quoted Pickup (EDD)</th>
                  <th className="py-3 px-4 font-semibold">Status Indicator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE1]">
                {scheduledOrders.map((order, idx) => {
                  const assigned = workers.find((w) => w.id === order.assignedWorkerId);
                  const style = getSchedulingColorClasses(order);
                  const reqSkill = getRequiredSkill(order.alterationType, settings);

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#C89758]">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#2C1810]">
                        {order.id}
                        {order.isRush && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 rounded block w-fit mt-0.5">
                            RUSH
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#2C1810]">
                        {order.customerName}
                      </td>
                      <td className="py-3 px-4 text-[#5D4E43]">
                        {order.alterationType} ({order.garmentType})
                      </td>
                      <td className="py-3 px-4 text-[#7B6A5C] font-mono">
                        {reqSkill}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#2C1810]">
                        {order.estimatedMinutes} min
                      </td>
                      <td className="py-3 px-4 font-medium text-[#2C1810]">
                        {assigned?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#8C7B6E]">
                        {order.requestedPickupDate}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-[#2C1810]">{order.quotedPickupDate}</div>
                        <div className="text-[10px] text-[#C89758]">{getDayName(order.quotedPickupDate)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${style.badge}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
