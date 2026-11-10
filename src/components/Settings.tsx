/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Clock,
  Calendar,
  Save,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AlterationType, Order, ShopSettings, Worker } from '../types';
import { purgeExpiredOrders, saveSettings } from '../utils/storage';

interface SettingsProps {
  settings: ShopSettings;
  orders: Order[];
  workers: Worker[];
  onUpdateSettings: (newSettings: ShopSettings) => void;
  onRestoreData: (backup: { orders: Order[]; workers: Worker[]; settings: ShopSettings }) => void;
  onResetBaseline: () => void;
  onOrdersPurged: (updatedOrders: Order[]) => void;
}

export const Settings: React.FC<SettingsProps & { onSaveWorker?: (worker: Worker) => void }> = ({
  settings,
  orders,
  workers,
  onUpdateSettings,
  onRestoreData,
  onResetBaseline,
  onOrdersPurged,
  onSaveWorker,
}) => {
  // Local form state
  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName || 'Mikka Estorba Elicano');
  const [standardLeadTime, setStandardLeadTime] = useState(settings.standardLeadTimeDays);
  const [rushLeadTime, setRushLeadTime] = useState(settings.rushLeadTimeDays);
  const [dailyWorkingHours, setDailyWorkingHours] = useState(settings.dailyWorkingHours);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(settings.workingDaysPerWeek);
  const [retentionMonths, setRetentionMonths] = useState(settings.retentionMonths);

  // Worker names local state
  const [workerNames, setWorkerNames] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    workers.forEach((w) => {
      map[w.id] = w.name;
    });
    return map;
  });

  // Alteration defaults
  const [alterationConfig, setAlterationConfig] = useState(settings.alterationDefaults);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopSettings = {
      ...settings,
      shopName,
      ownerName: ownerName.trim() || 'Mikka Estorba Elicano',
      standardLeadTimeDays: Number(standardLeadTime),
      rushLeadTimeDays: Number(rushLeadTime),
      dailyWorkingHours: Number(dailyWorkingHours),
      dailyWorkingMinutes: Number(dailyWorkingHours) * 60,
      workingDaysPerWeek: Number(workingDaysPerWeek),
      retentionMonths: Number(retentionMonths),
      alterationDefaults: alterationConfig,
    };

    onUpdateSettings(updated);

    // Also update any modified worker names
    if (onSaveWorker) {
      workers.forEach((w) => {
        if (workerNames[w.id] && workerNames[w.id] !== w.name) {
          onSaveWorker({
            ...w,
            name: workerNames[w.id].trim(),
          });
        }
      });
    }

    setToastMessage('Shop Owner & Operational settings saved successfully!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAlterationDurationChange = (
    type: AlterationType,
    field: 'defaultMinutes' | 'minMinutes' | 'maxMinutes',
    value: number
  ) => {
    setAlterationConfig({
      ...alterationConfig,
      [type]: {
        ...alterationConfig[type],
        [field]: value,
      },
    });
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      workers,
      orders,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tailortrack-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setToastMessage('System database backup exported to JSON file.');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.orders && parsed.workers && parsed.settings) {
          onRestoreData({
            orders: parsed.orders,
            workers: parsed.workers,
            settings: parsed.settings,
          });
          setToastMessage('System data successfully restored from backup file!');
        } else {
          alert('Invalid backup file format. Expected orders, workers, and settings.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Purge 6-Month Expired Orders
  const handlePurgeExpired = () => {
    const { retained, purgedCount } = purgeExpiredOrders(orders, retentionMonths);
    onOrdersPurged(retained);
    setPurgeResult(
      `Privacy purge complete: ${purgedCount} completed order(s) older than ${retentionMonths} months permanently removed.`
    );
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveGeneral} className="space-y-6">
        {/* Section 1: Shop Schedule & Operational Constants */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#E8E2D6] shadow-xs space-y-4">
          <div className="border-b border-[#E8E2D6] pb-3">
            <h3 className="font-display text-lg font-bold text-[#2C1810]">
              Shop Operational Schedule & Capacity
            </h3>
            <p className="text-xs text-[#7B6A5C]">
              Model assumptions from the simulation study
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#2C1810] mb-1">
                Shop Business Name:
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs text-[#2C1810]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#2C1810] mb-1">
                Shop Owner / Principal Researcher:
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g., Mikka Estorba Elicano"
                className="w-full px-3 py-2 rounded-lg border border-[#C89758] bg-[#FAF7F2]/80 text-xs font-bold text-[#2C1810] focus:ring-2 focus:ring-[#C89758]/40"
              />
              <span className="text-[10px] text-[#C89758] font-semibold mt-0.5 block">
                Displayed across system approvals, header, and dashboard
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#2C1810] mb-1">
                Working Days per Week:
              </label>
              <input
                type="number"
                min={5}
                max={7}
                value={workingDaysPerWeek}
                onChange={(e) => setWorkingDaysPerWeek(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs font-mono"
              />
              <span className="text-[10px] text-[#8C7B6E] mt-0.5 block">
                Standard: 6 working days (Mon–Sat; Sunday non-working)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#2C1810] mb-1">
                Daily Working Hours per Tailor:
              </label>
              <input
                type="number"
                min={4}
                max={12}
                value={dailyWorkingHours}
                onChange={(e) => setDailyWorkingHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs font-mono"
              />
              <span className="text-[10px] text-[#8C7B6E] mt-0.5 block">
                Default: 8 hours = 480 working minutes / shift
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#2C1810] mb-1">
                Standard Lead Time (Days):
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={standardLeadTime}
                onChange={(e) => setStandardLeadTime(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs font-mono"
              />
              <span className="text-[10px] text-[#8C7B6E] mt-0.5 block">
                Default: 3 business days for regular alterations
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#2C1810] mb-1">
                Rush Order Lead Time (Days):
              </label>
              <input
                type="number"
                min={1}
                max={3}
                value={rushLeadTime}
                onChange={(e) => setRushLeadTime(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E0D7C9] bg-[#FAF7F2]/50 text-xs font-mono"
              />
              <span className="text-[10px] text-[#8C7B6E] mt-0.5 block">
                Default: 1 business day for rush requests
              </span>
            </div>
          </div>

          {/* Worker Names Customization */}
          <div className="pt-4 border-t border-[#E8E2D6] space-y-3">
            <div>
              <h4 className="font-semibold text-xs text-[#2C1810]">
                Tailor Worker Names & Identifiers
              </h4>
              <p className="text-[11px] text-[#7B6A5C]">
                Configure names for Worker 1, Worker 2, and Worker 3 matching your research team or simulation roster
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {workers.map((worker) => (
                <div key={worker.id} className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E0D7C9] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#C89758]">{worker.role}</span>
                    <span className="text-[10px] text-[#8C7B6E] font-mono">{worker.dailyMinutes}m/day</span>
                  </div>
                  <input
                    type="text"
                    value={workerNames[worker.id] || worker.name}
                    onChange={(e) =>
                      setWorkerNames({
                        ...workerNames,
                        [worker.id]: e.target.value,
                      })
                    }
                    placeholder={worker.name}
                    className="w-full px-2.5 py-1.5 rounded border border-[#E0D7C9] bg-white text-xs font-semibold text-[#2C1810] focus:ring-1 focus:ring-[#C89758]"
                  />
                  <div className="text-[10px] text-[#7B6A5C] mt-1 truncate">
                    Skills: {worker.skills.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Alteration Labor Time Benchmarks */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#E8E2D6] shadow-xs space-y-4">
          <div className="border-b border-[#E8E2D6] pb-3">
            <h3 className="font-display text-lg font-bold text-[#2C1810]">
              Alteration Types & Labor Estimates
            </h3>
            <p className="text-xs text-[#7B6A5C]">
              Empirical working time ranges used in research simulation
            </p>
          </div>

          <div className="space-y-4">
            {(Object.keys(alterationConfig) as AlterationType[]).map((alt) => {
              const cfg = alterationConfig[alt];
              return (
                <div
                  key={alt}
                  className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D6] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#2C1810] text-sm block">{alt}</span>
                    <span className="text-[11px] text-[#8C7B6E]">
                      Required: {cfg.requiredSkill}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#7B6A5C] font-semibold mb-1">
                      Min Time (min):
                    </label>
                    <input
                      type="number"
                      value={cfg.minMinutes}
                      onChange={(e) =>
                        handleAlterationDurationChange(alt, 'minMinutes', Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-[#E0D7C9] bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#7B6A5C] font-semibold mb-1">
                      Benchmark Time (min):
                    </label>
                    <input
                      type="number"
                      value={cfg.defaultMinutes}
                      onChange={(e) =>
                        handleAlterationDurationChange(alt, 'defaultMinutes', Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-[#E0D7C9] bg-white font-mono text-xs font-bold text-[#C89758]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#7B6A5C] font-semibold mb-1">
                      Max Time (min):
                    </label>
                    <input
                      type="number"
                      value={cfg.maxMinutes}
                      onChange={(e) =>
                        handleAlterationDurationChange(alt, 'maxMinutes', Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-[#E0D7C9] bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2C1810] hover:bg-[#3D2317] text-[#FAF7F2] font-semibold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-[#C89758]" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </form>

      {/* Section 3: Data Management & Backup / Restore */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#E8E2D6] shadow-xs space-y-4">
        <div className="border-b border-[#E8E2D6] pb-3">
          <h3 className="font-display text-lg font-bold text-[#2C1810]">
            Database Backup & Migration
          </h3>
          <p className="text-xs text-[#7B6A5C]">
            Save or load shop records via LocalStorage JSON files
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Export */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-4 rounded-xl border border-[#E0D7C9] bg-[#FAF7F2] hover:bg-[#EFEAE1] transition-colors text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-[#2C1810] font-bold text-xs">
                <Download className="w-4 h-4 text-[#C89758]" />
                <span>Export JSON Backup</span>
              </div>
              <p className="text-[11px] text-[#7B6A5C] mt-1">
                Download a complete snapshot of all orders, workers, and settings.
              </p>
            </div>
            <span className="text-[10px] text-[#8C7B6E] font-mono mt-3">
              {orders.length} orders · {workers.length} workers
            </span>
          </button>

          {/* Import */}
          <label className="p-4 rounded-xl border border-[#E0D7C9] bg-[#FAF7F2] hover:bg-[#EFEAE1] transition-colors text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div className="flex items-center gap-2 text-[#2C1810] font-bold text-xs">
                <Upload className="w-4 h-4 text-[#C89758]" />
                <span>Import JSON Backup</span>
              </div>
              <p className="text-[11px] text-[#7B6A5C] mt-1">
                Restore database from an earlier exported JSON backup.
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
            <span className="text-[10px] text-[#C89758] font-semibold mt-3">
              Select .json file →
            </span>
          </label>

          {/* Reset */}
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Reset system to default research study seed data? Current unsaved orders will be reset to baseline.'
                )
              ) {
                onResetBaseline();
                setToastMessage('System successfully reset to default simulation baseline.');
              }
            }}
            className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Reset Simulation Baseline</span>
              </div>
              <p className="text-[11px] text-rose-700/80 mt-1">
                Restore default research study tailors and representative intake orders.
              </p>
            </div>
            <span className="text-[10px] text-rose-700 font-semibold mt-3">
              Reset Baseline →
            </span>
          </button>
        </div>
      </div>

      {/* Section 4: Privacy Notice & 6-Month Data Retention */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#E8E2D6] shadow-xs space-y-4">
        <div className="border-b border-[#E8E2D6] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-display text-lg font-bold text-[#2C1810]">
              Customer Privacy Notice & Data Retention
            </h3>
          </div>
          <p className="text-xs text-[#7B6A5C] mt-1">
            Data protection compliance and automated 6-month retention policy
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D6] text-xs text-[#5D4E43] leading-relaxed space-y-2">
          <div className="font-bold text-[#2C1810] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#C89758]" />
            <span>Authorized Shop Personnel Only</span>
          </div>
          <p>
            TAILORTRACK collects solely the customer contact name, telephone number, garment attributes, and alteration specifications required to fulfill garment alterations and provide pickup notifications. Customer data is stored locally on the shop terminal and is never transmitted to unverified third parties.
          </p>
          <p className="text-[#7B6A5C]">
            <strong>Mandatory Retention Rule: </strong> Customer records are retained for a maximum of 6 months following customer pickup to accommodate alteration warranties and re-fittings, after which records should be permanently deleted.
          </p>
        </div>

        {purgeResult && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
            {purgeResult}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-[#7B6A5C]">
            Retention Cutoff: <strong>{retentionMonths} Months</strong> following pickup date
          </div>

          <button
            type="button"
            onClick={handlePurgeExpired}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Purge Orders Older than {retentionMonths} Months</span>
          </button>
        </div>
      </div>
    </div>
  );
};
