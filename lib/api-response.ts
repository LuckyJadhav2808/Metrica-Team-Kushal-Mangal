import { NextResponse } from "next/server";

export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    timestamp: string;
    version?: string;
    total?: number;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function apiSuccess<T>(
  data: T,
  meta?: Record<string, any>,
  status = 200
): NextResponse<ApiResponseEnvelope<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1",
        ...meta,
      },
    },
    { status }
  );
}

export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  details?: any
): NextResponse<ApiResponseEnvelope<null>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}
