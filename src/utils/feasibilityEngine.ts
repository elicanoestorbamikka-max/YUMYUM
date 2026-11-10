/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlterationType,
  FeasibilityDecision,
  FeasibilityEvaluation,
  Order,
  ShopSettings,
  Worker,
  WorkerFeasibilityDetail,
  WorkerSkill,
} from '../types';

/**
 * Parses YYYY-MM-DD into a localized UTC-safe Date object at midday
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formats a Date object into YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns human readable date with day of week (e.g. "Thursday, Nov 12, 2026")
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns day of week name (e.g. "Monday", "Tuesday")
 */
export function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Checks whether a given date is a working day based on shop schedule (1=Mon ... 6=Sat)
 */
export function isWorkingDay(date: Date, activeDays: number[] = [1, 2, 3, 4, 5, 6]): boolean {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return activeDays.includes(day);
}

/**
 * Adds working days to a start date, skipping non-working days (e.g. Sundays)
 */
export function addWorkingDays(
  startDateStr: string,
  daysCount: number,
  activeDays: number[] = [1, 2, 3, 4, 5, 6]
): string {
  let curr = parseDate(startDateStr);
  let added = 0;
  while (added < daysCount) {
    curr.setDate(curr.getDate() + 1);
    if (isWorkingDay(curr, activeDays)) {
      added++;
    }
  }
  return formatDate(curr);
}

/**
 * Counts working days between two dates inclusive of both dates
 */
export function countWorkingDays(
  startDateStr: string,
  endDateStr: string,
  activeDays: number[] = [1, 2, 3, 4, 5, 6]
): number {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  if (start > end) return 0;

  let count = 0;
  const curr = new Date(start.getTime());
  while (curr <= end) {
    if (isWorkingDay(curr, activeDays)) {
      count++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  return count;
}

/**
 * Maps alteration type to required worker skill
 */
export function getRequiredSkill(
  alterationType: AlterationType,
  settings: ShopSettings
): WorkerSkill {
  return settings.alterationDefaults[alterationType]?.requiredSkill || (alterationType as WorkerSkill);
}

/**
 * Evaluates feasibility of an order and recommends the optimal worker
 * based on research formulas.
 */
export function evaluateFeasibility(
  alterationType: AlterationType,
  estimatedMinutes: number,
  dateReceived: string,
  requestedPickupDate: string,
  workers: Worker[],
  activeOrders: Order[],
  settings: ShopSettings,
  ignoreOrderId?: string
): FeasibilityEvaluation {
  const requiredSkill = getRequiredSkill(alterationType, settings);
  const activeDays = settings.workingDays || [1, 2, 3, 4, 5, 6];
  const workingDaysCount = Math.max(
    1,
    countWorkingDays(dateReceived, requestedPickupDate, activeDays)
  );

  const qualifiedWorkerIds: string[] = [];
  const workerDetails: WorkerFeasibilityDetail[] = [];

  for (const worker of workers) {
    const isQualified = worker.skills.includes(requiredSkill);
    if (isQualified) {
      qualifiedWorkerIds.push(worker.id);
    }

    // Available minutes = working days * worker daily minutes
    const totalAvailableMinutes = workingDaysCount * (worker.dailyMinutes || settings.dailyWorkingMinutes || 480);

    // Sum committed minutes of existing active orders assigned to this worker
    // Active orders are 'Accepted' or 'In Progress' whose quoted pickup date falls within or on requestedPickupDate
    const committedMinutes = activeOrders
      .filter((o) => {
        if (ignoreOrderId && o.id === ignoreOrderId) return false;
        if (o.assignedWorkerId !== worker.id) return false;
        if (o.status !== 'Accepted' && o.status !== 'In Progress') return false;
        // Check if committed in this timeframe
        return o.quotedPickupDate <= requestedPickupDate;
      })
      .reduce((sum, o) => sum + (o.estimatedMinutes || 0), 0);

    const remainingMinutes = Math.max(0, totalAvailableMinutes - committedMinutes);
    const workloadPercentage =
      totalAvailableMinutes > 0 ? (committedMinutes / totalAvailableMinutes) * 100 : 100;
    const canAccommodate = isQualified && remainingMinutes >= estimatedMinutes;

    workerDetails.push({
      workerId: worker.id,
      workerName: worker.name,
      role: worker.role,
      isQualified,
      workingDaysCount,
      totalAvailableMinutes,
      committedMinutes,
      remainingMinutes,
      workloadPercentage: Math.round(workloadPercentage * 10) / 10,
      canAccommodate,
    });
  }

  // Filter candidates who are qualified and have enough remaining capacity
  const feasibleWorkers = workerDetails.filter((w) => w.canAccommodate);

  let decision: FeasibilityDecision = 'RENEGOTIATE';
  let recommendedWorkerId: string | null = null;
  let suggestedEarliestPickupDate: string | null = null;
  let suggestedWorkerIdOnEarliestDate: string | null = null;
  let explanation = '';

  if (feasibleWorkers.length > 0) {
    decision = 'ACCEPT';
    // Rule: Select the qualified worker with the lowest share of committed hours (lowest workloadPercentage)
    // If tied, select worker with the most remaining minutes
    feasibleWorkers.sort((a, b) => {
      if (Math.abs(a.workloadPercentage - b.workloadPercentage) > 0.01) {
        return a.workloadPercentage - b.workloadPercentage;
      }
      return b.remainingMinutes - a.remainingMinutes;
    });

    recommendedWorkerId = feasibleWorkers[0].workerId;
    suggestedEarliestPickupDate = requestedPickupDate;
    suggestedWorkerIdOnEarliestDate = recommendedWorkerId;

    const chosen = feasibleWorkers[0];
    explanation = `Feasible pickup date! ${chosen.workerName} (${chosen.role}) is recommended with ${Math.round(
      chosen.workloadPercentage
    )}% committed workload (${chosen.remainingMinutes} min free remaining).`;
  } else {
    // No worker has enough capacity before requested pickup date
    decision = 'RENEGOTIATE';

    // Find the earliest working date where at least one qualified worker will have enough cumulative capacity
    const earliestResult = findEarliestFeasibleDate(
      alterationType,
      estimatedMinutes,
      dateReceived,
      workers,
      activeOrders,
      settings,
      ignoreOrderId
    );

    suggestedEarliestPickupDate = earliestResult.earliestDate;
    suggestedWorkerIdOnEarliestDate = earliestResult.recommendedWorkerId;

    if (qualifiedWorkerIds.length === 0) {
      explanation = `No shop workers possess the required skill (${requiredSkill}). Please inspect worker profiles.`;
    } else {
      const earliestDayName = getDayName(suggestedEarliestPickupDate || '');
      explanation = `Insufficient capacity before requested date (${formatFriendlyDate(
        requestedPickupDate
      )}). Earliest feasible pickup date is ${earliestDayName}, ${formatFriendlyDate(
        suggestedEarliestPickupDate || ''
      )}.`;
    }
  }

  return {
    requestedPickupDate,
    estimatedMinutes,
    decision,
    qualifiedWorkerIds,
    workerDetails,
    recommendedWorkerId,
    suggestedEarliestPickupDate,
    suggestedWorkerIdOnEarliestDate,
    explanation,
  };
}

/**
 * Searches forward day by day to find the earliest date when a qualified worker has enough time
 */
export function findEarliestFeasibleDate(
  alterationType: AlterationType,
  estimatedMinutes: number,
  dateReceived: string,
  workers: Worker[],
  activeOrders: Order[],
  settings: ShopSettings,
  ignoreOrderId?: string
): { earliestDate: string; recommendedWorkerId: string | null } {
  const requiredSkill = getRequiredSkill(alterationType, settings);
  const qualifiedWorkers = workers.filter((w) => w.skills.includes(requiredSkill));

  if (qualifiedWorkers.length === 0) {
    return { earliestDate: dateReceived, recommendedWorkerId: null };
  }

  const activeDays = settings.workingDays || [1, 2, 3, 4, 5, 6];
  let checkDate = parseDate(dateReceived);
  const maxDaysToLookAhead = 30; // Max lookup window
  let iterations = 0;

  while (iterations < maxDaysToLookAhead) {
    // If not a working day, advance
    if (!isWorkingDay(checkDate, activeDays)) {
      checkDate.setDate(checkDate.getDate() + 1);
      iterations++;
      continue;
    }

    const checkDateStr = formatDate(checkDate);
    const workingDaysCount = Math.max(
      1,
      countWorkingDays(dateReceived, checkDateStr, activeDays)
    );

    // Evaluate each qualified worker on this target date
    const candidates: {
      workerId: string;
      workloadPct: number;
      remainingMinutes: number;
      canAccommodate: boolean;
    }[] = [];

    for (const worker of qualifiedWorkers) {
      const totalAvailable = workingDaysCount * (worker.dailyMinutes || settings.dailyWorkingMinutes || 480);
      const committed = activeOrders
        .filter((o) => {
          if (ignoreOrderId && o.id === ignoreOrderId) return false;
          if (o.assignedWorkerId !== worker.id) return false;
          if (o.status !== 'Accepted' && o.status !== 'In Progress') return false;
          return o.quotedPickupDate <= checkDateStr;
        })
        .reduce((sum, o) => sum + (o.estimatedMinutes || 0), 0);

      const remaining = Math.max(0, totalAvailable - committed);
      const workloadPct = totalAvailable > 0 ? (committed / totalAvailable) * 100 : 100;

      if (remaining >= estimatedMinutes) {
        candidates.push({
          workerId: worker.id,
          workloadPct,
          remainingMinutes: remaining,
          canAccommodate: true,
        });
      }
    }

    if (candidates.length > 0) {
      // Pick worker with lowest committed workload share
      candidates.sort((a, b) => a.workloadPct - b.workloadPct);
      return {
        earliestDate: checkDateStr,
        recommendedWorkerId: candidates[0].workerId,
      };
    }

    checkDate.setDate(checkDate.getDate() + 1);
    iterations++;
  }

  // Fallback default: 3 business days from dateReceived
  const fallback = addWorkingDays(dateReceived, 3, activeDays);
  return { earliestDate: fallback, recommendedWorkerId: qualifiedWorkers[0]?.id || null };
}
