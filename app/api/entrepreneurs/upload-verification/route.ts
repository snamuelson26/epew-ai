import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

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

function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File;
}

export async function POST(request: Request) {
  let uploadedGovernmentIdPath = "";
  let uploadedSelfiePath = "";

  try {
    const formData = await request.formData();

    const userIdEntry = formData.get("userId");
    const governmentIdEntry = formData.get("governmentId");
    const selfieEntry = formData.get("selfie");

    const userId =
      typeof userIdEntry === "string" ? userIdEntry.trim() : "";

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_USER_ID",
            message: "The entrepreneur user ID is required.",
          },
        },
        { status: 400 },
      );
    }

    if (!isFile(governmentIdEntry) || governmentIdEntry.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_GOVERNMENT_ID",
            message: "A government ID document is required.",
          },
        },
        { status: 400 },
      );
    }

    if (!isFile(selfieEntry) || selfieEntry.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_SELFIE",
            message: "A selfie verification photo is required.",
          },
        },
        { status: 400 },
      );
    }

    if (!GOVERNMENT_ID_TYPES.has(governmentIdEntry.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_GOVERNMENT_ID_TYPE",
            message:
              "Government ID must be a JPEG, PNG, WEBP, or PDF file.",
          },
        },
        { status: 400 },
      );
    }

    if (!SELFIE_TYPES.has(selfieEntry.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SELFIE_TYPE",
            message:
              "Selfie verification must be a JPEG, PNG, or WEBP image.",
          },
        },
        { status: 400 },
      );
    }

    if (governmentIdEntry.size > MAX_GOVERNMENT_ID_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GOVERNMENT_ID_TOO_LARGE",
            message: "Government ID must be no larger than 10 MB.",
          },
        },
        { status: 400 },
      );
    }

    if (selfieEntry.size > MAX_SELFIE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SELFIE_TOO_LARGE",
            message:
              "Selfie verification photo must be no larger than 6 MB.",
          },
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    uploadedGovernmentIdPath = createStoragePath(
      userId,
      "government-id",
      governmentIdEntry.name,
    );

    uploadedSelfiePath = createStoragePath(
      userId,
      "selfie",
      selfieEntry.name,
    );

    const governmentIdBuffer = Buffer.from(
      await governmentIdEntry.arrayBuffer(),
    );

    const selfieBuffer = Buffer.from(
      await selfieEntry.arrayBuffer(),
    );

    const { error: governmentIdError } =
      await supabaseAdmin.storage
        .from(GOVERNMENT_ID_BUCKET)
        .upload(uploadedGovernmentIdPath, governmentIdBuffer, {
          contentType: governmentIdEntry.type,
          cacheControl: "3600",
          upsert: false,
        });

    if (governmentIdError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GOVERNMENT_ID_UPLOAD_FAILED",
            message: governmentIdError.message,
          },
        },
        { status: 500 },
      );
    }

    const { error: selfieError } = await supabaseAdmin.storage
      .from(SELFIE_BUCKET)
      .upload(uploadedSelfiePath, selfieBuffer, {
        contentType: selfieEntry.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (selfieError) {
      await supabaseAdmin.storage
        .from(GOVERNMENT_ID_BUCKET)
        .remove([uploadedGovernmentIdPath]);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SELFIE_UPLOAD_FAILED",
            message: selfieError.message,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          governmentIdPath: uploadedGovernmentIdPath,
          selfieVerificationPath: uploadedSelfiePath,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Entrepreneur verification upload failed:", error);

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data: buckets, error: bucketListError } =
  await supabaseAdmin.storage.listBuckets();

if (bucketListError) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "BUCKET_LIST_FAILED",
        message: bucketListError.message,
      },
    },
    { status: 500 },
  );
}

const availableBucketNames =
  buckets?.map((bucket) => bucket.name) ?? [];

console.log("Available buckets:", availableBucketNames);

if (
  !availableBucketNames.includes(GOVERNMENT_ID_BUCKET) ||
  !availableBucketNames.includes(SELFIE_BUCKET)
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "REQUIRED_BUCKETS_NOT_FOUND",
        message: `Available buckets: ${
          availableBucketNames.join(", ") || "none"
        }. Required buckets: ${GOVERNMENT_ID_BUCKET}, ${SELFIE_BUCKET}.`,
      },
    },
    { status: 500 },
  );
}

      if (uploadedGovernmentIdPath) {
        await supabaseAdmin.storage
          .from(GOVERNMENT_ID_BUCKET)
          .remove([uploadedGovernmentIdPath]);
      }

      if (uploadedSelfiePath) {
        await supabaseAdmin.storage
          .from(SELFIE_BUCKET)
          .remove([uploadedSelfiePath]);
      }
    } catch (cleanupError) {
      console.error(
        "Unable to clean up uploaded verification files:",
        cleanupError,
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPLOAD_REQUEST_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Unable to upload verification documents.",
        },
      },
      { status: 500 },
    );
  }
}
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: buckets, error } =
      await supabaseAdmin.storage.listBuckets();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          connectedUrl:
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "missing",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      connectedUrl:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "missing",
      buckets:
        buckets?.map((bucket) => ({
          id: bucket.id,
          name: bucket.name,
          public: bucket.public,
        })) ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to inspect storage buckets.",
      },
      { status: 500 },
    );
  }
}