/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  Award,
  Scissors,
  HelpCircle,
} from 'lucide-react';
import { Order, ShopSettings, Worker } from '../types';
import { calculateWorkerWorkloads } from '../utils/storage';

interface ReportsAnalyticsProps {
  orders: Order[];
  workers: Worker[];
  settings: ShopSettings;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  orders,
  workers,
  settings,
}) => {
  const workloads = calculateWorkerWorkloads(workers, orders);

  // Core Research Metrics Calculations:
  const totalOrders = orders.length;

  // Accepted orders = orders with status Accepted, In Progress, Ready, Picked Up (excluding outright declined)
  const acceptedOrdersList = orders.filter((o) => o.status !== 'Declined');
  const acceptedCount = acceptedOrdersList.length;

  const declinedCount = orders.filter((o) => o.status === 'Declined').length;
  const renegotiatedCount = orders.filter((o) => Boolean(o.renegotiatedNewDate) || o.feasibilityResult === 'RENEGOTIATE').length;

  // Rejection Rate = (Declined + Renegotiated at intake) / Total Orders
  // Per research definition: "Rejection Rate = Orders declined or renegotiated at intake divided by total orders received."
  const rejectionAndRenegotiationCount = orders.filter(
    (o) => o.status === 'Declined' || o.feasibilityResult === 'RENEGOTIATE' || Boolean(o.renegotiatedNewDate)
  ).length;

  const rejectionRate = totalOrders > 0 ? (rejectionAndRenegotiationCount / totalOrders) * 100 : 0;

  // Completed Orders (Ready or Picked Up)
  const completedOrders = orders.filter((o) => o.status === 'Ready' || o.status === 'Picked Up');
  const onTimeCompleted = completedOrders.filter((o) => !o.isLate);
  const lateCompleted = completedOrders.filter((o) => o.isLate);

  // On-Time Completion Rate = Orders completed by their promised date divided by total accepted completed orders
  const onTimeRate =
    completedOrders.length > 0
      ? (onTimeCompleted.length / completedOrders.length) * 100
      : acceptedCount > 0
      ? 100
      : 0;

  // Average Tardiness (Number of days an order is completed after its promised pickup date)
  const totalTardinessDays = completedOrders.reduce((sum, o) => sum + (o.tardinessDays || 0), 0);
  const averageTardinessDays =
    completedOrders.length > 0 ? (totalTardinessDays / completedOrders.length) : 0;

  // Total Shop Available Minutes & Committed Minutes across 6-day horizon
  const totalShopAvailableMinutes = workloads.reduce((sum, w) => sum + w.availableMinutes, 0);
  const totalShopCommittedMinutes = workloads.reduce((sum, w) => sum + w.committedMinutes, 0);

  // Overall Worker Utilization = Assigned Working Hours divided by Available Working Hours
  const overallUtilization =
    totalShopAvailableMinutes > 0
      ? (totalShopCommittedMinutes / totalShopAvailableMinutes) * 100
      : 0;

  // Alteration Type Breakdown
  const altCounts = {
    'Waist Adjustment': orders.filter((o) => o.alterationType === 'Waist Adjustment').length,
    'Zipper Replacement': orders.filter((o) => o.alterationType === 'Zipper Replacement').length,
    'Hemming': orders.filter((o) => o.alterationType === 'Hemming').length,
  };

  // Status Breakdown
  const statusCounts = {
    Accepted: orders.filter((o) => o.status === 'Accepted').length,
    'In Progress': orders.filter((o) => o.status === 'In Progress').length,
    Ready: orders.filter((o) => o.status === 'Ready').length,
    'Picked Up': orders.filter((o) => o.status === 'Picked Up').length,
    Declined: declinedCount,
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Research Formulas Strip */}
      <div className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#C89758]" />
              <h2 className="font-display text-xl font-bold text-[#2C1810]">
                Performance Reports & Simulation Analytics
              </h2>
            </div>
            <p className="text-xs text-[#7B6A5C] mt-1">
              Rigorous operational KPIs adhering to simulation study definitions
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-[#FAF7F2] px-3.5 py-2 rounded-lg border border-[#E0D7C9] text-[#5D4E43]">
            <Clock className="w-3.5 h-3.5 text-[#C89758]" />
            <span>Standard Shop Shift: 480 min/day · 6-Day Week</span>
          </div>
        </div>
      </div>

      {/* 4 Core Research KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. On-Time Completion Rate */}
        <div className="bg-white rounded-xl p-5 border border-[#E8E2D6] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7B6A5C] mb-2">
            <span className="font-semibold">On-Time Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-3xl font-bold text-emerald-700">
            {onTimeRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#8C7B6E] mt-2 pt-2 border-t border-[#EFEAE1]">
            <span className="font-medium text-[#2C1810]">{onTimeCompleted.length}</span> of {completedOrders.length} completed on schedule
          </div>
          <div className="text-[10px] text-[#A8988B] mt-0.5">
            Formula: Completed by promise date ÷ Total completed
          </div>
        </div>

        {/* 2. Average Tardiness */}
        <div className="bg-white rounded-xl p-5 border border-[#E8E2D6] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7B6A5C] mb-2">
            <span className="font-semibold">Average Tardiness</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono text-3xl font-bold text-[#2C1810]">
            {averageTardinessDays.toFixed(2)}{' '}
            <span className="text-sm font-normal text-[#7B6A5C]">days</span>
          </div>
          <div className="text-[11px] text-[#8C7B6E] mt-2 pt-2 border-t border-[#EFEAE1]">
            <span className="font-medium text-rose-700">{lateCompleted.length}</span> overdue delivery occurrences
          </div>
          <div className="text-[10px] text-[#A8988B] mt-0.5">
            Formula: Days completed after quoted pickup date
          </div>
        </div>

        {/* 3. Worker Utilization */}
        <div className="bg-white rounded-xl p-5 border border-[#E8E2D6] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7B6A5C] mb-2">
            <span className="font-semibold">Worker Utilization</span>
            <Users className="w-4 h-4 text-[#C89758]" />
          </div>
          <div className="font-mono text-3xl font-bold text-[#2C1810]">
            {overallUtilization.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#8C7B6E] mt-2 pt-2 border-t border-[#EFEAE1]">
            <span className="font-medium text-[#2C1810]">{totalShopCommittedMinutes}m</span> committed of {totalShopAvailableMinutes}m total
          </div>
          <div className="text-[10px] text-[#A8988B] mt-0.5">
            Formula: Assigned Working Hours ÷ Available Hours
          </div>
        </div>

        {/* 4. Rejection / Renegotiation Rate */}
        <div className="bg-white rounded-xl p-5 border border-[#E8E2D6] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7B6A5C] mb-2">
            <span className="font-semibold">Intake Rejection Rate</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono text-3xl font-bold text-rose-700">
            {rejectionRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#8C7B6E] mt-2 pt-2 border-t border-[#EFEAE1]">
            <span className="font-medium text-rose-700">{declinedCount}</span> declined · <span className="font-medium text-amber-700">{renegotiatedCount}</span> renegotiated
          </div>
          <div className="text-[10px] text-[#A8988B] mt-0.5">
            Formula: (Declined + Renegotiated) ÷ Total Orders
          </div>
        </div>
      </div>

      {/* Two Column Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Worker Workload & Utilization Distribution */}
        <div className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-[#2C1810]">
                Worker Utilization Distribution
              </h3>
              <p className="text-xs text-[#7B6A5C]">
                Committed minutes divided by available shift hours
              </p>
            </div>
            <span className="font-mono text-xs text-[#C89758] font-semibold">
              Load Balancing
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {workloads.map((w) => {
              const pct = Math.min(100, w.workloadPercentage);
              const isHigh = pct >= 75;

              return (
                <div key={w.workerId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#2C1810]">{w.workerName}</span>
                      <span className="text-[#8C7B6E] ml-1.5">({w.role})</span>
                    </div>
                    <div className="font-mono font-bold text-[#2C1810]">
                      {pct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="w-full bg-[#EFEAE1] h-4 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isHigh ? 'bg-rose-600' : 'bg-[#C89758]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8C7B6E] font-mono">
                    <span>{w.committedMinutes} min committed</span>
                    <span>{w.remainingMinutes} min available</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Order Volume by Alteration Type */}
        <div className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-[#2C1810]">
                Alteration Type Distribution
              </h3>
              <p className="text-xs text-[#7B6A5C]">
                Intake volume and skill requirements
              </p>
            </div>
            <Scissors className="w-4 h-4 text-[#C89758]" />
          </div>

          <div className="space-y-4 pt-2">
            {Object.entries(altCounts).map(([type, count]) => {
              const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;

              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#2C1810]">{type}</span>
                    <span className="font-mono font-bold text-[#2C1810]">
                      {count} orders ({pct.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="w-full bg-[#EFEAE1] h-3.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2C1810] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8E2D6] text-xs text-[#5D4E43] mt-2">
            <strong>Key Study Insight: </strong>
            Waist adjustments (25–60 min) and zipper replacements (60 min) require specialized skills, whereas hemming (20–45 min) is delegated to apprentice tailors.
          </div>
        </div>
      </div>

      {/* Order Status Distribution Table */}
      <div className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs">
        <h3 className="font-display text-base font-bold text-[#2C1810] mb-4">
          Shop Order Pipeline Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(statusCounts).map(([st, count]) => {
            const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : '0';

            return (
              <div key={st} className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D6]">
                <div className="text-xs font-semibold text-[#7B6A5C]">{st}</div>
                <div className="font-mono text-2xl font-bold text-[#2C1810] mt-1">{count}</div>
                <div className="text-[11px] text-[#8C7B6E] font-mono mt-0.5">{pct}% of intake</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
