/** Approved one-time contribution thresholds; gaps deliberately fail closed. */
export const LUMP_SUM_POLICY_VERSION = "2026-10-15-v1";
export function lumpSumRate(amountCents: number): 6 | 8 | 10 | 12 {
  if (!Number.isSafeInteger(amountCents) || amountCents < 50_000) throw new Error("Minimum one-time support is $500; use whole cents.");
  if (amountCents < 520_000) return 6;
  if (amountCents <= 2_000_000) return 8;
  if (amountCents >= 2_500_000 && amountCents <= 5_000_000) return 10;
  if (amountCents >= 10_000_000) return 12;
  throw new Error("This contribution range requires an approved participation rate before checkout or issuance.");
}

export type LumpSumDocumentRecord = {
  supporterName: string; businessName: string; businessCode: string;
  amountCents: number; currency: "USD"; receivedDate: string; issueDate: string;
  maturityDate: string; certificateNumber: string;
  verifiedReceipt: boolean; approvedForIssue: boolean;
  // Preserve the agreement accepted when payment was made, not today's rate.
  agreement: { policyVersion: string; rate: 6 | 8 | 10 | 12; approved: boolean };
};

export function validateLumpSumIssue(record: LumpSumDocumentRecord) {
  if (!record.verifiedReceipt || !record.approvedForIssue || !record.agreement.approved) throw new Error("Verified receipt and authorized issuance are required.");
  if (record.currency !== "USD") throw new Error("Only USD is configured.");
  for (const value of [record.supporterName,record.businessName,record.businessCode,record.certificateNumber]) if(!value.trim()) throw new Error("Missing document identity.");
  for (const value of [record.receivedDate,record.issueDate,record.maturityDate]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value) throw new Error("Valid dates are required.");
  }
  if (record.issueDate < record.receivedDate || record.maturityDate <= record.receivedDate) throw new Error("Document dates conflict with receipt.");
  if(record.agreement.policyVersion !== LUMP_SUM_POLICY_VERSION) throw new Error("Historical agreement requires its original issuance policy; do not reprice existing support.");
  if(record.agreement.rate !== lumpSumRate(record.amountCents)) throw new Error("Rate does not match the approved agreement policy.");
}
