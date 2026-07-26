// =======================================================
// EPEW – EDE – IBOS
// Qualification Workflow Service
//
// Thin wrapper around the
// Entrepreneur Lifecycle Orchestrator
// =======================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { EntrepreneurLifecycleOrchestrator } from "./workflows/EntrepreneurLifecycleOrchestrator";

export class QualificationWorkflowService {
  private readonly orchestrator:
    EntrepreneurLifecycleOrchestrator;

  constructor(
    private readonly supabase: SupabaseClient
  ) {
    this.orchestrator =
      new EntrepreneurLifecycleOrchestrator(
        supabase
      );
  }

  async qualifyEntrepreneur(
    entrepreneurId: string
  ) {
    return this.orchestrator.qualify(
      entrepreneurId
    );
  }
}