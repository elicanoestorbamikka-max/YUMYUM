/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GarmentType = 'Pants' | 'Blouse' | 'Skirt' | 'Uniform' | 'Other';

export type AlterationType = 'Waist Adjustment' | 'Zipper Replacement' | 'Hemming';

export type OrderStatus = 'Accepted' | 'In Progress' | 'Ready' | 'Picked Up' | 'Declined';

export type FeasibilityDecision = 'ACCEPT' | 'RENEGOTIATE' | 'DECLINE';

export type WorkerSkill = 'Waist Adjustment' | 'Zipper Replacement' | 'Hemming';

export interface Worker {
  id: string;
  name: string;
  role: string;
  skills: WorkerSkill[];
  dailyMinutes: number; // default 480 (8 hours)
  activeDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun (default [1,2,3,4,5,6])
  bio?: string;
}

export interface WorkerWorkload {
  workerId: string;
  workerName: string;
  role: string;
  skills: WorkerSkill[];
  dailyMinutes: number;
  availableMinutes: number;
  committedMinutes: number;
  remainingMinutes: number;
  workloadPercentage: number;
  assignedOrderCount: number;
}

export interface WorkerFeasibilityDetail {
  workerId: string;
  workerName: string;
  role: string;
  isQualified: boolean;
  workingDaysCount: number;
  totalAvailableMinutes: number;
  committedMinutes: number;
  remainingMinutes: number;
  workloadPercentage: number; // committed / totalAvailable * 100
  canAccommodate: boolean; // remainingMinutes >= estimatedMinutes
}

export interface FeasibilityEvaluation {
  requestedPickupDate: string;
  estimatedMinutes: number;
  decision: FeasibilityDecision;
  qualifiedWorkerIds: string[];
  workerDetails: WorkerFeasibilityDetail[];
  recommendedWorkerId: string | null;
  suggestedEarliestPickupDate: string | null;
  suggestedWorkerIdOnEarliestDate: string | null;
  explanation: string;
}

export interface Order {
  id: string; // e.g., "TT-2026-001"
  customerName: string;
  contactNumber: string;
  garmentType: GarmentType;
  alterationType: AlterationType;
  estimatedMinutes: number;
  dateReceived: string; // YYYY-MM-DD
  requestedPickupDate: string; // YYYY-MM-DD
  quotedPickupDate: string; // YYYY-MM-DD
  isRush: boolean;
  status: OrderStatus;
  assignedWorkerId: string | null;
  suggestedWorkerId: string | null;
  isOverride: boolean;
  overrideReason?: string;
  feasibilityResult: FeasibilityDecision;
  feasibilityNotes?: string;
  notes?: string;
  readyDate?: string; // YYYY-MM-DD
  pickedUpDate?: string; // YYYY-MM-DD
  isLate?: boolean;
  tardinessDays?: number;
  renegotiatedNewDate?: string;
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  ownerName: string; // Shop Owner / Lead Researcher
  dailyWorkingHours: number; // 8
  dailyWorkingMinutes: number; // 480
  workingDaysPerWeek: number; // 6
  workingDays: number[]; // [1,2,3,4,5,6] (Mon-Sat)
  standardLeadTimeDays: number; // 3
  rushLeadTimeDays: number; // 1
  alterationDefaults: Record<
    AlterationType,
    {
      defaultMinutes: number;
      minMinutes: number;
      maxMinutes: number;
      requiredSkill: WorkerSkill;
    }
  >;
  retentionMonths: number; // 6
}
