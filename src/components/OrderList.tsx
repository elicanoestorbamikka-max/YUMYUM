/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  CheckCircle,
  Hammer,
  ShoppingBag,
  CheckCheck,
  XCircle,
  AlertTriangle,
  UserCheck,
  Trash2,
  Edit2,
  MoreVertical,
  X,
} from 'lucide-react';
import {
  AlterationType,
  Order,
  OrderStatus,
  ShopSettings,
  Worker,
} from '../types';
import {
  formatDate,
  formatFriendlyDate,
  getDayName,
  parseDate,
} from '../utils/feasibilityEngine';

interface OrderListProps {
  orders: Order[];
  workers: Worker[];
  settings: ShopSettings;
  initialFilterStatus?: string;
  onUpdateOrder: (updated: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onNewOrderClick: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  workers,
  settings,
  initialFilterStatus = 'All',
  onUpdateOrder,
  onDeleteOrder,
  onNewOrderClick,
}) => {
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterStatus);
  const [alterationFilter, setAlterationFilter] = useState<string>('All');
  const [workerFilter, setWorkerFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'quotedPickupDate' | 'dateReceived' | 'estimatedMinutes'>('quotedPickupDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal state for Late Order Renegotiation
  const [renegotiatingOrder, setRenegotiatingOrder] = useState<Order | null>(null);
  const [newPromisedDate, setNewPromisedDate] = useState<string>('');
  const [renegotiateReason, setRenegotiateReason] = useState<string>('');

  // Modal state for Worker Reassignment
  const [reassigningOrder, setReassigningOrder] = useState<Order | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('');

  // Delete confirmation modal state
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Status filter
        if (statusFilter !== 'All' && o.status !== statusFilter) return false;
        // Alteration filter
        if (alterationFilter !== 'All' && o.alterationType !== alterationFilter) return false;
        // Worker filter
        if (workerFilter !== 'All') {
          if (workerFilter === 'unassigned') {
            if (o.assignedWorkerId) return false;
          } else if (o.assignedWorkerId !== workerFilter) {
            return false;
          }
        }
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchId = o.id.toLowerCase().includes(q);
          const matchName = o.customerName.toLowerCase().includes(q);
          const matchPhone = o.contactNumber.toLowerCase().includes(q);
          const matchNotes = (o.notes || '').toLowerCase().includes(q);
          if (!matchId && !matchName && !matchPhone && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [orders, statusFilter, alterationFilter, workerFilter, searchTerm, sortBy, sortOrder]);

  // Helper for status badge
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Accepted':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Accepted
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            In Progress
          </span>
        );
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Ready for Pickup
          </span>
        );
      case 'Picked Up':
        return (
          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Picked Up
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Declined
          </span>
        );
      default:
        return null;
    }
  };

  // Status transition handler
  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    const today = formatDate(new Date());
    let readyDate = order.readyDate;
    let pickedUpDate = order.pickedUpDate;
    let isLate = order.isLate;
    let tardinessDays = order.tardinessDays;

    if (newStatus === 'Ready') {
      readyDate = today;
      // Compare ready date with quoted pickup date
      const quoted = parseDate(order.quotedPickupDate);
      const ready = parseDate(today);
      if (ready > quoted) {
        isLate = true;
        const diffTime = ready.getTime() - quoted.getTime();
        tardinessDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      } else {
        isLate = false;
        tardinessDays = 0;
      }
    } else if (newStatus === 'Picked Up') {
      pickedUpDate = today;
      if (!readyDate) readyDate = today;
    }

    onUpdateOrder({
      ...order,
      status: newStatus,
      readyDate,
      pickedUpDate,
      isLate,
      tardinessDays,
    });
  };

  // Submit Late Order Renegotiation
  const handleSaveRenegotiation = () => {
    if (!renegotiatingOrder || !newPromisedDate) return;

    onUpdateOrder({
      ...renegotiatingOrder,
      quotedPickupDate: newPromisedDate,
      renegotiatedNewDate: newPromisedDate,
      feasibilityNotes: `${renegotiatingOrder.feasibilityNotes || ''} | Rescheduled: ${renegotiateReason || 'Extended promise date'}`.trim(),
    });

    setRenegotiatingOrder(null);
    setNewPromisedDate('');
    setRenegotiateReason('');
  };

  // Submit Worker Reassignment
  const handleSaveReassignment = () => {
    if (!reassigningOrder) return;

    const worker = workers.find((w) => w.id === selectedWorkerId);
    onUpdateOrder({
      ...reassigningOrder,
      assignedWorkerId: selectedWorkerId || null,
      isOverride: selectedWorkerId !== reassigningOrder.suggestedWorkerId,
      overrideReason: reassignReason.trim() || 'Manual owner reassignment',
    });

    setReassigningOrder(null);
    setSelectedWorkerId('');
    setReassignReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters, Stats Summary */}
      <div className="bg-white rounded-xl p-5 border border-[#E8E2D6] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C7B6E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, customer, phone, or notes..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#C89758]/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7B6E] hover:text-[#2C1810]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onNewOrderClick}
            className="px-4 py-2 bg-[#2C1810] hover:bg-[#3D2317] text-[#FAF7F2] text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            + New Order Intake
          </button>
        </div>

        {/* Filter Pills / Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#EFEAE1] text-xs">
          <div className="flex items-center gap-1.5 text-[#7B6A5C]">
            <Filter className="w-3.5 h-3.5 text-[#C89758]" />
            <span className="font-semibold">Filter:</span>
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#E0D7C9] bg-white text-[#2C1810] text-xs"
          >
            <option value="All">All Statuses ({orders.length})</option>
            <option value="Accepted">Accepted ({orders.filter((o) => o.status === 'Accepted').length})</option>
            <option value="In Progress">In Progress ({orders.filter((o) => o.status === 'In Progress').length})</option>
            <option value="Ready">Ready for Pickup ({orders.filter((o) => o.status === 'Ready').length})</option>
            <option value="Picked Up">Picked Up ({orders.filter((o) => o.status === 'Picked Up').length})</option>
            <option value="Declined">Declined ({orders.filter((o) => o.status === 'Declined').length})</option>
          </select>

          {/* Alteration Type Select */}
          <select
            value={alterationFilter}
            onChange={(e) => setAlterationFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#E0D7C9] bg-white text-[#2C1810] text-xs"
          >
            <option value="All">All Alterations</option>
            <option value="Waist Adjustment">Waist Adjustment</option>
            <option value="Zipper Replacement">Zipper Replacement</option>
            <option value="Hemming">Hemming</option>
          </select>

          {/* Worker Select */}
          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#E0D7C9] bg-white text-[#2C1810] text-xs"
          >
            <option value="All">All Tailors</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.role})
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8C7B6E]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-md border border-[#E0D7C9] bg-white text-[#2C1810] text-xs"
            >
              <option value="quotedPickupDate">Quoted Pickup (EDD)</option>
              <option value="dateReceived">Date Received</option>
              <option value="estimatedMinutes">Est. Working Time</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1.5 rounded-md border border-[#E0D7C9] bg-white text-xs text-[#5D4E43] hover:text-[#2C1810]"
              title="Toggle sort direction"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E8E2D6] shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#8C7B6E] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="font-display text-base font-bold text-[#2C1810]">No orders match filters</h4>
            <p className="text-xs text-[#7B6A5C] mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria, clearing status filters, or entering a new customer order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8E2D6] text-[#7B6A5C]">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Alteration</th>
                  <th className="py-3 px-4 font-semibold">Est. Time</th>
                  <th className="py-3 px-4 font-semibold">Assigned Tailor</th>
                  <th className="py-3 px-4 font-semibold">Received</th>
                  <th className="py-3 px-4 font-semibold">Quoted Pickup</th>
                  <th className="py-3 px-4 font-semibold">Status & Delivery</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE1]">
                {filteredOrders.map((order) => {
                  const assigned = workers.find((w) => w.id === order.assignedWorkerId);

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      {/* Order ID & Rush flag */}
                      <td className="py-3 px-4 font-mono font-bold text-[#2C1810]">
                        <div>{order.id}</div>
                        {order.isRush && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 rounded inline-block mt-0.5">
                            RUSH
                          </span>
                        )}
                      </td>

                      {/* Customer details */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2C1810]">{order.customerName}</div>
                        <div className="text-[11px] text-[#8C7B6E]">{order.contactNumber}</div>
                        {order.notes && (
                          <div className="text-[10px] text-[#A8988B] truncate max-w-xs mt-0.5">
                            "{order.notes}"
                          </div>
                        )}
                      </td>

                      {/* Alteration & Garment */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#2C1810]">{order.alterationType}</div>
                        <div className="text-[11px] text-[#8C7B6E]">{order.garmentType}</div>
                      </td>

                      {/* Est Time */}
                      <td className="py-3 px-4 font-mono text-[#5D4E43]">
                        {order.estimatedMinutes} min
                      </td>

                      {/* Tailor with Reassign Action */}
                      <td className="py-3 px-4">
                        {assigned ? (
                          <div>
                            <div className="font-medium text-[#2C1810]">{assigned.name}</div>
                            <div className="text-[10px] text-[#8C7B6E]">{assigned.role}</div>
                            {order.isOverride && (
                              <span className="text-[9px] text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded block w-fit mt-0.5" title={order.overrideReason}>
                                Override
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-rose-700 italic font-medium">Unassigned</span>
                        )}
                        <button
                          onClick={() => {
                            setReassigningOrder(order);
                            setSelectedWorkerId(order.assignedWorkerId || '');
                            setReassignReason(order.overrideReason || '');
                          }}
                          className="text-[10px] text-[#C89758] hover:underline block mt-1"
                        >
                          Change Tailor
                        </button>
                      </td>

                      {/* Date Received */}
                      <td className="py-3 px-4 font-mono text-[#7B6A5C]">
                        {order.dateReceived}
                      </td>

                      {/* Quoted Pickup Date */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-[#2C1810]">
                          {order.quotedPickupDate}
                        </div>
                        <div className="text-[10px] text-[#C89758]">
                          {getDayName(order.quotedPickupDate)}
                        </div>
                        {order.renegotiatedNewDate && (
                          <span className="text-[9px] text-amber-800 block">Renegotiated</span>
                        )}
                      </td>

                      {/* Status & On-Time indicator */}
                      <td className="py-3 px-4">
                        {getStatusBadge(order.status)}

                        {order.readyDate && (
                          <div className="mt-1 text-[10px]">
                            {order.isLate ? (
                              <div className="flex items-center gap-1 text-rose-700 font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Late by {order.tardinessDays || 1}d</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-700 font-medium">
                                <CheckCircle className="w-3 h-3" />
                                <span>On Time</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Lifecycle Progress Button */}
                          {order.status === 'Accepted' && (
                            <button
                              onClick={() => handleStatusChange(order, 'In Progress')}
                              className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
                              title="Start alteration"
                            >
                              Start
                            </button>
                          )}
                          {order.status === 'In Progress' && (
                            <button
                              onClick={() => handleStatusChange(order, 'Ready')}
                              className="px-2 py-1 text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                              title="Complete alteration and mark Ready"
                            >
                              Ready
                            </button>
                          )}
                          {order.status === 'Ready' && (
                            <button
                              onClick={() => handleStatusChange(order, 'Picked Up')}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                              title="Customer collected garment"
                            >
                              Pick Up
                            </button>
                          )}

                          {/* Renegotiate deadline button for late or delayed orders */}
                          {order.status !== 'Picked Up' && order.status !== 'Declined' && (
                            <button
                              onClick={() => {
                                setRenegotiatingOrder(order);
                                setNewPromisedDate(order.quotedPickupDate);
                                setRenegotiateReason('');
                              }}
                              className="p-1 text-[#8C7B6E] hover:text-[#2C1810] hover:bg-[#FAF7F2] rounded transition-colors"
                              title="Reschedule / Promise New Date"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete order */}
                          <button
                            onClick={() => setDeletingOrderId(order.id)}
                            className="p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Delete order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Reschedule / Renegotiate Promised Date */}
      {renegotiatingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E8E2D6] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#2C1810]">
                  Reschedule Promised Pickup Date
                </h3>
                <span className="text-xs text-[#7B6A5C]">
                  Order {renegotiatingOrder.id} · {renegotiatingOrder.customerName}
                </span>
              </div>
              <button
                onClick={() => setRenegotiatingOrder(null)}
                className="text-[#8C7B6E] hover:text-[#2C1810]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  Current Quoted Date:
                </label>
                <div className="font-mono text-sm text-[#7B6A5C]">
                  {formatFriendlyDate(renegotiatingOrder.quotedPickupDate)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  New Promised Pickup Date:
                </label>
                <input
                  type="date"
                  value={newPromisedDate}
                  onChange={(e) => setNewPromisedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  Reason for Renegotiation / Rescheduling:
                </label>
                <textarea
                  rows={2}
                  value={renegotiateReason}
                  onChange={(e) => setRenegotiateReason(e.target.value)}
                  placeholder="e.g., Fabric delivery delay, customer requested extension..."
                  className="w-full px-3 py-2 rounded border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D6]">
              <button
                type="button"
                onClick={() => setRenegotiatingOrder(null)}
                className="px-3 py-1.5 text-xs text-[#7B6A5C] hover:text-[#2C1810]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRenegotiation}
                className="px-4 py-2 bg-[#2C1810] hover:bg-[#3D2317] text-[#FAF7F2] font-semibold text-xs rounded-lg transition-colors"
              >
                Save New Promise Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Assigned Worker */}
      {reassigningOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E8E2D6] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#2C1810]">
                  Reassign Tailor
                </h3>
                <span className="text-xs text-[#7B6A5C]">
                  Order {reassigningOrder.id} · {reassigningOrder.alterationType}
                </span>
              </div>
              <button
                onClick={() => setReassigningOrder(null)}
                className="text-[#8C7B6E] hover:text-[#2C1810]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  Select Tailor:
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#E0D7C9] bg-white text-xs"
                >
                  <option value="">-- Unassigned --</option>
                  {workers.map((w) => {
                    const isQualified = w.skills.includes(reassigningOrder.alterationType as any);
                    return (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role}) {isQualified ? '✓ Qualified' : '⚠️ Unqualified'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  Reason for Override / Reassignment:
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g., Balancing workload; customer preference..."
                  className="w-full px-3 py-2 rounded border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D6]">
              <button
                type="button"
                onClick={() => setReassigningOrder(null)}
                className="px-3 py-1.5 text-xs text-[#7B6A5C] hover:text-[#2C1810]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReassignment}
                className="px-4 py-2 bg-[#2C1810] hover:bg-[#3D2317] text-[#FAF7F2] font-semibold text-xs rounded-lg transition-colors"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {deletingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 border border-[#E8E2D6] shadow-lg space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-display text-base font-bold text-[#2C1810]">
                Delete Order Record?
              </h3>
            </div>
            <p className="text-xs text-[#5D4E43] leading-relaxed">
              Are you sure you want to remove order <strong className="font-mono">{deletingOrderId}</strong>? This action cannot be undone and will release committed minutes from the assigned worker.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D6]">
              <button
                onClick={() => setDeletingOrderId(null)}
                className="px-3 py-1.5 text-xs text-[#7B6A5C] hover:text-[#2C1810]"
              >
                Keep Order
              </button>
              <button
                onClick={() => {
                  onDeleteOrder(deletingOrderId);
                  setDeletingOrderId(null);
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
