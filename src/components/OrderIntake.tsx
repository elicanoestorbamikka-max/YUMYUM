/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scissors,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  AlterationType,
  GarmentType,
  Order,
  ShopSettings,
  Worker,
} from '../types';
import {
  addWorkingDays,
  evaluateFeasibility,
  formatDate,
  formatFriendlyDate,
  getDayName,
} from '../utils/feasibilityEngine';
import { generateNextOrderId } from '../utils/storage';

interface OrderIntakeProps {
  orders: Order[];
  workers: Worker[];
  settings: ShopSettings;
  onSaveOrder: (newOrder: Order) => void;
  onCancel: () => void;
}

export const OrderIntake: React.FC<OrderIntakeProps> = ({
  orders,
  workers,
  settings,
  onSaveOrder,
  onCancel,
}) => {
  // Today's date in local YYYY-MM-DD
  const todayStr = useMemo(() => formatDate(new Date()), []);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [garmentType, setGarmentType] = useState<GarmentType>('Pants');
  const [alterationType, setAlterationType] = useState<AlterationType>('Waist Adjustment');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(40);
  const [dateReceived, setDateReceived] = useState<string>(todayStr);
  const [isRush, setIsRush] = useState<boolean>(false);

  // Default requested pickup date: standard 3 working days, or 1 working day if rush
  const defaultPickupDate = useMemo(() => {
    const days = isRush ? settings.rushLeadTimeDays : settings.standardLeadTimeDays;
    return addWorkingDays(dateReceived, days, settings.workingDays);
  }, [dateReceived, isRush, settings.rushLeadTimeDays, settings.standardLeadTimeDays, settings.workingDays]);

  const [requestedPickupDate, setRequestedPickupDate] = useState<string>(defaultPickupDate);
  const [notes, setNotes] = useState('');

  // Owner Assignment Override State
  const [manualWorkerId, setManualWorkerId] = useState<string>('');
  const [isOverrideMode, setIsOverrideMode] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Form Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // When alteration type changes, update estimated minutes to default for that type
  const handleAlterationChange = (alt: AlterationType) => {
    setAlterationType(alt);
    const config = settings.alterationDefaults[alt];
    if (config) {
      setEstimatedMinutes(config.defaultMinutes);
    }
  };

  // When rush toggle changes, update requested date if matching default
  const handleRushToggle = (rush: boolean) => {
    setIsRush(rush);
    const days = rush ? settings.rushLeadTimeDays : settings.standardLeadTimeDays;
    setRequestedPickupDate(addWorkingDays(dateReceived, days, settings.workingDays));
  };

  // Run Real-time Automatic Feasibility Check
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status === 'Accepted' || o.status === 'In Progress'),
    [orders]
  );

  const feasibility = useMemo(() => {
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

  // Selected Worker: Either manual override or automatic recommended worker
  const activeWorkerId = isOverrideMode && manualWorkerId
    ? manualWorkerId
    : feasibility.recommendedWorkerId;

  // Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) {
      errs.customerName = 'Customer name is required.';
    }
    if (!contactNumber.trim()) {
      errs.contactNumber = 'Contact number is required.';
    }
    if (!requestedPickupDate) {
      errs.requestedPickupDate = 'Requested pickup date is required.';
    } else if (requestedPickupDate < dateReceived) {
      errs.requestedPickupDate = 'Pickup date cannot be earlier than received date.';
    }
    if (isOverrideMode && !overrideReason.trim()) {
      errs.overrideReason = 'Please provide a justification for overriding the system recommendation.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submission handler for ACCEPT
  const handleAcceptOrder = () => {
    if (!validateForm()) return;

    const orderId = generateNextOrderId(orders);
    const newOrder: Order = {
      id: orderId,
      customerName: customerName.trim(),
      contactNumber: contactNumber.trim(),
      garmentType,
      alterationType,
      estimatedMinutes,
      dateReceived,
      requestedPickupDate,
      quotedPickupDate: requestedPickupDate,
      isRush,
      status: 'Accepted',
      assignedWorkerId: activeWorkerId,
      suggestedWorkerId: feasibility.recommendedWorkerId,
      isOverride: isOverrideMode && activeWorkerId !== feasibility.recommendedWorkerId,
      overrideReason: isOverrideMode ? overrideReason.trim() : undefined,
      feasibilityResult: 'ACCEPT',
      feasibilityNotes: feasibility.explanation,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveOrder(newOrder);
    setSuccessToast(`Order ${orderId} successfully accepted and assigned!`);
  };

  // Submission handler for RENEGOTIATE (Customer accepts suggested earliest date)
  const handleAcceptSuggestedDate = () => {
    if (!validateForm()) return;
    if (!feasibility.suggestedEarliestPickupDate) return;

    const orderId = generateNextOrderId(orders);
    const newOrder: Order = {
      id: orderId,
      customerName: customerName.trim(),
      contactNumber: contactNumber.trim(),
      garmentType,
      alterationType,
      estimatedMinutes,
      dateReceived,
      requestedPickupDate, // original requested
      quotedPickupDate: feasibility.suggestedEarliestPickupDate, // renegotiated promised date
      isRush,
      status: 'Accepted',
      assignedWorkerId: feasibility.suggestedWorkerIdOnEarliestDate || activeWorkerId,
      suggestedWorkerId: feasibility.suggestedWorkerIdOnEarliestDate,
      isOverride: false,
      feasibilityResult: 'RENEGOTIATE',
      feasibilityNotes: `Renegotiated from ${requestedPickupDate} to ${feasibility.suggestedEarliestPickupDate}. ${feasibility.explanation}`,
      notes: notes.trim(),
      renegotiatedNewDate: feasibility.suggestedEarliestPickupDate,
      createdAt: new Date().toISOString(),
    };

    onSaveOrder(newOrder);
    setSuccessToast(`Order ${orderId} accepted on renegotiated date (${formatFriendlyDate(feasibility.suggestedEarliestPickupDate)})!`);
  };

  // Submission handler for DECLINE
  const handleDeclineOrder = () => {
    if (!validateForm()) return;

    const orderId = generateNextOrderId(orders);
    const newOrder: Order = {
      id: orderId,
      customerName: customerName.trim(),
      contactNumber: contactNumber.trim(),
      garmentType,
      alterationType,
      estimatedMinutes,
      dateReceived,
      requestedPickupDate,
      quotedPickupDate: requestedPickupDate,
      isRush,
      status: 'Declined',
      assignedWorkerId: null,
      suggestedWorkerId: feasibility.recommendedWorkerId,
      isOverride: false,
      feasibilityResult: 'DECLINE',
      feasibilityNotes: `Order declined at intake. ${feasibility.explanation}`,
      notes: notes.trim() ? `${notes.trim()} (Declined due to schedule)` : 'Customer declined alternative date',
      createdAt: new Date().toISOString(),
    };

    onSaveOrder(newOrder);
    setSuccessToast(`Order ${orderId} recorded as Declined.`);
  };

  const altConfig = settings.alterationDefaults[alterationType];

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Intake Form on Left, Feasibility Decision Engine on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Intake Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 sm:p-8 border border-[#E8E2D6] shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D6] pb-4">
            <h2 className="font-display text-xl font-bold text-[#2C1810]">
              Customer Intake Details
            </h2>
            <p className="text-xs text-[#7B6A5C] mt-1">
              Capture garment specifics and customer target deadlines
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-[#2C1810] mb-1.5">
                Customer Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Victoria Price"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-[#FAF7F2]/50 text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#C89758]/50 ${
                  errors.customerName ? 'border-rose-400 bg-rose-50/30' : 'border-[#E0D7C9]'
                }`}
              />
              {errors.customerName && (
                <p className="text-rose-600 text-[11px] mt-1">{errors.customerName}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-semibold text-[#2C1810] mb-1.5">
                Contact Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g., +1 (555) 789-0123"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-[#FAF7F2]/50 text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#C89758]/50 ${
                  errors.contactNumber ? 'border-rose-400 bg-rose-50/30' : 'border-[#E0D7C9]'
                }`}
              />
              {errors.contactNumber && (
                <p className="text-rose-600 text-[11px] mt-1">{errors.contactNumber}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Garment Type */}
            <div>
              <label className="block text-xs font-semibold text-[#2C1810] mb-1.5">
                Garment Type
              </label>
              <select
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value as GarmentType)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E0D7C9] text-sm bg-[#FAF7F2]/50 text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#C89758]/50"
              >
                <option value="Pants">Pants</option>
                <option value="Blouse">Blouse</option>
                <option value="Skirt">Skirt</option>
                <option value="Uniform">Uniform</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Alteration Type */}
            <div>
              <label className="block text-xs font-semibold text-[#2C1810] mb-1.5">
                Alteration Type
              </label>
              <select
                value={alterationType}
                onChange={(e) => handleAlterationChange(e.target.value as AlterationType)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E0D7C9] text-sm bg-[#FAF7F2]/50 text-[#2C1810] font-medium focus:outline-none focus:ring-2 focus:ring-[#C89758]/50"
              >
                <option value="Waist Adjustment">Waist Adjustment (25–60 min)</option>
                <option value="Zipper Replacement">Zipper Replacement (~60 min)</option>
                <option value="Hemming">Hemming (20–45 min)</option>
              </select>
            </div>
          </div>

          {/* Estimated Working Time adjustment */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D6] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2C1810]">
                Estimated Working Time
              </span>
              <span className="font-mono font-bold text-sm text-[#C89758]">
                {estimatedMinutes} minutes
              </span>
            </div>
            <input
              type="range"
              min={altConfig.minMinutes}
              max={altConfig.maxMinutes}
              step={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full accent-[#C89758] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#8C7B6E]">
              <span>Min: {altConfig.minMinutes} min</span>
              <span className="italic">Benchmark: {altConfig.defaultMinutes} min</span>
              <span>Max: {altConfig.maxMinutes} min</span>
            </div>
          </div>

          {/* Dates & Rush Order Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Received */}
            <div>
              <label className="block text-xs font-semibold text-[#2C1810] mb-1.5">
                Date Received
              </label>
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E0D7C9] text-sm bg-[#FAF7F2]/50 text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#C89758]/50 font-mono"
              />
              <span className="text-[11px] text-[#8C7B6E] mt-1 block">
                {getDayName(dateReceived)}
              </span>
            </div>

            {/* Requested Pickup Date */}
            <div>
              <label className="block text-xs font-semibold text-[#2C1810] mb-1.5">
                Requested Pickup Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={requestedPickupDate}
                onChange={(e) => setRequestedPickupDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-[#FAF7F2]/50 text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#C89758]/50 font-mono ${
                  errors.requestedPickupDate ? 'border-rose-400' : 'border-[#E0D7C9]'
                }`}
              />
              <span className="text-[11px] text-[#C89758] font-medium mt-1 block">
                {getDayName(requestedPickupDate)} · {formatFriendlyDate(requestedPickupDate)}
              </span>
              {errors.requestedPickupDate && (
                <p className="text-rose-600 text-[11px] mt-1">{errors.requestedPickupDate}</p>
              )}
            </div>
          </div>

          {/* Rush Order Toggle & Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D6]">
            <div>
              <div className="text-xs font-semibold text-[#2C1810]">Rush Order Handling</div>
              <div className="text-[11px] text-[#7B6A5C]">
                Standard turnaround is {settings.standardLeadTimeDays} working days. Rush requests next-day ({settings.rushLeadTimeDays} day).
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRushToggle(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  !isRush
                    ? 'bg-[#2C1810] text-[#FAF7F2] shadow-xs'
                    : 'text-[#5D4E43] hover:text-[#2C1810] bg-white border border-[#E0D7C9]'
                }`}
              >
                Standard (3d)
              </button>
              <button
                type="button"
                onClick={() => handleRushToggle(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isRush
                    ? 'bg-rose-700 text-[#FAF7F2] shadow-xs'
                    : 'text-[#5D4E43] hover:text-rose-700 bg-white border border-[#E0D7C9]'
                }`}
              >
                Rush (1d)
              </button>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#2C1810] mb-1.5">
              Additional Notes / Garment Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Preserving original contrast stitching, customer traveling on Friday..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E0D7C9] text-sm bg-[#FAF7F2]/50 text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#C89758]/50"
            />
          </div>

          {/* Owner Override Section */}
          <div className="border-t border-[#E8E2D6] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#2C1810]">
                  Owner Assignment Override
                </span>
                <p className="text-[11px] text-[#7B6A5C]">
                  Optionally redirect order to a specific worker regardless of automated workload balancing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOverrideMode(!isOverrideMode)}
                className={`text-xs font-semibold px-3 py-1 rounded border transition-colors ${
                  isOverrideMode
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'text-[#7B6A5C] bg-[#FAF7F2] border-[#E0D7C9] hover:bg-[#EFEAE1]'
                }`}
              >
                {isOverrideMode ? 'Override Enabled' : 'Enable Override'}
              </button>
            </div>

            {isOverrideMode && (
              <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3">
                <div>
                  <label className="block text-xs font-medium text-amber-900 mb-1">
                    Select Worker to Force Assign:
                  </label>
                  <select
                    value={manualWorkerId}
                    onChange={(e) => setManualWorkerId(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-amber-300 bg-white text-xs text-[#2C1810]"
                  >
                    <option value="">-- Choose Worker Override --</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role}) · Skills: {w.skills.join(', ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-900 mb-1">
                    Reason for Override <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g., Customer requested senior tailor; delicate silk garment"
                    className="w-full px-3 py-2 rounded border border-amber-300 bg-white text-xs text-[#2C1810]"
                  />
                  {errors.overrideReason && (
                    <p className="text-rose-600 text-[11px] mt-1">{errors.overrideReason}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AUTOMATIC PROMISE-DATE FEASIBILITY CHECK (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#E8E2D6] shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#2C1810]">
                  Date Feasibility & Assignment
                </h3>
                <p className="text-xs text-[#7B6A5C]">
                  Simulation engine evaluation
                </p>
              </div>
              <span className="font-mono text-[11px] text-[#C89758] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8E2D6]">
                480 min/day
              </span>
            </div>

            {/* Feasibility Result Card */}
            <div
              className={`p-5 rounded-xl border transition-all ${
                feasibility.decision === 'ACCEPT'
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {feasibility.decision === 'ACCEPT' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#7B6A5C]">
                    Feasibility Decision
                  </div>
                  <div className="text-xl font-bold tracking-tight">
                    {feasibility.decision === 'ACCEPT' ? 'DATE FEASIBLE (ACCEPT)' : 'DATE NOT FEASIBLE (RENEGOTIATE)'}
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#4A3B30] mt-2">
                {feasibility.explanation}
              </p>

              {feasibility.decision === 'RENEGOTIATE' && feasibility.suggestedEarliestPickupDate && (
                <div className="mt-4 pt-3 border-t border-amber-200/80 bg-white/70 p-3 rounded-lg text-xs">
                  <span className="text-[#8C7B6E] block font-medium">
                    Earliest Feasible Quoted Date:
                  </span>
                  <div className="text-base font-bold font-mono text-[#2C1810] mt-0.5">
                    {formatFriendlyDate(feasibility.suggestedEarliestPickupDate)}
                  </div>
                  <div className="text-[11px] text-amber-800 mt-1">
                    Customer can accept this earliest feasible date, or order can be declined.
                  </div>
                </div>
              )}
            </div>

            {/* Qualified Workers Evaluation Breakdown Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2C1810]">
                  Worker Capacity in Requested Horizon:
                </span>
                <span className="text-[11px] text-[#7B6A5C]">
                  {feasibility.workerDetails[0]?.workingDaysCount || 1} working day(s)
                </span>
              </div>

              <div className="space-y-2">
                {feasibility.workerDetails.map((worker) => {
                  const isRecommended = worker.workerId === feasibility.recommendedWorkerId;
                  const isSelected = worker.workerId === activeWorkerId;

                  return (
                    <div
                      key={worker.workerId}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-[#FAF7F2] border-[#C89758] ring-1 ring-[#C89758]/50'
                          : 'bg-white border-[#E8E2D6]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2C1810]">{worker.workerName}</span>
                          {isRecommended && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              Best Match
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#7B6A5C]">{worker.role}</span>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-[#5D4E43] pt-2 border-t border-[#EFEAE1]">
                        <div>
                          <span className="text-[#9E8E80] block text-[10px]">Skill Status</span>
                          <span
                            className={`font-semibold ${
                              worker.isQualified ? 'text-emerald-700' : 'text-slate-400 italic'
                            }`}
                          >
                            {worker.isQualified ? 'Qualified' : 'Not Qualified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9E8E80] block text-[10px]">Remaining Time</span>
                          <span className="font-mono font-semibold text-[#2C1810]">
                            {worker.remainingMinutes} min
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9E8E80] block text-[10px]">Committed Load</span>
                          <span className="font-mono font-semibold text-[#2C1810]">
                            {worker.workloadPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decision Actions Bar */}
            <div className="pt-2 border-t border-[#E8E2D6] space-y-2">
              {feasibility.decision === 'ACCEPT' ? (
                <button
                  type="button"
                  onClick={handleAcceptOrder}
                  className="w-full py-3 bg-[#2C1810] hover:bg-[#3D2317] text-[#FAF7F2] rounded-lg font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#C89758]" />
                  <span>Accept Order & Assign Tailor</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleAcceptSuggestedDate}
                    className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-[#FAF7F2] rounded-lg font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Renegotiate & Quote Earliest Date</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeclineOrder}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Decline Order (Record Disposition)</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 text-xs text-[#7B6A5C] hover:text-[#2C1810] transition-colors"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
