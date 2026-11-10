/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  Hammer,
  ShoppingBag,
  CheckCheck,
  XCircle,
  Users,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Calendar,
  Sparkles,
  Scissors,
} from 'lucide-react';
import { Order, ShopSettings, Worker, WorkerWorkload } from '../types';
import { formatFriendlyDate, getDayName } from '../utils/feasibilityEngine';
import { calculateWorkerWorkloads } from '../utils/storage';

interface DashboardProps {
  orders: Order[];
  workers: Worker[];
  settings: ShopSettings;
  onNavigateToIntake: () => void;
  onNavigateToOrders: (filterStatus?: string) => void;
  onNavigateToScheduling: () => void;
  onNavigateToWorkers: () => void;
  onNavigateToResearch: () => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  orders,
  workers,
  settings,
  onNavigateToIntake,
  onNavigateToOrders,
  onNavigateToScheduling,
  onNavigateToWorkers,
  onNavigateToResearch,
  onUpdateOrderStatus,
}) => {
  // Real-time calculated stats
  const totalOrders = orders.length;
  const acceptedOrders = orders.filter((o) => o.status === 'Accepted').length;
  const inProgressOrders = orders.filter((o) => o.status === 'In Progress').length;
  const readyOrders = orders.filter((o) => o.status === 'Ready').length;
  const pickedUpOrders = orders.filter((o) => o.status === 'Picked Up').length;
  const declinedOrders = orders.filter((o) => o.status === 'Declined').length;
  const pendingApprovalOrders = orders.filter(
    (o) => o.isOverride || (!o.assignedWorkerId && o.status === 'Accepted')
  );
  const totalWorkers = workers.length;

  // Active workers workload
  const workloads: WorkerWorkload[] = calculateWorkerWorkloads(workers, orders);

  // Upcoming Pickups (orders not yet picked up, sorted by quoted date ascending)
  const upcomingPickups = orders
    .filter((o) => o.status === 'Accepted' || o.status === 'In Progress' || o.status === 'Ready')
    .sort((a, b) => a.quotedPickupDate.localeCompare(b.quotedPickupDate))
    .slice(0, 5);

  // Recent Orders (most recently created)
  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // Helper for status badge style
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Accepted':
        return <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded text-xs font-medium">Accepted</span>;
      case 'In Progress':
        return <span className="text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded text-xs font-medium">In Progress</span>;
      case 'Ready':
        return <span className="text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded text-xs font-medium">Ready</span>;
      case 'Picked Up':
        return <span className="text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded text-xs font-medium">Picked Up</span>;
      case 'Declined':
        return <span className="text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded text-xs font-medium">Declined</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Research study banner */}
      <div className="bg-gradient-to-r from-[#2C1810] via-[#382319] to-[#2C1810] text-[#FAF7F2] rounded-xl p-6 border border-[#4A3225] shadow-xs relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2 text-xs font-medium text-[#C89758] mb-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Shop Owner: {settings.ownerName || 'Mikka Estorba Elicano'} · Simulation-Based System</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-[#FAF7F2] tracking-tight">
            Realistic Pickup Quoting with Skill-Matched Allocation
          </h2>
          <p className="text-sm text-[#D8CEBD] mt-2 leading-relaxed">
            Eliminate missed deadlines and bottlenecks. Every incoming order verifies worker minutes across
            the 6-day work calendar and automatically selects qualified tailors with the lowest committed workload.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={onNavigateToIntake}
              className="px-4 py-2 bg-[#C89758] hover:bg-[#B78446] text-[#2C1810] text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <span>Intake New Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToResearch}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-[#FAF7F2] text-xs font-semibold rounded-lg border border-white/20 transition-colors"
            >
              View Research Case Studies
            </button>
          </div>
        </div>
      </div>

      {/* 8 Primary Real-time Stat Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-[#2C1810]">
            Operational Metrics
          </h3>
          <span className="text-xs text-[#7B6A5C]">
            Live Shop Statistics · LocalStorage Synced
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* 1. Total Orders */}
          <div
            onClick={() => onNavigateToOrders('All')}
            className="bg-white rounded-xl p-4 border border-[#E8E2D6] hover:border-[#C89758] cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-[#7B6A5C] mb-2">
              <span className="text-xs font-medium">Total Orders</span>
              <Package className="w-4 h-4 text-[#C89758] group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#2C1810]">{totalOrders}</div>
            <div className="text-[11px] text-[#A8988B] mt-1">All time received</div>
          </div>

          {/* 2. Accepted Orders */}
          <div
            onClick={() => onNavigateToOrders('Accepted')}
            className="bg-white rounded-xl p-4 border border-[#E8E2D6] hover:border-emerald-500 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-[#7B6A5C] mb-2">
              <span className="text-xs font-medium">Accepted Orders</span>
              <CheckCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-700">{acceptedOrders}</div>
            <div className="text-[11px] text-[#A8988B] mt-1">Feasible date promised</div>
          </div>

          {/* 3. In Progress */}
          <div
            onClick={() => onNavigateToOrders('In Progress')}
            className="bg-white rounded-xl p-4 border border-[#E8E2D6] hover:border-amber-500 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-[#7B6A5C] mb-2">
              <span className="text-xs font-medium">In Progress</span>
              <Hammer className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-amber-700">{inProgressOrders}</div>
            <div className="text-[11px] text-[#A8988B] mt-1">Currently on workbench</div>
          </div>

          {/* 4. Ready for Pickup */}
          <div
            onClick={() => onNavigateToOrders('Ready')}
            className="bg-white rounded-xl p-4 border border-[#E8E2D6] hover:border-blue-500 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-[#7B6A5C] mb-2">
              <span className="text-xs font-medium">Ready for Pickup</span>
              <ShoppingBag className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-blue-700">{readyOrders}</div>
            <div className="text-[11px] text-[#A8988B] mt-1">Awaiting customer</div>
          </div>

          {/* 5. Picked Up */}
          <div
            onClick={() => onNavigateToOrders('Picked Up')}
            className="bg-white rounded-xl p-4 border border-[#E8E2D6] hover:border-slate-500 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-[#7B6A5C] mb-2">
              <span className="text-xs font-medium">Picked Up</span>
              <CheckCheck className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-slate-700">{pickedUpOrders}</div>
            <div className="text-[11px] text-[#A8988B] mt-1">Delivered to customer</div>
          </div>

          {/* 6. Declined Orders */}
          <div
            onClick={() => onNavigateToOrders('Declined')}
            className="bg-white rounded-xl p-4 border border-[#E8E2D6] hover:border-rose-500 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-[#7B6A5C] mb-2">
              <span className="text-xs font-medium">Declined Orders</span>
              <XCircle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-rose-700">{declinedOrders}</div>
            <div className="text-[11px] text-[#A8988B] mt-1">Capacity / rush conflict</div>
          </div>

          {/* 7. Needs Approval / Overrides */}
          <div
            onClick={() => onNavigateToScheduling()}
            className="bg-white rounded-xl p-4 border border-[#E8E2D6] hover:border-amber-600 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-[#7B6A5C] mb-2">
              <span className="text-xs font-medium">Owner Review</span>
              <AlertCircle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-amber-800">
              {pendingApprovalOrders.length}
            </div>
            <div className="text-[11px] text-[#A8988B] mt-1">Manual overrides flagged</div>
          </div>

          {/* 8. Total Workers */}
          <div
            onClick={onNavigateToWorkers}
            className="bg-white rounded-xl p-4 border border-[#E8E2D6] hover:border-[#2C1810] cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-[#7B6A5C] mb-2">
              <span className="text-xs font-medium">Total Workers</span>
              <Users className="w-4 h-4 text-[#2C1810] group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#2C1810]">{totalWorkers}</div>
            <div className="text-[11px] text-[#A8988B] mt-1">Active skill profiles</div>
          </div>
        </div>
      </section>

      {/* Orders that need Owner Attention / Overrides */}
      {pendingApprovalOrders.length > 0 && (
        <section className="bg-amber-50/70 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <h4 className="font-display text-sm font-bold text-amber-900">
              Orders Requiring Owner Attention ({pendingApprovalOrders.length})
            </h4>
          </div>
          <div className="space-y-2">
            {pendingApprovalOrders.map((order) => {
              const assigned = workers.find((w) => w.id === order.assignedWorkerId);
              return (
                <div
                  key={order.id}
                  className="bg-white p-3 rounded-lg border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-[#2C1810]">{order.id}</span>
                    <span className="text-[#5D4E43] font-medium">{order.customerName}</span>
                    <span className="text-[#8C7B6E]">· {order.alterationType} ({order.garmentType})</span>
                    {order.isOverride && (
                      <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">
                        Owner Override: {order.overrideReason || 'Assigned to ' + (assigned?.name || 'Worker')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onNavigateToOrders()}
                    className="text-amber-800 font-semibold hover:underline text-left sm:text-right"
                  >
                    Review in Orders →
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Two Column Layout: Worker Availability & Upcoming Pickups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Worker Availability Section */}
        <section className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-lg font-bold text-[#2C1810]">
                Worker Availability & Load
              </h3>
              <p className="text-xs text-[#7B6A5C] mt-0.5">
                Committed minutes across 6-day working week (480 min/day)
              </p>
            </div>
            <button
              onClick={onNavigateToWorkers}
              className="text-xs font-semibold text-[#C89758] hover:text-[#9E6E33] transition-colors"
            >
              Manage Roster →
            </button>
          </div>

          <div className="space-y-5">
            {workloads.map((worker) => {
              const isHigh = worker.workloadPercentage >= 75;
              const isModerate = worker.workloadPercentage >= 40 && worker.workloadPercentage < 75;

              return (
                <div key={worker.workerId} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#2C1810] text-sm">{worker.workerName}</span>
                      <span className="text-[#7B6A5C] ml-2">({worker.role})</span>
                    </div>
                    <div className="font-mono text-right">
                      <span className="font-bold text-[#2C1810]">
                        {worker.workloadPercentage}%
                      </span>
                      <span className="text-[#8C7B6E] ml-1">
                        ({worker.committedMinutes}m used / {worker.remainingMinutes}m free)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#EFEAE1] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh
                          ? 'bg-rose-600'
                          : isModerate
                          ? 'bg-[#C89758]'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, worker.workloadPercentage)}%` }}
                    />
                  </div>

                  {/* Skills tags */}
                  <div className="flex items-center justify-between text-[11px] text-[#7B6A5C]">
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.map((skill) => (
                        <span key={skill} className="text-[#7B6A5C] bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E8E2D6]">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <span className="text-[#9E8E80] font-mono">
                      {worker.assignedOrderCount} active jobs
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Upcoming Pickups Section */}
        <section className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-lg font-bold text-[#2C1810]">
                Upcoming Pickup Schedule
              </h3>
              <p className="text-xs text-[#7B6A5C] mt-0.5">
                Priority order deadlines (Earliest Due Date)
              </p>
            </div>
            <button
              onClick={onNavigateToScheduling}
              className="text-xs font-semibold text-[#C89758] hover:text-[#9E6E33] transition-colors"
            >
              View Schedule →
            </button>
          </div>

          {upcomingPickups.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#8C7B6E]">
              No pending pickups scheduled at this moment.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingPickups.map((order) => {
                const worker = workers.find((w) => w.id === order.assignedWorkerId);
                return (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D6] hover:border-[#C89758] transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#2C1810]">{order.id}</span>
                        {getStatusBadge(order.status)}
                        {order.isRush && (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                            RUSH
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-[#2C1810] mt-1 truncate">
                        {order.customerName}
                      </div>
                      <div className="text-[#7B6A5C] text-[11px] mt-0.5">
                        {order.alterationType} · {order.garmentType} · Assigned to {worker?.name || 'Unassigned'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-[#2C1810]">
                        {formatFriendlyDate(order.quotedPickupDate)}
                      </div>
                      <div className="text-[11px] text-[#C89758] font-medium">
                        {getDayName(order.quotedPickupDate)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Recent Orders Table */}
      <section className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#2C1810]">
              Recent Customer Orders
            </h3>
            <p className="text-xs text-[#7B6A5C] mt-0.5">
              Latest intake records and feasibility dispositions
            </p>
          </div>
          <button
            onClick={() => onNavigateToOrders('All')}
            className="text-xs font-semibold text-[#C89758] hover:text-[#9E6E33] transition-colors"
          >
            All Orders ({orders.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E8E2D6] text-[#7B6A5C]">
                <th className="pb-3 font-semibold">Order ID</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Alteration & Garment</th>
                <th className="pb-3 font-semibold">Est. Time</th>
                <th className="pb-3 font-semibold">Assigned Tailor</th>
                <th className="pb-3 font-semibold">Quoted Pickup</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE1]">
              {recentOrders.map((order) => {
                const assigned = workers.find((w) => w.id === order.assignedWorkerId);
                return (
                  <tr key={order.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3 font-mono font-bold text-[#2C1810]">{order.id}</td>
                    <td className="py-3">
                      <div className="font-semibold text-[#2C1810]">{order.customerName}</div>
                      <div className="text-[#8C7B6E] text-[11px]">{order.contactNumber}</div>
                    </td>
                    <td className="py-3 text-[#5D4E43]">
                      <span>{order.alterationType}</span>
                      <span className="text-[#8C7B6E] ml-1">({order.garmentType})</span>
                    </td>
                    <td className="py-3 font-mono text-[#5D4E43]">{order.estimatedMinutes} min</td>
                    <td className="py-3 text-[#5D4E43]">{assigned?.name || 'Unassigned'}</td>
                    <td className="py-3 font-mono text-[#2C1810]">
                      {formatFriendlyDate(order.quotedPickupDate)}
                    </td>
                    <td className="py-3">{getStatusBadge(order.status)}</td>
                    <td className="py-3 text-right">
                      {order.status === 'Accepted' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'In Progress')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
                        >
                          Start Job
                        </button>
                      )}
                      {order.status === 'In Progress' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'Ready')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'Ready' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'Picked Up')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                        >
                          Confirm Pickup
                        </button>
                      )}
                      {(order.status === 'Picked Up' || order.status === 'Declined') && (
                        <span className="text-[11px] text-[#A8988B] italic">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
