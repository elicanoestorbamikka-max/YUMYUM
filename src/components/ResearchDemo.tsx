/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  X,
  Scissors,
} from 'lucide-react';
import { WorkerSkill } from '../types';

type CaseStudyId = 'orderA' | 'orderB' | 'orderC';

interface CaseStudyConfig {
  id: CaseStudyId;
  title: string;
  subtitle: string;
  scenarioDescription: string;
  orderParams: {
    garment: string;
    alteration: string;
    requiredSkill: WorkerSkill;
    estimatedMinutes: number;
    dateReceived: string;
    requestedPickup: string;
    isRush: boolean;
  };
  simulatedWorkers: {
    name: string;
    role: string;
    skills: WorkerSkill[];
    totalAvailableMinutes: number;
    committedMinutes: number;
    remainingMinutes: number;
    workloadPercentage: number;
    isQualified: boolean;
    canAccommodate: boolean;
  }[];
  expectedOutcome: {
    decision: 'ACCEPT' | 'RENEGOTIATE';
    quotedDate: string;
    assignedWorker: string;
    rationale: string;
    researchInsight: string;
  };
}

const CASE_STUDIES: Record<CaseStudyId, CaseStudyConfig> = {
  orderA: {
    id: 'orderA',
    title: 'Order A: Accepted (Lower Committed Share Selected)',
    subtitle: 'Zipper Replacement (60 min) · Thursday Pickup Request',
    scenarioDescription:
      'A customer brings a pair of trousers for zipper replacement requiring 60 minutes of labor and requests pickup on Thursday. Both senior tailors possess the necessary skill, but one has a lower committed workload share.',
    orderParams: {
      garment: 'Pants',
      alteration: 'Zipper Replacement',
      requiredSkill: 'Zipper Replacement',
      estimatedMinutes: 60,
      dateReceived: 'Monday',
      requestedPickup: 'Thursday',
      isRush: false,
    },
    simulatedWorkers: [
      {
        name: 'Worker 1: General Tailor',
        role: 'General Tailor',
        skills: ['Waist Adjustment', 'Zipper Replacement', 'Hemming'],
        totalAvailableMinutes: 1440,
        committedMinutes: 1200,
        remainingMinutes: 240,
        workloadPercentage: 83.3,
        isQualified: true,
        canAccommodate: true,
      },
      {
        name: 'Worker 2: Fitted-Garment Specialist',
        role: 'Fitted-Garment Specialist',
        skills: ['Waist Adjustment', 'Zipper Replacement', 'Hemming'],
        totalAvailableMinutes: 1440,
        committedMinutes: 800,
        remainingMinutes: 640,
        workloadPercentage: 55.6,
        isQualified: true,
        canAccommodate: true,
      },
      {
        name: 'Worker 3: Hemming-Only Trainee',
        role: 'Hemming-Only Trainee',
        skills: ['Hemming'],
        totalAvailableMinutes: 1440,
        committedMinutes: 300,
        remainingMinutes: 1140,
        workloadPercentage: 20.8,
        isQualified: false,
        canAccommodate: false,
      },
    ],
    expectedOutcome: {
      decision: 'ACCEPT',
      quotedDate: 'Thursday (As Requested)',
      assignedWorker: 'Worker 2: Fitted-Garment Specialist',
      rationale:
        'Both Worker 1 (General Tailor: 240m remaining, 83% committed) and Worker 2 (Fitted-Garment Specialist: 640m remaining, 56% committed) can accommodate the 60-minute task. Worker 2 is assigned because 56% committed share is lower than 83%. Worker 3 (Hemming Trainee) is not qualified.',
      researchInsight:
        'Selecting the qualified worker with the lowest share of committed hours actively levels shop capacity, preventing worker burnout and reducing queue variance.',
    },
  },
  orderB: {
    id: 'orderB',
    title: 'Order B: Date Not Feasible (Earliest Date Quoting)',
    subtitle: 'Rush Zipper Replacement (60 min) · Tuesday Pickup Request',
    scenarioDescription:
      'A customer requests a rush zipper replacement requiring 60 minutes with promised collection by Tuesday noon. On Monday, remaining capacity across qualified tailors is limited.',
    orderParams: {
      garment: 'Uniform Jacket',
      alteration: 'Zipper Replacement',
      requiredSkill: 'Zipper Replacement',
      estimatedMinutes: 60,
      dateReceived: 'Monday morning',
      requestedPickup: 'Tuesday (Rush)',
      isRush: true,
    },
    simulatedWorkers: [
      {
        name: 'Worker 1: General Tailor',
        role: 'General Tailor',
        skills: ['Waist Adjustment', 'Zipper Replacement', 'Hemming'],
        totalAvailableMinutes: 480,
        committedMinutes: 450,
        remainingMinutes: 30,
        workloadPercentage: 93.8,
        isQualified: true,
        canAccommodate: false, // 30 < 60
      },
      {
        name: 'Worker 2: Fitted-Garment Specialist',
        role: 'Fitted-Garment Specialist',
        skills: ['Waist Adjustment', 'Zipper Replacement', 'Hemming'],
        totalAvailableMinutes: 480,
        committedMinutes: 435,
        remainingMinutes: 45,
        workloadPercentage: 90.6,
        isQualified: true,
        canAccommodate: false, // 45 < 60
      },
      {
        name: 'Worker 3: Hemming-Only Trainee',
        role: 'Hemming-Only Trainee',
        skills: ['Hemming'],
        totalAvailableMinutes: 480,
        committedMinutes: 120,
        remainingMinutes: 360,
        workloadPercentage: 25.0,
        isQualified: false,
        canAccommodate: false,
      },
    ],
    expectedOutcome: {
      decision: 'RENEGOTIATE',
      quotedDate: 'Wednesday (Earliest Feasible Quoted Date)',
      assignedWorker: 'Pending customer acceptance (or Recorded as Declined)',
      rationale:
        'Neither qualified worker has 60 minutes remaining on Monday (Worker 1 has 30m; Worker 2 has 45m). The system rejects the Tuesday promise date and quotes Wednesday, when Worker 2 has 480m fresh shift capacity.',
      researchInsight:
        'Rather than blind overpromising (which causes 80%+ tardiness in conventional shops), the simulation model protects shop reputation by proposing realistic earliest dates or recording formal declines.',
    },
  },
  orderC: {
    id: 'orderC',
    title: 'Order C: Hemming (Apprentice Prioritization)',
    subtitle: 'Trousers Hemming (30 min) · Standard Friday Pickup',
    scenarioDescription:
      'A customer brings trousers for hemming requiring 30 minutes of labor. All three workers in the shop possess the Hemming skill.',
    orderParams: {
      garment: 'Pants',
      alteration: 'Hemming',
      requiredSkill: 'Hemming',
      estimatedMinutes: 30,
      dateReceived: 'Tuesday',
      requestedPickup: 'Friday',
      isRush: false,
    },
    simulatedWorkers: [
      {
        name: 'Worker 1: General Tailor',
        role: 'General Tailor',
        skills: ['Waist Adjustment', 'Zipper Replacement', 'Hemming'],
        totalAvailableMinutes: 1440,
        committedMinutes: 980,
        remainingMinutes: 460,
        workloadPercentage: 68.1,
        isQualified: true,
        canAccommodate: true,
      },
      {
        name: 'Worker 2: Fitted-Garment Specialist',
        role: 'Fitted-Garment Specialist',
        skills: ['Waist Adjustment', 'Zipper Replacement', 'Hemming'],
        totalAvailableMinutes: 1440,
        committedMinutes: 890,
        remainingMinutes: 550,
        workloadPercentage: 61.8,
        isQualified: true,
        canAccommodate: true,
      },
      {
        name: 'Worker 3: Hemming-Only Trainee',
        role: 'Hemming-Only Trainee',
        skills: ['Hemming'],
        totalAvailableMinutes: 1440,
        committedMinutes: 420,
        remainingMinutes: 1020,
        workloadPercentage: 29.2,
        isQualified: true,
        canAccommodate: true,
      },
    ],
    expectedOutcome: {
      decision: 'ACCEPT',
      quotedDate: 'Friday (As Requested)',
      assignedWorker: 'Worker 3: Hemming-Only Trainee',
      rationale:
        'All three workers are qualified for hemming. Worker 3 (Hemming-Only Trainee) has the lowest committed workload share (29.2% vs 61.8% and 68.1%). Worker 3 is assigned the order, thereby preserving senior tailors for complex alterations.',
      researchInsight:
        'Skill-matched assignment naturally routes entry-level tasks to trainees, keeping senior specialist capacity unblocked for waist adjustments and zipper jobs.',
    },
  },
};

export const ResearchDemo: React.FC = () => {
  const [activeCaseId, setActiveCaseId] = useState<CaseStudyId>('orderA');
  const [isSimulated, setIsSimulated] = useState<boolean>(true);

  const activeCase = CASE_STUDIES[activeCaseId];

  return (
    <div className="space-y-8">
      {/* Top Academic Banner */}
      <div className="bg-[#2C1810] text-[#FAF7F2] rounded-xl p-6 sm:p-8 border border-[#4A3225] shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#C89758] uppercase tracking-wider mb-2">
          <BookOpenCheck className="w-4 h-4" />
          <span>Research Study Verification Suite</span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-[#FAF7F2]">
          "Promise-Date Quoting and Skill-Matched Job Assignment"
        </h2>
        <p className="text-xs sm:text-sm text-[#D8CEBD] mt-2 max-w-3xl leading-relaxed">
          Walk through the three definitive case scenarios evaluated in our simulation-based research paper.
          Observe how the mathematical algorithms evaluate feasibility, balance workloads, and protect shop performance.
        </p>

        {/* Case Study Selector Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(['orderA', 'orderB', 'orderC'] as CaseStudyId[]).map((id) => {
            const cs = CASE_STUDIES[id];
            const isActive = activeCaseId === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveCaseId(id);
                  setIsSimulated(true);
                }}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#C89758] text-[#2C1810] shadow-xs font-bold'
                    : 'bg-white/10 hover:bg-white/15 text-[#D8CEBD] border border-white/10'
                }`}
              >
                {cs.title.split(':')[0]}
                <span className="opacity-75 font-normal ml-1">
                  · {id === 'orderA' ? 'Accept' : id === 'orderB' ? 'Not Feasible' : 'Hemming'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Details Card */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-[#E8E2D6] shadow-xs space-y-6">
        <div className="border-b border-[#E8E2D6] pb-4">
          <span className="text-xs font-bold text-[#C89758] uppercase tracking-wider">
            {activeCase.subtitle}
          </span>
          <h3 className="font-display text-xl font-bold text-[#2C1810] mt-1">
            {activeCase.title}
          </h3>
          <p className="text-xs text-[#5D4E43] mt-2 leading-relaxed bg-[#FAF7F2] p-4 rounded-lg border border-[#E8E2D6]">
            {activeCase.scenarioDescription}
          </p>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D6] text-xs">
          <div>
            <span className="text-[10px] text-[#8C7B6E] block font-semibold">Garment & Alteration</span>
            <span className="font-bold text-[#2C1810]">{activeCase.orderParams.garment}</span>
            <span className="text-[#7B6A5C] block text-[11px]">{activeCase.orderParams.alteration}</span>
          </div>

          <div>
            <span className="text-[10px] text-[#8C7B6E] block font-semibold">Labor Minutes</span>
            <span className="font-mono font-bold text-[#2C1810] text-sm">
              {activeCase.orderParams.estimatedMinutes} min
            </span>
            <span className="text-[#7B6A5C] block text-[11px]">Skill: {activeCase.orderParams.requiredSkill}</span>
          </div>

          <div>
            <span className="text-[10px] text-[#8C7B6E] block font-semibold">Received Date</span>
            <span className="font-medium text-[#2C1810]">{activeCase.orderParams.dateReceived}</span>
            <span className="text-[#8C7B6E] block text-[11px]">Intake checkpoint</span>
          </div>

          <div>
            <span className="text-[10px] text-[#8C7B6E] block font-semibold">Requested Deadline</span>
            <span className="font-bold text-[#2C1810]">{activeCase.orderParams.requestedPickup}</span>
            {activeCase.orderParams.isRush && (
              <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-1 rounded border border-rose-200 inline-block mt-0.5">
                RUSH ORDER
              </span>
            )}
          </div>
        </div>

        {/* Worker Roster & Mathematical Feasibility Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#2C1810] uppercase tracking-wider">
              Simulation Labor Capacity Matrix
            </h4>
            <span className="text-[11px] text-[#7B6A5C] font-mono">
              Workload % = Committed ÷ Total Available × 100
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8E2D6] text-[#7B6A5C]">
                  <th className="py-2.5 px-3 font-semibold">Tailor Candidate</th>
                  <th className="py-2.5 px-3 font-semibold">Skills Held</th>
                  <th className="py-2.5 px-3 font-semibold">Total Available</th>
                  <th className="py-2.5 px-3 font-semibold">Committed Time</th>
                  <th className="py-2.5 px-3 font-semibold">Remaining Free</th>
                  <th className="py-2.5 px-3 font-semibold">Committed Share</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Feasible?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE1]">
                {activeCase.simulatedWorkers.map((w) => {
                  const isWinningWorker = activeCase.expectedOutcome.assignedWorker.includes(w.name);

                  return (
                    <tr
                      key={w.name}
                      className={
                        isWinningWorker
                          ? 'bg-emerald-50/60 font-semibold'
                          : 'hover:bg-[#FAF7F2]/40'
                      }
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#2C1810]">{w.name}</div>
                        <div className="text-[10px] text-[#7B6A5C]">{w.role}</div>
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3 font-mono text-[#5D4E43]">
                        {w.totalAvailableMinutes}m
                      </td>
                      <td className="py-3 px-3 font-mono text-[#5D4E43]">
                        {w.committedMinutes}m
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#2C1810]">
                        {w.remainingMinutes}m
                      </td>
                      <td className="py-3 px-3 font-mono text-[#2C1810]">
                        {w.workloadPercentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        {w.canAccommodate ? (
                          <span className="text-emerald-800 bg-emerald-100 font-bold text-[10px] px-2 py-0.5 rounded">
                            {isWinningWorker ? '★ Assigned' : 'Eligible'}
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 font-medium text-[10px] px-2 py-0.5 rounded">
                            {!w.isQualified ? 'No Skill' : 'Insufficient Time'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expected Algorithmic Decision Banner */}
        <div
          className={`p-6 rounded-xl border space-y-3 ${
            activeCase.expectedOutcome.decision === 'ACCEPT'
              ? 'bg-emerald-50/80 border-emerald-300'
              : 'bg-amber-50/80 border-amber-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {activeCase.expectedOutcome.decision === 'ACCEPT' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="text-xs uppercase font-bold text-[#7B6A5C] tracking-wider">
                System Recommendation & Quoting Decision
              </div>
              <div className="font-display text-lg font-bold text-[#2C1810]">
                {activeCase.expectedOutcome.decision === 'ACCEPT'
                  ? 'FEASIBLE: PROCEED TO ACCEPT & ASSIGN'
                  : 'NOT FEASIBLE: PROMPT RENEGOTIATION OR DECLINE'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
            <div>
              <span className="text-[10px] text-[#8C7B6E] uppercase font-bold tracking-wider block">
                Quoted Pickup Date
              </span>
              <div className="font-bold text-sm text-[#2C1810] mt-0.5">
                {activeCase.expectedOutcome.quotedDate}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#8C7B6E] uppercase font-bold tracking-wider block">
                Job Assignment
              </span>
              <div className="font-bold text-sm text-[#2C1810] mt-0.5">
                {activeCase.expectedOutcome.assignedWorker}
              </div>
            </div>
          </div>

          <p className="text-xs text-[#4A3B30] leading-relaxed pt-2 border-t border-black/10">
            <strong>System Rationale: </strong>
            {activeCase.expectedOutcome.rationale}
          </p>

          <div className="p-3 bg-white/80 rounded-lg border border-black/5 text-xs text-[#2C1810]">
            <span className="font-bold text-[#C89758] block mb-1">
              Simulation Study Finding:
            </span>
            {activeCase.expectedOutcome.researchInsight}
          </div>
        </div>
      </div>
    </div>
  );
};
