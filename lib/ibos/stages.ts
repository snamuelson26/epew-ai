export const IBOS_STAGES = {
  APPLICATION_SUBMITTED: "application_submitted",
  APPLICATION_REVIEWED: "application_reviewed",
  ORIENTATION_SCHEDULED: "orientation_scheduled",
  ORIENTATION_COMPLETED: "orientation_completed",
  QUALIFIED: "qualified",
  APPROVED: "approved",
  ANNUAL_MEETING_PENDING: "annual_meeting_pending",
  ANNUAL_MEETING_COMPLETED: "annual_meeting_completed",
  FUNDING_QUEUE: "funding_queue",
  FUNDING_APPROVED: "funding_approved",
  BUSINESS_PREPARATION: "business_preparation",
  BUSINESS_OPENING: "business_opening",
  BUSINESS_OPENED: "business_opened",
  ACTIVE_BUSINESS: "active_business",
  QUARTERLY_REPORTING: "quarterly_reporting",
} as const;

export type IBOSStage =
  (typeof IBOS_STAGES)[keyof typeof IBOS_STAGES];

export const IBOS_STAGE_ORDER: IBOSStage[] = [
  IBOS_STAGES.APPLICATION_SUBMITTED,
  IBOS_STAGES.APPLICATION_REVIEWED,
  IBOS_STAGES.ORIENTATION_SCHEDULED,
  IBOS_STAGES.ORIENTATION_COMPLETED,
  IBOS_STAGES.QUALIFIED,
  IBOS_STAGES.APPROVED,
  IBOS_STAGES.ANNUAL_MEETING_PENDING,
  IBOS_STAGES.ANNUAL_MEETING_COMPLETED,
  IBOS_STAGES.FUNDING_QUEUE,
  IBOS_STAGES.FUNDING_APPROVED,
  IBOS_STAGES.BUSINESS_PREPARATION,
  IBOS_STAGES.BUSINESS_OPENING,
  IBOS_STAGES.BUSINESS_OPENED,
  IBOS_STAGES.ACTIVE_BUSINESS,
  IBOS_STAGES.QUARTERLY_REPORTING,
];

export const IBOS_STAGE_LABELS: Record<IBOSStage, string> = {
  [IBOS_STAGES.APPLICATION_SUBMITTED]: "Application Submitted",
  [IBOS_STAGES.APPLICATION_REVIEWED]: "Application Reviewed",
  [IBOS_STAGES.ORIENTATION_SCHEDULED]: "Orientation Scheduled",
  [IBOS_STAGES.ORIENTATION_COMPLETED]: "Orientation Completed",
  [IBOS_STAGES.QUALIFIED]: "Qualified",
  [IBOS_STAGES.APPROVED]: "Approved",
  [IBOS_STAGES.ANNUAL_MEETING_PENDING]: "Annual Meeting Pending",
  [IBOS_STAGES.ANNUAL_MEETING_COMPLETED]: "Annual Meeting Completed",
  [IBOS_STAGES.FUNDING_QUEUE]: "Funding Queue",
  [IBOS_STAGES.FUNDING_APPROVED]: "Funding Approved",
  [IBOS_STAGES.BUSINESS_PREPARATION]: "Business Preparation",
  [IBOS_STAGES.BUSINESS_OPENING]: "Business Opening",
  [IBOS_STAGES.BUSINESS_OPENED]: "Business Opened",
  [IBOS_STAGES.ACTIVE_BUSINESS]: "Active Business",
  [IBOS_STAGES.QUARTERLY_REPORTING]: "Quarterly Reporting",
};

export function getNextIBOSStage(currentStage: IBOSStage): IBOSStage | null {
  const index = IBOS_STAGE_ORDER.indexOf(currentStage);

  if (index === -1) return null;
  if (index >= IBOS_STAGE_ORDER.length - 1) return null;

  return IBOS_STAGE_ORDER[index + 1];
}

export function getPreviousIBOSStage(currentStage: IBOSStage): IBOSStage | null {
  const index = IBOS_STAGE_ORDER.indexOf(currentStage);

  if (index <= 0) return null;

  return IBOS_STAGE_ORDER[index - 1];
}

export function isValidIBOSStage(stage: string): stage is IBOSStage {
  return IBOS_STAGE_ORDER.includes(stage as IBOSStage);
}