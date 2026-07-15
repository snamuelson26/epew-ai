import "server-only";

import { businessLaunchService } from "@/lib/enterprise/business-launch/createBusinessLaunchService";

import {
  BusinessLaunchApplicationError,
} from "@/lib/enterprise/business-launch/BusinessLaunchApplicationService";

import {
  RepositoryError,
} from "@/lib/enterprise/business-launch/repositories";

import type {
  Business,
  BusinessId,
  FundingApproval,
  LaunchId,
} from "@/lib/enterprise/business-launch/types";

/**
 * This route always reads current Supabase data.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Request body required by POST.
 */
interface CreateLaunchPlanRequest {
  business: Business;
  approval: FundingApproval;
}

/**
 * Standard API success structure.
 */
interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * Standard API error structure.
 */
interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * ============================================================
 * GET
 * ============================================================
 *
 * Supported requests:
 *
 * /api/enterprise/business-launch/plans?launchPlanId=BLP-2026-ABC123
 *
 * or:
 *
 * /api/enterprise/business-launch/plans?businessId=EPEW-26-000001
 */
export async function GET(
  request: Request,
): Promise<Response> {
  try {
    const url = new URL(request.url);

    const launchPlanId =
      url.searchParams
        .get("launchPlanId")
        ?.trim();

    const businessId =
      url.searchParams
        .get("businessId")
        ?.trim();

    if (!launchPlanId && !businessId) {
      return errorResponse(
        400,
        "MISSING_QUERY_PARAMETER",
        "Provide either launchPlanId or businessId.",
      );
    }

    if (launchPlanId && businessId) {
      return errorResponse(
        400,
        "MULTIPLE_QUERY_PARAMETERS",
        "Provide only one identifier: launchPlanId or businessId.",
      );
    }

    if (launchPlanId) {
      const plan =
        await businessLaunchService.getLaunchPlan(
          launchPlanId as LaunchId,
        );

      return successResponse(
        {
          plan,
        },
        200,
      );
    }

    const plan =
      await businessLaunchService.getLaunchPlanByBusinessId(
        businessId as BusinessId,
      );

    return successResponse(
      {
        plan,
      },
      200,
    );
  } catch (error) {
    return handleRouteError(
      error,
      "GET_BUSINESS_LAUNCH_PLAN_FAILED",
    );
  }
}

/**
 * ============================================================
 * POST
 * ============================================================
 *
 * Creates a complete EOS Business Launch Plan.
 *
 * Expected JSON:
 *
 * {
 *   "business": {
 *     ...
 *   },
 *   "approval": {
 *     ...
 *   }
 * }
 */
export async function POST(
  request: Request,
): Promise<Response> {
  try {
    const authorizationFailure =
      authorizeWriteRequest(request);

    if (authorizationFailure) {
      return authorizationFailure;
    }

    const body =
      await readJsonBody<CreateLaunchPlanRequest>(
        request,
      );

    const validationError =
      validateCreateRequest(body);

    if (validationError) {
      return validationError;
    }

    const plan =
      await businessLaunchService.createLaunchPlan(
        body.business,
        body.approval,
      );

    return successResponse(
      {
        message:
          "Business Launch Plan created successfully.",
        plan,
      },
      201,
    );
  } catch (error) {
    return handleRouteError(
      error,
      "CREATE_BUSINESS_LAUNCH_PLAN_FAILED",
    );
  }
}

/**
 * ============================================================
 * WRITE AUTHORIZATION
 * ============================================================
 *
 * POST uses an internal API key because the route operates through
 * the Supabase service-role client.
 *
 * Add this variable to .env.local:
 *
 * EPEW_INTERNAL_API_KEY=your-long-private-random-key
 *
 * Send it in the request:
 *
 * Authorization: Bearer your-long-private-random-key
 *
 * This key must never be exposed in client-side JavaScript.
 */
function authorizeWriteRequest(
  request: Request,
): Response | null {
  const configuredKey =
    process.env.EPEW_INTERNAL_API_KEY;

  if (!configuredKey) {
    return errorResponse(
      503,
      "SERVER_CONFIGURATION_ERROR",
      "EPEW_INTERNAL_API_KEY is not configured.",
    );
  }

  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return errorResponse(
      401,
      "UNAUTHORIZED",
      "Authorization is required.",
    );
  }

  const [scheme, suppliedKey] =
    authorization.split(" ");

  if (
    scheme?.toLowerCase() !== "bearer" ||
    !suppliedKey ||
    !safeEqual(suppliedKey, configuredKey)
  ) {
    return errorResponse(
      401,
      "UNAUTHORIZED",
      "The supplied authorization credential is invalid.",
    );
  }

  return null;
}

/**
 * Prevents straightforward timing comparison differences when
 * validating the internal API key.
 */
function safeEqual(
  first: string,
  second: string,
): boolean {
  if (first.length !== second.length) {
    return false;
  }

  let difference = 0;

  for (
    let index = 0;
    index < first.length;
    index += 1
  ) {
    difference |=
      first.charCodeAt(index) ^
      second.charCodeAt(index);
  }

  return difference === 0;
}

/**
 * ============================================================
 * REQUEST VALIDATION
 * ============================================================
 */
function validateCreateRequest(
  body: CreateLaunchPlanRequest,
): Response | null {
  if (
    !body ||
    typeof body !== "object"
  ) {
    return errorResponse(
      400,
      "INVALID_REQUEST_BODY",
      "The request body must be a JSON object.",
    );
  }

  if (
    !body.business ||
    typeof body.business !== "object"
  ) {
    return errorResponse(
      400,
      "BUSINESS_REQUIRED",
      "A valid business object is required.",
    );
  }

  if (
    !body.approval ||
    typeof body.approval !== "object"
  ) {
    return errorResponse(
      400,
      "FUNDING_APPROVAL_REQUIRED",
      "A valid funding approval object is required.",
    );
  }

  const business =
    body.business as unknown as Record<
      string,
      unknown
    >;

  const approval =
    body.approval as unknown as Record<
      string,
      unknown
    >;

  if (!isNonEmptyString(business.id)) {
    return errorResponse(
      400,
      "BUSINESS_ID_REQUIRED",
      "business.id is required.",
    );
  }

  if (!isNonEmptyString(business.name)) {
    return errorResponse(
      400,
      "BUSINESS_NAME_REQUIRED",
      "business.name is required.",
    );
  }

  if (
    !isNonEmptyString(
      business.entrepreneurId,
    )
  ) {
    return errorResponse(
      400,
      "ENTREPRENEUR_ID_REQUIRED",
      "business.entrepreneurId is required.",
    );
  }

  if (
    !isNonEmptyString(
      business.entrepreneurName,
    )
  ) {
    return errorResponse(
      400,
      "ENTREPRENEUR_NAME_REQUIRED",
      "business.entrepreneurName is required.",
    );
  }

  if (!isNonEmptyString(approval.id)) {
    return errorResponse(
      400,
      "APPROVAL_ID_REQUIRED",
      "approval.id is required.",
    );
  }

  if (
    !isPositiveNumber(
      approval.approvedAmount,
    )
  ) {
    return errorResponse(
      400,
      "INVALID_APPROVED_AMOUNT",
      "approval.approvedAmount must be greater than zero.",
    );
  }

  if (
    !isNonEmptyString(
      approval.approvedAt,
    )
  ) {
    return errorResponse(
      400,
      "APPROVAL_DATE_REQUIRED",
      "approval.approvedAt is required.",
    );
  }

  if (
    Number.isNaN(
      new Date(
        String(approval.approvedAt),
      ).getTime(),
    )
  ) {
    return errorResponse(
      400,
      "INVALID_APPROVAL_DATE",
      "approval.approvedAt must be a valid date.",
    );
  }

  return null;
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isPositiveNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

/**
 * ============================================================
 * JSON PARSING
 * ============================================================
 */
async function readJsonBody<T>(
  request: Request,
): Promise<T> {
  const contentType =
    request.headers.get("content-type");

  if (
    !contentType
      ?.toLowerCase()
      .includes("application/json")
  ) {
    throw new InvalidJsonRequestError(
      "Content-Type must be application/json.",
    );
  }

  try {
    return (await request.json()) as T;
  } catch {
    throw new InvalidJsonRequestError(
      "The request body contains invalid JSON.",
    );
  }
}

/**
 * ============================================================
 * RESPONSES
 * ============================================================
 */
function successResponse<T>(
  data: T,
  status: number,
): Response {
  const response: ApiSuccess<T> = {
    success: true,
    data,
  };

  return Response.json(
    response,
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const response: ApiFailure = {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined
        ? {}
        : {
            details,
          }),
    },
  };

  return Response.json(
    response,
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

function noStoreHeaders(): HeadersInit {
  return {
    "Cache-Control":
      "no-store, max-age=0",
  };
}

/**
 * ============================================================
 * ERROR HANDLING
 * ============================================================
 */
function handleRouteError(
  error: unknown,
  fallbackCode: string,
): Response {
  console.error(
    `[EPEW EOS] ${fallbackCode}`,
    error,
  );

  if (
    error instanceof
    InvalidJsonRequestError
  ) {
    return errorResponse(
      400,
      "INVALID_JSON_REQUEST",
      error.message,
    );
  }

  if (
    error instanceof
    BusinessLaunchApplicationError
  ) {
    const normalizedMessage =
      error.message.toLowerCase();

    if (
      normalizedMessage.includes(
        "already exists",
      )
    ) {
      return errorResponse(
        409,
        "LAUNCH_PLAN_ALREADY_EXISTS",
        error.message,
      );
    }

    if (
      normalizedMessage.includes(
        "was not found",
      ) ||
      normalizedMessage.includes(
        "no business launch plan",
      )
    ) {
      return errorResponse(
        404,
        "LAUNCH_PLAN_NOT_FOUND",
        error.message,
      );
    }

    return errorResponse(
      400,
      "BUSINESS_LAUNCH_APPLICATION_ERROR",
      error.message,
    );
  }

  if (error instanceof RepositoryError) {
    return errorResponse(
      500,
      "BUSINESS_LAUNCH_REPOSITORY_ERROR",
      "The Business Launch Plan could not be processed.",
      process.env.NODE_ENV ===
        "development"
        ? {
            repository:
              error.repository,
            operation:
              error.operation,
            cause:
              error.causeValue,
          }
        : undefined,
    );
  }

  if (error instanceof Error) {
    return errorResponse(
      500,
      fallbackCode,
      process.env.NODE_ENV ===
        "development"
        ? error.message
        : "An unexpected server error occurred.",
    );
  }

  return errorResponse(
    500,
    fallbackCode,
    "An unexpected server error occurred.",
  );
}

/**
 * Error used for malformed JSON requests.
 */
class InvalidJsonRequestError extends Error {
  constructor(message: string) {
    super(message);

    this.name =
      "InvalidJsonRequestError";

    Object.setPrototypeOf(
      this,
      InvalidJsonRequestError.prototype,
    );
  }
}