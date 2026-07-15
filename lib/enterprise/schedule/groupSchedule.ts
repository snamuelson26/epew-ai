/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * ------------------------------------------------------------
 * Enterprise Schedule Engine
 *
 * Official Financial Calendar
 *
 * This engine governs every official application date
 * throughout the Entrepreneur Development Ecosystem.
 *
 * IMPORTANT
 * ----------
 * Money may be received at any time.
 * Money is officially applied only according to the
 * EPEW Group Financial Calendar.
 * ============================================================
 */

export type ContributionStatus =
  | "received"
  | "released"
  | "pending_application"
  | "applied"
  | "failed"
  | "cancelled"
  | "refunded";

export interface GroupSchedule {
  groupId: string;
  groupName: string;

  annualMeetingDate: Date;

  announcementDate: Date;

  applicationStartDate: Date;

  status:
    | "scheduled"
    | "announced"
    | "active"
    | "completed";
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * ------------------------------------------------------------
 * Announcement
 * One week before Annual Meeting
 * ------------------------------------------------------------
 */

export function getAnnouncementDate(
  annualMeetingDate: Date
): Date {
  return new Date(
    annualMeetingDate.getTime() - 7 * DAY
  );
}

/**
 * ------------------------------------------------------------
 * Official Application Start
 *
 * Default:
 * Same day as Annual Meeting.
 *
 * Can later be configured differently.
 * ------------------------------------------------------------
 */

export function getApplicationStartDate(
  annualMeetingDate: Date
): Date {
  return new Date(annualMeetingDate);
}

/**
 * ------------------------------------------------------------
 * Group Schedule
 * ------------------------------------------------------------
 */

export function getGroupSchedule(
  groupId: string,
  groupName: string,
  annualMeetingDate: Date
): GroupSchedule {
  return {
    groupId,

    groupName,

    annualMeetingDate,

    announcementDate:
      getAnnouncementDate(annualMeetingDate),

    applicationStartDate:
      getApplicationStartDate(
        annualMeetingDate
      ),

    status: "scheduled",
  };
}

/**
 * ------------------------------------------------------------
 * Weekly Contributions
 *
 * Always applied on Monday.
 * ------------------------------------------------------------
 */

export function getNextWeeklyApplication(
  fromDate: Date = new Date()
): Date {
  const date = new Date(fromDate);

  const day = date.getDay();

  const daysUntilMonday =
    day === 1 ? 7 : (8 - day) % 7;

  date.setDate(
    date.getDate() + daysUntilMonday
  );

  date.setHours(0, 0, 0, 0);

  return date;
}

/**
 * ------------------------------------------------------------
 * Monthly Contributions
 *
 * Always applied
 * first day of next month.
 * ------------------------------------------------------------
 */

export function getNextMonthlyApplication(
  fromDate: Date = new Date()
): Date {
  return new Date(
    fromDate.getFullYear(),
    fromDate.getMonth() + 1,
    1
  );
}

/**
 * ------------------------------------------------------------
 * Annual Renewal
 * ------------------------------------------------------------
 */

export function getAnnualRenewal(
  applicationStartDate: Date
): Date {
  return new Date(
    applicationStartDate.getFullYear() + 1,
    applicationStartDate.getMonth(),
    applicationStartDate.getDate()
  );
}

/**
 * ------------------------------------------------------------
 * Is today an official application date?
 * ------------------------------------------------------------
 */

export function isApplicationDate(
  today: Date,
  applicationDate: Date
): boolean {
  return (
    today.getFullYear() ===
      applicationDate.getFullYear() &&
    today.getMonth() ===
      applicationDate.getMonth() &&
    today.getDate() ===
      applicationDate.getDate()
  );
}

/**
 * ------------------------------------------------------------
 * Announcement Week
 * ------------------------------------------------------------
 */

export function isAnnouncementWeek(
  today: Date,
  annualMeetingDate: Date
): boolean {
  const announcement =
    getAnnouncementDate(
      annualMeetingDate
    );

  return (
    today >= announcement &&
    today <= annualMeetingDate
  );
}

/**
 * ------------------------------------------------------------
 * Group Active
 * ------------------------------------------------------------
 */

export function isGroupActive(
  today: Date,
  applicationStartDate: Date
): boolean {
  return today >= applicationStartDate;
}

/**
 * ------------------------------------------------------------
 * Contribution Status
 * ------------------------------------------------------------
 */

export function getContributionStatus(
  received: boolean,
  released: boolean,
  applied: boolean,
  failed: boolean,
  cancelled: boolean,
  refunded: boolean
): ContributionStatus {
  if (failed) return "failed";

  if (cancelled) return "cancelled";

  if (refunded) return "refunded";

  if (applied) return "applied";

  if (released) return "pending_application";

  if (received) return "released";

  return "received";
}