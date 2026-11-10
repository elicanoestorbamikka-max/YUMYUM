/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  X,
} from 'lucide-react';
import { AlterationType, GarmentType, Order, ShopSettings, Worker } from '../types';
import {
  addWorkingDays,
  countWorkingDays,
  evaluateFeasibility,
  formatDate,
  formatFriendlyDate,
  getDayName,
  getRequiredSkill,
} from '../utils/feasibilityEngine';

interface FeasibilityCheckerToolProps {
  workers: Worker[];
  orders: Order[];
  settings: ShopSettings;
  onApplyAsOrder: (initialData: Partial<Order>) => void;
}

export const FeasibilityCheckerTool: React.FC<FeasibilityCheckerToolProps> = ({
  workers,
  orders,
  settings,
  onApplyAsOrder,
}) => {
  const todayStr = useMemo(() => formatDate(new Date()), []);

  // Simulator Inputs
  const [alterationType, setAlterationType] = useState<AlterationType>('Zipper Replacement');
  const [garmentType, setGarmentType] = useState<GarmentType>('Pants');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(60);
  const [dateReceived, setDateReceived] = useState<string>(todayStr);
  const [requestedPickupDate, setRequestedPickupDate] = useState<string>(
    addWorkingDays(todayStr, 3, settings.workingDays)
  );

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status === 'Accepted' || o.status === 'In Progress'),
    [orders]
  );

  const handleAlterationChange = (alt: AlterationType) => {
    setAlterationType(alt);
    const def = settings.alterationDefaults[alt];
    if (def) setEstimatedMinutes(def.defaultMinutes);
  };

  const evaluation = useMemo(() => {
    return evaluateFeasibility(
      alterationType,
      estimatedMinutes,
      dateReceived,
      requestedPickupDate,
      workers,
      activeOrders,
      settings
    );
  }, [alterationType, estimatedMinutes, dateReceived, requestedPickupDate, workers, activeOrders, settings]);

  const requiredSkill = getRequiredSkill(alterationType, settings);
  const workingDays = Math.max(1, countWorkingDays(dateReceived, requestedPickupDate, settings.workingDays));

  return (
    <div className="space-y-8">
      {/* Overview header */}
      <div className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C89758] uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Interactive Feasibility Simulation Sandbox</span>
          </div>
          <h2 className="font-display text-xl font-bold text-[#2C1810]">
            Automatic Pickup Date Feasibility Engine
          </h2>
          <p className="text-xs text-[#7B6A5C] mt-1.5 leading-relaxed">
            Test any customer request against real shop capacity in real time. The engine verifies worker skills, counts working days (skipping non-working days), computes available versus committed minutes, and guarantees achievable quoted pickup dates.
          </p>
        </div>
      </div>

      {/* Simulator Inputs & Dynamic Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Cols: Simulation Controls */}
        <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs space-y-5">
          <h3 className="font-display text-base font-bold text-[#2C1810] border-b border-[#E8E2D6] pb-3">
            Simulation Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold text-[#2C1810] mb-1.5">
              Alteration Type:
            </label>
            <select
              value={alterationType}
              onChange={(e) => handleAlterationChange(e.target.value as AlterationType)}
              className="w-full px-3 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/60 text-xs font-medium text-[#2C1810]"
            >
              <option value="Waist Adjustment">Waist Adjustment (25–60m)</option>
              <option value="Zipper Replacement">Zipper Replacement (~60m)</option>
              <option value="Hemming">Hemming (20–45m)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2C1810] mb-1.5">
              Garment Category:
            </label>
            <select
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value as GarmentType)}
              className="w-full px-3 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/60 text-xs text-[#2C1810]"
            >
              <option value="Pants">Pants</option>
              <option value="Blouse">Blouse</option>
              <option value="Skirt">Skirt</option>
              <option value="Uniform">Uniform</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D6] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#2C1810]">Estimated Working Minutes:</span>
              <span className="font-mono text-[#C89758] font-bold text-sm">
                {estimatedMinutes} min
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={90}
              step={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full accent-[#C89758] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8C7B6E]">
              <span>15 min</span>
              <span>Required Skill: <strong>{requiredSkill}</strong></span>
              <span>90 min</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2C1810] mb-1">
                Date Received:
              </label>
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/60 text-xs font-mono"
              />
              <span className="text-[10px] text-[#8C7B6E] mt-0.5 block">
                {getDayName(dateReceived)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2C1810] mb-1">
                Target Pickup Date:
              </label>
              <input
                type="date"
                value={requestedPickupDate}
                onChange={(e) => setRequestedPickupDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/60 text-xs font-mono"
              />
              <span className="text-[10px] text-[#8C7B6E] mt-0.5 block">
                {getDayName(requestedPickupDate)}
              </span>
            </div>
          </div>

          {/* Quick Lead Time Presets */}
          <div className="pt-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-[#7B6A5C] text-[11px]">Quick Dates:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRequestedPickupDate(addWorkingDays(dateReceived, 1, settings.workingDays))}
                className="px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#E0D7C9] text-[11px] font-medium hover:bg-[#EFEAE1]"
              >
                Rush (1d)
              </button>
              <button
                type="button"
                onClick={() => setRequestedPickupDate(addWorkingDays(dateReceived, 2, settings.workingDays))}
                className="px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#E0D7C9] text-[11px] font-medium hover:bg-[#EFEAE1]"
              >
                2 Days
              </button>
              <button
                type="button"
                onClick={() => setRequestedPickupDate(addWorkingDays(dateReceived, 3, settings.workingDays))}
                className="px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#E0D7C9] text-[11px] font-medium hover:bg-[#EFEAE1]"
              >
                Standard (3d)
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Algorithmic Proof & Worker Capacity Matrix */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Decision Banner */}
          <div
            className={`p-6 rounded-xl border shadow-xs transition-all ${
              evaluation.decision === 'ACCEPT'
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-amber-50/70 border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {evaluation.decision === 'ACCEPT' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                )}
                <div>
                  <div className="text-xs uppercase font-semibold text-[#7B6A5C] tracking-wider">
                    Simulation Result
                  </div>
                  <div className="font-display text-xl font-bold text-[#2C1810]">
                    {evaluation.decision === 'ACCEPT' ? 'DATE FEASIBLE (ACCEPT)' : 'INSUFFICIENT TIME (RENEGOTIATE)'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#7B6A5C] block">Working Window</span>
                <span className="font-mono font-bold text-xs text-[#2C1810]">
                  {workingDays} Day(s) ({workingDays * 480}m)
                </span>
              </div>
            </div>

            <p className="text-xs text-[#4A3B30] leading-relaxed">
              {evaluation.explanation}
            </p>

            {evaluation.decision === 'RENEGOTIATE' && evaluation.suggestedEarliestPickupDate && (
              <div className="mt-4 p-3.5 rounded-lg bg-white/80 border border-amber-300/60 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#8C7B6E] uppercase font-bold tracking-wider">
                      Earliest Feasible Promise Date
                    </span>
                    <div className="font-mono text-base font-bold text-[#2C1810] mt-0.5">
                      {formatFriendlyDate(evaluation.suggestedEarliestPickupDate)} ({getDayName(evaluation.suggestedEarliestPickupDate)})
                    </div>
                  </div>
                  <button
                    onClick={() => setRequestedPickupDate(evaluation.suggestedEarliestPickupDate!)}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold transition-colors"
                  >
                    Adopt This Date
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step-by-Step Mathematical Evaluation Table */}
          <div className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="font-display text-base font-bold text-[#2C1810]">
                Worker Skill & Time Calculation Matrix
              </h3>
              <span className="text-[11px] text-[#7B6A5C] font-mono">
                Formula: Remaining = (Days × 480m) - Committed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D6] text-[#7B6A5C]">
                    <th className="pb-2 font-semibold">Worker</th>
                    <th className="pb-2 font-semibold">Skill Match</th>
                    <th className="pb-2 font-semibold">Total Available</th>
                    <th className="pb-2 font-semibold">Committed</th>
                    <th className="pb-2 font-semibold">Remaining</th>
                    <th className="pb-2 font-semibold">Workload %</th>
                    <th className="pb-2 font-semibold text-right">Feasible?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE1]">
                  {evaluation.workerDetails.map((w) => {
                    const isBest = w.workerId === evaluation.recommendedWorkerId;

                    return (
                      <tr
                        key={w.workerId}
                        className={`transition-colors ${
                          isBest ? 'bg-emerald-50/40 font-medium' : 'hover:bg-[#FAF7F2]/50'
                        }`}
                      >
                        <td className="py-3">
                          <div className="font-bold text-[#2C1810]">{w.workerName}</div>
                          <div className="text-[10px] text-[#7B6A5C]">{w.role}</div>
                        </td>
                        <td className="py-3">
                          {w.isQualified ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Qualified
                            </span>
                          ) : (
                            <span className="text-slate-400 italic flex items-center gap-1">
                              <X className="w-3.5 h-3.5" /> Unqualified
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-mono text-[#5D4E43]">
                          {w.totalAvailableMinutes} min
                        </td>
                        <td className="py-3 font-mono text-[#5D4E43]">
                          {w.committedMinutes} min
                        </td>
                        <td className="py-3 font-mono font-bold text-[#2C1810]">
                          {w.remainingMinutes} min
                        </td>
                        <td className="py-3 font-mono text-[#2C1810]">
                          {w.workloadPercentage}%
                        </td>
                        <td className="py-3 text-right">
                          {w.canAccommodate ? (
                            <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded text-[10px]">
                              {isBest ? 'Best Choice' : 'Feasible'}
                            </span>
                          ) : (
                            <span className="text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                              {!w.isQualified ? 'No Skill' : 'No Time'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Launch Intake using this configuration */}
            <div className="pt-3 border-t border-[#E8E2D6] flex justify-end">
              <button
                onClick={() =>
                  onApplyAsOrder({
                    alterationType,
                    garmentType,
                    estimatedMinutes,
                    dateReceived,
                    requestedPickupDate,
                    quotedPickupDate: evaluation.decision === 'ACCEPT' ? requestedPickupDate : evaluation.suggestedEarliestPickupDate || requestedPickupDate,
                    feasibilityResult: evaluation.decision,
                    assignedWorkerId: evaluation.recommendedWorkerId,
                    suggestedWorkerId: evaluation.recommendedWorkerId,
                  })
                }
                className="px-4 py-2 bg-[#2C1810] hover:bg-[#3D2317] text-[#FAF7F2] font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>Transfer Parameters to Order Intake</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
