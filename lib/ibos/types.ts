import type { IBOSStage } from "./stages";
import type { IBOSModule } from "./modules";

export interface IBOSStageRequest {
  entrepreneurId: string;
  requestedStage: IBOSStage;
  requestedBy: string;
  notes?: string;
}

export interface IBOSStageTransition {
  previousStage: IBOSStage | null;
  currentStage: IBOSStage;
  nextStage: IBOSStage | null;
}

export interface IBOSTimelineEvent {
  entrepreneurId: string;
  eventTitle: string;
  eventDescription?: string;
  previousStage: IBOSStage | null;
  currentStage: IBOSStage;
  nextStage: IBOSStage | null;
  createdBy: string;
  createdAt?: string;
}

export interface IBOSModuleAccess {
  entrepreneurId: string;
  moduleName: IBOSModule;
  moduleStatus: "Locked" | "Active";
  activatedAt?: string;
}

export interface IBOSEngineResult {
  success: boolean;
  message: string;
  previousStage?: IBOSStage | null;
  currentStage?: IBOSStage;
  nextStage?: IBOSStage | null;
}