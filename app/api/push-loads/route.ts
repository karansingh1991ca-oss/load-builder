import { NextResponse } from "next/server";
import { authHeaders, SHV_API_URL } from "@/lib/config";
import { sanitizeLoads } from "@/lib/sanitize";
import type { ShvPushResponse, WalmartLoad } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawLoads: WalmartLoad[] = body.loads;

    if (!Array.isArray(rawLoads) || rawLoads.length === 0) {
      return NextResponse.json(
        { error: "No loads to push. Fetch loads first." },
        { status: 400 }
      );
    }

    const { sanitized, errors: sanitizeErrors } = sanitizeLoads(rawLoads);

    if (sanitized.length === 0) {
      return NextResponse.json(
        {
          status: "rejected",
          message: "All loads failed sanitization.",
          accepted: [],
          rejected: sanitizeErrors,
        },
        { status: 422 }
      );
    }

    const res = await fetch(SHV_API_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ loads: sanitized }),
    });

    const data = (await res.json().catch(() => null)) as ShvPushResponse | null;

    if (!res.ok) {
      return NextResponse.json(
        {
          ...(data ?? {}),
          sanitizeErrors,
          error: data?.message ?? `SHV API returned ${res.status}`,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      ...data,
      sanitizeErrors,
      sanitizedCount: sanitized.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to push loads" },
      { status: 500 }
    );
  }
}
