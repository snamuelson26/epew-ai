// =======================================================
// EPEW – EDE – IBOS
// Coach Management Engine
// Coach Workload Service
// =======================================================

import { Coach } from "@/lib/types/coach";

export class CoachWorkloadService {
  /**
   * Percentage workload (0–100)
   */
  static workloadPercentage(coach: Coach): number {
    if (coach.maximumCapacity <= 0) return 0;

    return Math.round(
      (coach.activeEntrepreneurCount / coach.maximumCapacity) * 100
    );
  }

  /**
   * Remaining capacity
   */
  static remainingCapacity(coach: Coach): number {
    return Math.max(
      0,
      coach.maximumCapacity - coach.activeEntrepreneurCount
    );
  }

  /**
   * Can receive automatic assignments
   */
  static canReceiveAssignments(coach: Coach): boolean {
    return (
      coach.status === "available" &&
      coach.acceptsAutomaticAssignments &&
      coach.activeEntrepreneurCount < coach.maximumCapacity
    );
  }

  /**
   * Sort coaches by workload
   */
  static sortByLowestWorkload(
    coaches: Coach[]
  ): Coach[] {
    return [...coaches].sort((a, b) => {
      const aPct = this.workloadPercentage(a);
      const bPct = this.workloadPercentage(b);

      if (aPct !== bPct) {
        return aPct - bPct;
      }

      return (
        a.activeEntrepreneurCount -
        b.activeEntrepreneurCount
      );
    });
  }

  /**
   * Best coach for automatic assignment
   */
  static bestCoach(
    coaches: Coach[]
  ): Coach | null {
    const available = coaches.filter(
      this.canReceiveAssignments
    );

    if (available.length === 0) {
      return null;
    }

    return this.sortByLowestWorkload(
      available
    )[0];
  }
}