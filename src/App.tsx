/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Edit2, X, Check, Save } from 'lucide-react';
import { NavTab, Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { OrderIntake } from './components/OrderIntake';
import { OrderList } from './components/OrderList';
import { OrderScheduling } from './components/OrderScheduling';
import { WorkerManagement } from './components/WorkerManagement';
import { FeasibilityCheckerTool } from './components/FeasibilityCheckerTool';
import { ReportsAnalytics } from './components/ReportsAnalytics';
import { ResearchDemo } from './components/ResearchDemo';
import { Settings } from './components/Settings';
import { Order, ShopSettings, Worker } from './types';
import {
  getStoredOrders,
  getStoredSettings,
  getStoredWorkers,
  resetToResearchBaseline,
  saveOrders,
  saveSettings,
  saveWorkers,
} from './utils/storage';

export default function App() {
  // Load persistent state from LocalStorage
  const [orders, setOrders] = useState<Order[]>(() => getStoredOrders());
  const [workers, setWorkers] = useState<Worker[]>(() => getStoredWorkers());
  const [settings, setSettings] = useState<ShopSettings>(() => getStoredSettings());

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [initialOrderFilter, setInitialOrderFilter] = useState<string>('All');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Quick Name Editor Modal State
  const [isNameEditorOpen, setIsNameEditorOpen] = useState(false);
  const [nameEditorOwner, setNameEditorOwner] = useState('');
  const [nameEditorWorkers, setNameEditorWorkers] = useState<Record<string, string>>({});

  const handleOpenNameEditor = () => {
    setNameEditorOwner(settings.ownerName || 'Mikka Estorba Elicano');
    const wMap: Record<string, string> = {};
    workers.forEach((w) => {
      wMap[w.id] = w.name;
    });
    setNameEditorWorkers(wMap);
    setIsNameEditorOpen(true);
  };

  const handleSaveQuickNames = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: ShopSettings = {
      ...settings,
      ownerName: nameEditorOwner.trim() || 'Mikka Estorba Elicano',
    };
    setSettings(updatedSettings);

    setWorkers((prev) =>
      prev.map((w) => {
        if (nameEditorWorkers[w.id] && nameEditorWorkers[w.id].trim()) {
          return {
            ...w,
            name: nameEditorWorkers[w.id].trim(),
          };
        }
        return w;
      })
    );

    setIsNameEditorOpen(false);
  };

  // Sync to LocalStorage on modifications
  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveWorkers(workers);
  }, [workers]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Order Handlers
  const handleSaveNewOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setActiveTab('orders');
    setInitialOrderFilter('All');
  };

  const handleUpdateOrder = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            readyDate: status === 'Ready' && !o.readyDate ? new Date().toISOString().slice(0, 10) : o.readyDate,
            pickedUpDate: status === 'Picked Up' && !o.pickedUpDate ? new Date().toISOString().slice(0, 10) : o.pickedUpDate,
          };
        }
        return o;
      })
    );
  };

  // Worker Handlers
  const handleSaveWorker = (worker: Worker) => {
    setWorkers((prev) => {
      const exists = prev.some((w) => w.id === worker.id);
      if (exists) {
        return prev.map((w) => (w.id === worker.id ? worker : w));
      }
      return [...prev, worker];
    });
  };

  const handleDeleteWorker = (workerId: string) => {
    setWorkers((prev) => prev.filter((w) => w.id !== workerId));
  };

  // Settings Handlers
  const handleUpdateSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
  };

  const handleRestoreData = (backup: {
    orders: Order[];
    workers: Worker[];
    settings: ShopSettings;
  }) => {
    setOrders(backup.orders);
    setWorkers(backup.workers);
    setSettings(backup.settings);
    saveOrders(backup.orders);
    saveWorkers(backup.workers);
    saveSettings(backup.settings);
  };

  const handleResetBaseline = () => {
    const baseline = resetToResearchBaseline();
    setOrders(baseline.orders);
    setWorkers(baseline.workers);
    setSettings(baseline.settings);
    setActiveTab('dashboard');
  };

  const handleOrdersPurged = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
  };

  // Quick navigation helpers
  const handleNavigateToOrdersWithFilter = (filterStatus: string = 'All') => {
    setInitialOrderFilter(filterStatus);
    setActiveTab('orders');
  };

  const handleTransferFeasibilityToOrder = (partial: Partial<Order>) => {
    setActiveTab('intake');
  };

  // Badges & Counters
  const pendingAttentionCount = orders.filter(
    (o) => o.isOverride || (!o.assignedWorkerId && o.status === 'Accepted') || o.isLate
  ).length;

  const totalActiveCount = orders.filter(
    (o) => o.status === 'Accepted' || o.status === 'In Progress' || o.status === 'Ready'
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C1810] flex flex-col lg:flex-row antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingAttentionCount={pendingAttentionCount}
        totalActiveCount={totalActiveCount}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          ownerName={settings.ownerName}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          onNewOrderClick={() => setActiveTab('intake')}
          onResetDataClick={handleResetBaseline}
          onEditNamesClick={handleOpenNameEditor}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              orders={orders}
              workers={workers}
              settings={settings}
              onNavigateToIntake={() => setActiveTab('intake')}
              onNavigateToOrders={handleNavigateToOrdersWithFilter}
              onNavigateToScheduling={() => setActiveTab('scheduling')}
              onNavigateToWorkers={() => setActiveTab('workers')}
              onNavigateToResearch={() => setActiveTab('research')}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === 'intake' && (
            <OrderIntake
              orders={orders}
              workers={workers}
              settings={settings}
              onSaveOrder={handleSaveNewOrder}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'orders' && (
            <OrderList
              orders={orders}
              workers={workers}
              settings={settings}
              initialFilterStatus={initialOrderFilter}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
              onNewOrderClick={() => setActiveTab('intake')}
            />
          )}

          {activeTab === 'scheduling' && (
            <OrderScheduling
              orders={orders}
              workers={workers}
              settings={settings}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onNavigateToManageOrders={() => setActiveTab('orders')}
            />
          )}

          {activeTab === 'workers' && (
            <WorkerManagement
              workers={workers}
              orders={orders}
              onSaveWorker={handleSaveWorker}
              onDeleteWorker={handleDeleteWorker}
            />
          )}

          {activeTab === 'feasibility' && (
            <FeasibilityCheckerTool
              workers={workers}
              orders={orders}
              settings={settings}
              onApplyAsOrder={handleTransferFeasibilityToOrder}
            />
          )}

          {activeTab === 'analytics' && (
            <ReportsAnalytics
              orders={orders}
              workers={workers}
              settings={settings}
            />
          )}

          {activeTab === 'research' && <ResearchDemo />}

          {activeTab === 'settings' && (
            <Settings
              settings={settings}
              orders={orders}
              workers={workers}
              onUpdateSettings={handleUpdateSettings}
              onRestoreData={handleRestoreData}
              onResetBaseline={handleResetBaseline}
              onOrdersPurged={handleOrdersPurged}
              onSaveWorker={handleSaveWorker}
            />
          )}
        </main>

        {/* Global Quiet Footer */}
        <footer className="border-t border-[#E8E2D6] py-6 px-4 sm:px-8 text-center text-xs text-[#8C7B6E] bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="font-display font-bold text-[#2C1810]">
              TAILORTRACK <span className="font-normal font-sans text-xs text-[#8C7B6E]">· Clothing Alteration Management</span>
            </div>
            <div className="text-[11px] text-[#A8988B]">
              Based on "Promise-Date Quoting and Skill-Matched Job Assignment for a Proposed Clothing Alteration Shop: A Simulation-Based Study."
            </div>
            <div className="text-[11px] text-[#C89758] font-mono">
              6-Day Schedule · 480 min/day
            </div>
          </div>
        </footer>
      </div>

      {/* QUICK NAME EDITOR MODAL (Accessible from anywhere by clicking Shop Owner badge) */}
      {isNameEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveQuickNames}
            className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E8E2D6] shadow-xl space-y-5 animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#2C1810]">
                  Modify Owner & Worker Names
                </h3>
                <p className="text-xs text-[#7B6A5C] mt-0.5">
                  Update names displayed across simulation orders and schedules
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNameEditorOpen(false)}
                className="text-[#8C7B6E] hover:text-[#2C1810] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Shop Owner Name */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-lg border border-[#E0D7C9] space-y-1.5">
                <label className="block font-bold text-[#2C1810]">
                  Shop Owner / Researcher Name:
                </label>
                <input
                  type="text"
                  required
                  value={nameEditorOwner}
                  onChange={(e) => setNameEditorOwner(e.target.value)}
                  placeholder="e.g., Mikka Estorba Elicano"
                  className="w-full px-3 py-2 rounded border border-[#C89758] bg-white font-semibold text-[#2C1810] text-xs focus:ring-2 focus:ring-[#C89758]/40"
                />
                <span className="text-[10px] text-[#8C7B6E] block">
                  Authorizes assignments, overrides, and shop schedule rules.
                </span>
              </div>

              {/* Workers Section */}
              <div className="space-y-3">
                <span className="block font-bold text-[#2C1810] uppercase tracking-wider text-[11px]">
                  Tailor Worker Names (3 Research Profiles):
                </span>

                {workers.map((worker) => (
                  <div key={worker.id} className="p-2.5 rounded border border-[#E8E2D6] bg-white space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#C89758]">{worker.role}</span>
                      <span className="text-[#8C7B6E] text-[10px]">{worker.skills.length} skills</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={nameEditorWorkers[worker.id] || worker.name}
                      onChange={(e) =>
                        setNameEditorWorkers({
                          ...nameEditorWorkers,
                          [worker.id]: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-[#E0D7C9] text-xs font-medium text-[#2C1810]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D6]">
              <button
                type="button"
                onClick={() => setIsNameEditorOpen(false)}
                className="px-3 py-1.5 text-xs text-[#7B6A5C] hover:text-[#2C1810]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#2C1810] hover:bg-[#3D2317] text-[#FAF7F2] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-[#C89758]" />
                <span>Save All Names</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
