import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

import {
  BusinessLaunchApplicationService,
} from "./BusinessLaunchApplicationService";

import {
  SupabaseBusinessLaunchUnitOfWork,
} from "./adapters/SupabaseBusinessLaunchUnitOfWork";

/**
 * Creates the server-side EOS Business Launch service.
 *
 * This is the official connection between:
 *
 * API routes / Server actions
 *              ↓
 * BusinessLaunchApplicationService
 *              ↓
 * SupabaseBusinessLaunchUnitOfWork
 *              ↓
 * Supabase PostgreSQL
 *
 * Never import this file into a client component because it uses the
 * Supabase service-role client.
 */
export function createBusinessLaunchService():
  BusinessLaunchApplicationService {
  const unitOfWork =
    new SupabaseBusinessLaunchUnitOfWork(
      supabaseAdmin,
    );

  return new BusinessLaunchApplicationService(
    unitOfWork,
  );
}

/**
 * Shared server-side service instance.
 *
 * Safe places to import:
 * - API routes
 * - Server actions
 * - Server components
 * - Background jobs
 */
export const businessLaunchService =
  createBusinessLaunchService();