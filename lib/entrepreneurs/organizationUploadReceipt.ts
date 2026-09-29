import { createHmac, timingSafeEqual } from "node:crypto";

export type OrganizationDocument = {
  bucket: "entrepreneur-government-ids" | "entrepreneur-selfies";
  path: string;
  size: number;
  type: string;
};
export type OrganizationUploadReceipt = {
  userId: string;
  email: string;
  expires: number;
  names: string[];
  documents: OrganizationDocument[];
};

function signature(payload: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Document upload configuration is unavailable.");
  return createHmac("sha256", key).update(`organization-upload-v1:${payload}`).digest();
}

export function signUploadReceipt(receipt: OrganizationUploadReceipt): string {
  const payload = Buffer.from(JSON.stringify(receipt)).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
}

export function verifyUploadReceipt(token: string): OrganizationUploadReceipt {
  const [payload, encodedSignature, extra] = token.split(".");
  if (!payload || !encodedSignature || extra) throw new Error("Invalid document upload receipt.");
  const supplied = Buffer.from(encodedSignature, "base64url");
  const expected = signature(payload);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error("Invalid document upload receipt.");
  }
  const receipt = JSON.parse(Buffer.from(payload, "base64url").toString()) as OrganizationUploadReceipt;
  if (receipt.expires < Date.now()) throw new Error("Document uploads expired. Please submit again.");
  return receipt;
}

export function validateDocumentMetadata(size: unknown, type: unknown, selfie: boolean): asserts size is number {
  const types = selfie ? ["image/jpeg", "image/png", "image/webp"] : ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (typeof size !== "number" || !Number.isInteger(size) || size <= 0 || size > (selfie ? 6 : 10) * 1024 * 1024 || typeof type !== "string" || !types.includes(type)) {
    throw new Error(selfie ? "Each selfie must be a JPEG, PNG, or WEBP image up to 6 MB." : "Each government ID must be a JPEG, PNG, WEBP, or PDF file up to 10 MB.");
  }
}
