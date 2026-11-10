/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, ShopSettings, Worker, WorkerWorkload } from '../types';
import { formatDate, parseDate } from './feasibilityEngine';
import { DEFAULT_SETTINGS, DEFAULT_WORKERS, INITIAL_SEED_ORDERS } from './mockData';

const STORAGE_KEYS = {
  ORDERS: 'tailortrack_orders_v2',
  WORKERS: 'tailortrack_workers_v2',
  SETTINGS: 'tailortrack_settings_v2',
  INITIALIZED: 'tailortrack_initialized_v2',
};

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      saveOrders(INITIAL_SEED_ORDERS);
      return INITIAL_SEED_ORDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading orders from storage:', e);
    return INITIAL_SEED_ORDERS;
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed saving orders to storage:', e);
  }
}

export function getStoredWorkers(): Worker[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKERS);
    if (!raw) {
      saveWorkers(DEFAULT_WORKERS);
      return DEFAULT_WORKERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading workers from storage:', e);
    return DEFAULT_WORKERS;
  }
}

export function saveWorkers(workers: Worker[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
  } catch (e) {
    console.error('Failed saving workers to storage:', e);
  }
}

export function getStoredSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading settings from storage:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ShopSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed saving settings to storage:', e);
  }
}

export function generateNextOrderId(existingOrders: Order[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `TT-${currentYear}-`;
  const existingNums = existingOrders
    .map((o) => {
      if (o.id.startsWith(prefix)) {
        const numPart = parseInt(o.id.replace(prefix, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      }
      return 0;
    })
    .filter((n) => n > 0);

  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * Calculates current active workload for all workers across a 6-day rolling horizon
 */
export function calculateWorkerWorkloads(
  workers: Worker[],
  orders: Order[],
  referenceDateStr?: string
): WorkerWorkload[] {
  const refDate = referenceDateStr ? parseDate(referenceDateStr) : new Date();
  const refDateStr = formatDate(refDate);

  // Consider active horizon of 6 working days (480 min * 6 = 2880 available minutes)
  const standardHorizonDays = 6;

  return workers.map((worker) => {
    const dailyMin = worker.dailyMinutes || 480;
    const availableMinutes = dailyMin * standardHorizonDays;

    // Active orders assigned to this worker
    const assignedOrders = orders.filter(
      (o) =>
        o.assignedWorkerId === worker.id &&
        (o.status === 'Accepted' || o.status === 'In Progress')
    );

    const committedMinutes = assignedOrders.reduce(
      (sum, o) => sum + (o.estimatedMinutes || 0),
      0
    );

    const remainingMinutes = Math.max(0, availableMinutes - committedMinutes);
    const workloadPercentage =
      availableMinutes > 0 ? Math.round((committedMinutes / availableMinutes) * 1000) / 10 : 0;

    return {
      workerId: worker.id,
      workerName: worker.name,
      role: worker.role,
      skills: worker.skills,
      dailyMinutes: dailyMin,
      availableMinutes,
      committedMinutes,
      remainingMinutes,
      workloadPercentage,
      assignedOrderCount: assignedOrders.length,
    };
  });
}

/**
 * Resets storage back to default research simulation state
 */
export function resetToResearchBaseline(): { orders: Order[]; workers: Worker[]; settings: ShopSettings } {
  saveOrders(INITIAL_SEED_ORDERS);
  saveWorkers(DEFAULT_WORKERS);
  saveSettings(DEFAULT_SETTINGS);
  return {
    orders: INITIAL_SEED_ORDERS,
    workers: DEFAULT_WORKERS,
    settings: DEFAULT_SETTINGS,
  };
}

/**
 * Purges customer orders older than retention period (e.g., 6 months after pickup)
 */
export function purgeExpiredOrders(
  orders: Order[],
  retentionMonths: number = 6
): { retained: Order[]; purgedCount: number } {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

  const retained: Order[] = [];
  let purgedCount = 0;

  for (const order of orders) {
    if (order.status === 'Picked Up' && order.pickedUpDate) {
      const pDate = parseDate(order.pickedUpDate);
      if (pDate < cutoffDate) {
        purgedCount++;
        continue;
      }
    }
    retained.push(order);
  }

  saveOrders(retained);
  return { retained, purgedCount };
}
