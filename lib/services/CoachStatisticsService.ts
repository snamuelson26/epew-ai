// =======================================================
// EPEW – EDE – IBOS
// Coach Management Engine
// Coach Statistics Service
// =======================================================

import {
  Coach,
  CoachStatistics,
} from "@/lib/types/coach";

export class CoachStatisticsService {
  static build(
    coaches: Coach[]
  ): CoachStatistics {
    return {
      totalCoaches: coaches.length,

      available: coaches.filter(
        c => c.status === "available"
      ).length,

      busy: coaches.filter(
        c => c.status === "busy"
      ).length,

      away: coaches.filter(
        c => c.status === "away"
      ).length,

      inactive: coaches.filter(
        c => c.status === "inactive"
      ).length,

      totalAssignments:
        coaches.reduce(
          (sum, c) =>
            sum + c.activeEntrepreneurCount,
          0
        ),

      activeAssignments:
        coaches.reduce(
          (sum, c) =>
            sum + c.activeEntrepreneurCount,
          0
        ),

      completedAssignments: 0,

      averageCommunicationScore:
        coaches.length === 0
          ? 0
          : coaches.reduce(
              (sum, c) =>
                sum +
                (c.averageCommunicationScore ?? 0),
              0
            ) / coaches.length,

      averageRelationshipScore:
        coaches.length === 0
          ? 0
          : coaches.reduce(
              (sum, c) =>
                sum +
                (c.averageRelationshipScore ?? 0),
              0
            ) / coaches.length,
    };
  }
}