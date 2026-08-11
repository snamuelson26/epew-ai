import { supabaseAdmin } from "@/lib/supabaseAdmin";

const GOVERNMENT_ID_BUCKET = "entrepreneur-government-ids";
const SELFIE_BUCKET = "entrepreneur-selfies";

const MAX_GOVERNMENT_ID_SIZE = 10 * 1024 * 1024;
const MAX_SELFIE_SIZE = 6 * 1024 * 1024;

const GOVERNMENT_ID_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const SELFIE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type VerificationDocumentPaths = {
  governmentIdPath: string;
  selfieVerificationPath: string;
};

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

function createStoragePath(
  userId: string,
  documentType: "government-id" | "selfie",
  fileName: string,
): string {
  const safeFileName = sanitizeFileName(fileName);
  const uniqueId = crypto.randomUUID();

  return `${userId}/${documentType}-${uniqueId}-${safeFileName}`;
}

export function validateVerificationDocuments(
  governmentId: File | null,
  selfie: File | null,
): void {
  if (!governmentId || governmentId.size === 0) {
    throw new Error(
      "A valid government-issued identification document is required.",
    );
  }

  if (!selfie || selfie.size === 0) {
    throw new Error("A selfie verification photo is required.");
  }

  if (!GOVERNMENT_ID_TYPES.has(governmentId.type)) {
    throw new Error(
      "Government ID must be a JPEG, PNG, WEBP, or PDF file.",
    );
  }

  if (!SELFIE_TYPES.has(selfie.type)) {
    throw new Error(
      "Selfie verification must be a JPEG, PNG, or WEBP image.",
    );
  }

  if (governmentId.size > MAX_GOVERNMENT_ID_SIZE) {
    throw new Error("Government ID must be no larger than 10 MB.");
  }

  if (selfie.size > MAX_SELFIE_SIZE) {
    throw new Error(
      "Selfie verification photo must be no larger than 6 MB.",
    );
  }
}

export async function uploadVerificationDocuments(
  userId: string,
  governmentId: File,
  selfie: File,
): Promise<VerificationDocumentPaths> {
  validateVerificationDocuments(governmentId, selfie);

  const governmentIdPath = createStoragePath(
    userId,
    "government-id",
    governmentId.name,
  );

  const selfieVerificationPath = createStoragePath(
    userId,
    "selfie",
    selfie.name,
  );

  const governmentIdBuffer = Buffer.from(
    await governmentId.arrayBuffer(),
  );

  const selfieBuffer = Buffer.from(
    await selfie.arrayBuffer(),
  );

  const { error: governmentIdError } =
    await supabaseAdmin.storage
      .from(GOVERNMENT_ID_BUCKET)
      .upload(governmentIdPath, governmentIdBuffer, {
        contentType: governmentId.type,
        cacheControl: "3600",
        upsert: false,
      });

  if (governmentIdError) {
    throw new Error(
      `Unable to upload government ID: ${governmentIdError.message}`,
    );
  }

  const { error: selfieError } =
    await supabaseAdmin.storage
      .from(SELFIE_BUCKET)
      .upload(selfieVerificationPath, selfieBuffer, {
        contentType: selfie.type,
        cacheControl: "3600",
        upsert: false,
      });

  if (selfieError) {
    await supabaseAdmin.storage
      .from(GOVERNMENT_ID_BUCKET)
      .remove([governmentIdPath]);

    throw new Error(
      `Unable to upload selfie verification: ${selfieError.message}`,
    );
  }

  return {
    governmentIdPath,
    selfieVerificationPath,
  };
}

export async function removeVerificationDocuments(
  paths: Partial<VerificationDocumentPaths>,
): Promise<void> {
  const cleanupTasks: Promise<unknown>[] = [];

  if (paths.governmentIdPath) {
    cleanupTasks.push(
      supabaseAdmin.storage
        .from(GOVERNMENT_ID_BUCKET)
        .remove([paths.governmentIdPath]),
    );
  }

  if (paths.selfieVerificationPath) {
    cleanupTasks.push(
      supabaseAdmin.storage
        .from(SELFIE_BUCKET)
        .remove([paths.selfieVerificationPath]),
    );
  }

  await Promise.allSettled(cleanupTasks);
}
