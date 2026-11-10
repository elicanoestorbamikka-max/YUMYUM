/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Scissors,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Order, Worker, WorkerSkill } from '../types';
import { formatFriendlyDate, getDayName } from '../utils/feasibilityEngine';
import { calculateWorkerWorkloads } from '../utils/storage';

interface WorkerManagementProps {
  workers: Worker[];
  orders: Order[];
  onSaveWorker: (worker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
}

const ALL_SKILLS: WorkerSkill[] = ['Waist Adjustment', 'Zipper Replacement', 'Hemming'];

export const WorkerManagement: React.FC<WorkerManagementProps> = ({
  workers,
  orders,
  onSaveWorker,
  onDeleteWorker,
}) => {
  const workloads = calculateWorkerWorkloads(workers, orders);

  // Modal State for Add / Edit Worker
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isNewWorker, setIsNewWorker] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<WorkerSkill[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState(480);
  const [bio, setBio] = useState('');

  // Selected worker for detail view
  const [activeWorkerId, setActiveWorkerId] = useState<string>(workers[0]?.id || '');

  const openAddModal = () => {
    setIsNewWorker(true);
    setEditingWorker(null);
    setName('');
    setRole('');
    setSelectedSkills(['Hemming']);
    setDailyMinutes(480);
    setBio('');
  };

  const openEditModal = (worker: Worker) => {
    setIsNewWorker(false);
    setEditingWorker(worker);
    setName(worker.name);
    setRole(worker.role);
    setSelectedSkills([...worker.skills]);
    setDailyMinutes(worker.dailyMinutes || 480);
    setBio(worker.bio || '');
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || selectedSkills.length === 0) return;

    const workerToSave: Worker = {
      id: isNewWorker ? `w-${Date.now()}` : (editingWorker?.id || `w-${Date.now()}`),
      name: name.trim(),
      role: role.trim(),
      skills: selectedSkills,
      dailyMinutes: Number(dailyMinutes) || 480,
      activeDays: [1, 2, 3, 4, 5, 6],
      bio: bio.trim(),
    };

    onSaveWorker(workerToSave);
    setEditingWorker(null);
    setIsNewWorker(false);
  };

  const toggleSkill = (skill: WorkerSkill) => {
    if (selectedSkills.includes(skill)) {
      if (selectedSkills.length > 1) {
        setSelectedSkills(selectedSkills.filter((s) => s !== skill));
      }
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const currentActiveWorker = workers.find((w) => w.id === activeWorkerId) || workers[0];
  const currentWorkload = workloads.find((w) => w.workerId === currentActiveWorker?.id);
  const assignedOrders = orders.filter(
    (o) =>
      o.assignedWorkerId === currentActiveWorker?.id &&
      (o.status === 'Accepted' || o.status === 'In Progress')
  );

  return (
    <div className="space-y-8">
      {/* Top Banner explaining the 3 research worker classes */}
      <div className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C89758]" />
              <h2 className="font-display text-xl font-bold text-[#2C1810]">
                Worker Capacity & Skill Specialization Roster
              </h2>
            </div>
            <p className="text-xs text-[#7B6A5C] mt-1">
              Shop operates on an 8-hour daily schedule (480 minutes/day) over a 6-day working week (Monday–Saturday).
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#2C1810] hover:bg-[#3D2317] text-[#FAF7F2] font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Tailor</span>
          </button>
        </div>
      </div>

      {/* 3 Worker Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {workloads.map((item) => {
          const isSelected = item.workerId === currentActiveWorker?.id;
          const isHigh = item.workloadPercentage >= 75;
          const isModerate = item.workloadPercentage >= 40 && item.workloadPercentage < 75;

          return (
            <div
              key={item.workerId}
              onClick={() => setActiveWorkerId(item.workerId)}
              className={`bg-white rounded-xl p-6 border cursor-pointer transition-all shadow-xs relative ${
                isSelected
                  ? 'border-[#C89758] ring-2 ring-[#C89758]/20 bg-[#FAF7F2]/30'
                  : 'border-[#E8E2D6] hover:border-[#D4C8B5]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-[#2C1810]">
                    {item.workerName}
                  </h3>
                  <div className="text-xs text-[#C89758] font-semibold mt-0.5">
                    {item.role}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const w = workers.find((x) => x.id === item.workerId);
                    if (w) openEditModal(w);
                  }}
                  className="p-1.5 text-[#8C7B6E] hover:text-[#2C1810] hover:bg-[#FAF7F2] rounded transition-colors"
                  title="Edit Worker Profile"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Workload Progress Bar */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#7B6A5C]">Committed Workload</span>
                  <span className="font-bold text-[#2C1810]">{item.workloadPercentage}%</span>
                </div>
                <div className="w-full bg-[#EFEAE1] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHigh
                        ? 'bg-rose-600'
                        : isModerate
                        ? 'bg-[#C89758]'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, item.workloadPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Minutes Stats */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#EFEAE1]">
                <div>
                  <span className="text-[10px] text-[#8C7B6E] block">Committed Time</span>
                  <span className="font-mono font-bold text-[#2C1810]">
                    {item.committedMinutes} min
                  </span>
                  <span className="text-[10px] text-[#A8988B] ml-1">
                    ({(item.committedMinutes / 60).toFixed(1)} hrs)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8C7B6E] block">Remaining Time</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {item.remainingMinutes} min
                  </span>
                  <span className="text-[10px] text-[#A8988B] ml-1">
                    ({(item.remainingMinutes / 60).toFixed(1)} hrs)
                  </span>
                </div>
              </div>

              {/* Skills Badges */}
              <div className="mt-4 pt-3 border-t border-[#EFEAE1]">
                <span className="text-[10px] text-[#8C7B6E] font-semibold block mb-1.5 uppercase tracking-wider">
                  Assigned Skills ({item.skills.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {item.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] px-2 py-0.5 rounded bg-[#FAF7F2] text-[#5D4E43] border border-[#E0D7C9]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Jobs Badge */}
              <div className="mt-3 text-[11px] text-[#7B6A5C] flex items-center justify-between">
                <span>Active Queue</span>
                <span className="font-mono font-semibold text-[#2C1810]">
                  {item.assignedOrderCount} jobs
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Worker Workbench Details & Active Orders Table */}
      {currentActiveWorker && (
        <div className="bg-white rounded-xl p-6 border border-[#E8E2D6] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D6] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold text-[#2C1810]">
                  {currentActiveWorker.name}'s Assigned Workbench
                </span>
                <span className="text-xs text-[#C89758] font-semibold bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8E2D6]">
                  {currentActiveWorker.role}
                </span>
              </div>
              {currentActiveWorker.bio && (
                <p className="text-xs text-[#7B6A5C] mt-1 max-w-2xl">{currentActiveWorker.bio}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7B6A5C]">
                Daily Shift: <strong className="font-mono text-[#2C1810]">{currentActiveWorker.dailyMinutes}m (8 hrs)</strong>
              </span>
            </div>
          </div>

          {/* Active Orders Assigned to this worker */}
          <div>
            <h4 className="text-xs font-bold text-[#2C1810] mb-3 uppercase tracking-wider">
              Currently Committed Orders ({assignedOrders.length})
            </h4>

            {assignedOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8C7B6E] bg-[#FAF7F2] rounded-lg border border-[#EFEAE1]">
                No active jobs currently in {currentActiveWorker.name}'s queue. Worker has 100% free capacity.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E2D6] text-[#7B6A5C]">
                      <th className="pb-2 font-semibold">Order ID</th>
                      <th className="pb-2 font-semibold">Customer</th>
                      <th className="pb-2 font-semibold">Alteration</th>
                      <th className="pb-2 font-semibold">Garment</th>
                      <th className="pb-2 font-semibold">Est. Minutes</th>
                      <th className="pb-2 font-semibold">Quoted Deadline</th>
                      <th className="pb-2 font-semibold">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE1]">
                    {assignedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF7F2]/50">
                        <td className="py-2.5 font-mono font-bold text-[#2C1810]">{order.id}</td>
                        <td className="py-2.5 font-semibold text-[#2C1810]">{order.customerName}</td>
                        <td className="py-2.5 text-[#5D4E43]">{order.alterationType}</td>
                        <td className="py-2.5 text-[#7B6A5C]">{order.garmentType}</td>
                        <td className="py-2.5 font-mono font-bold text-[#2C1810]">
                          {order.estimatedMinutes} min
                        </td>
                        <td className="py-2.5 font-mono text-[#2C1810]">
                          {formatFriendlyDate(order.quotedPickupDate)}
                        </td>
                        <td className="py-2.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            order.status === 'Accepted'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Worker Modal */}
      {(editingWorker || isNewWorker) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModal}
            className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E8E2D6] shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="font-display text-base font-bold text-[#2C1810]">
                {isNewWorker ? 'Add New Tailor Profile' : 'Edit Tailor Profile'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingWorker(null);
                  setIsNewWorker(false);
                }}
                className="text-[#8C7B6E] hover:text-[#2C1810]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  Tailor Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jonathan Myers"
                  className="w-full px-3 py-2 rounded border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  Role / Specialization Title:
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Senior Suit Tailor"
                  className="w-full px-3 py-2 rounded border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  Assigned Skills (Check all that apply):
                </label>
                <div className="space-y-1.5 p-3 rounded bg-[#FAF7F2] border border-[#E8E2D6]">
                  {ALL_SKILLS.map((skill) => {
                    const checked = selectedSkills.includes(skill);
                    return (
                      <label
                        key={skill}
                        className="flex items-center gap-2 cursor-pointer text-[#2C1810]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSkill(skill)}
                          className="rounded text-[#C89758] focus:ring-[#C89758]"
                        />
                        <span>{skill}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  Daily Working Capacity (Minutes):
                </label>
                <input
                  type="number"
                  min={120}
                  max={720}
                  step={30}
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs font-mono"
                />
                <span className="text-[10px] text-[#8C7B6E] mt-0.5 block">
                  Standard shift is 480 minutes (8 working hours).
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#2C1810] mb-1">
                  Tailor Bio & Experience Notes:
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Specialties, experience, fabric preferences..."
                  className="w-full px-3 py-2 rounded border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D6]">
              <button
                type="button"
                onClick={() => {
                  setEditingWorker(null);
                  setIsNewWorker(false);
                }}
                className="px-3 py-1.5 text-xs text-[#7B6A5C] hover:text-[#2C1810]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#2C1810] hover:bg-[#3D2317] text-[#FAF7F2] font-semibold text-xs rounded-lg transition-colors"
              >
                Save Tailor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
