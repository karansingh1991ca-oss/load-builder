/**
 * PUSH-LOADS API ROUTE
 * ====================
 * Called when the user clicks "Sanitize & Push".
 *
 * Flow:
 *   1. Receive raw Walmart tenders from the browser
 *   2. Sanitize each one (convert formats, trim spaces, map fields)
 *   3. POST the cleaned records to the SHV TMS API
 *   4. Return which loads were accepted/rejected + the pushed data for display
 */

import { NextResponse } from "next/server";
import { authHeaders, SHV_API_URL } from "@/lib/config";
import { sanitizeLoads } from "@/lib/sanitize";
import type { PushResult, ShvPushResponse, WalmartLoad } from "@/lib/types";

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

    // Step 1: Clean and convert each Walmart record → SHV format (FIFO order)
    const { sanitized, errors: sanitizeErrors } = sanitizeLoads(rawLoads);

    if (sanitized.length === 0) {
      return NextResponse.json(
        {
          status: "rejected",
          message: "All loads failed sanitization.",
          accepted: [],
          rejected: sanitizeErrors,
          pushedLoads: [],
        },
        { status: 422 }
      );
    }

    // Step 2: Send the sanitized batch to SHV TMS
    const res = await fetch(SHV_API_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ loads: sanitized }),
    });

    const data = (await res.json().catch(() => null)) as ShvPushResponse | null;

    // Build the list of successfully pushed loads for the UI to display
    const acceptedNumbers = new Set(data?.accepted ?? []);
    const pushedLoads = sanitized.filter((load) =>
      acceptedNumbers.has(load.load_number)
    );

    if (!res.ok) {
      return NextResponse.json(
        {
          ...(data ?? {}),
          sanitizeErrors,
          pushedLoads,
          error: data?.message ?? `SHV API returned ${res.status}`,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      status: data?.status ?? "ok",
      message: data?.message ?? "",
      accepted: data?.accepted ?? [],
      rejected: data?.rejected ?? [],
      sanitizeErrors,
      pushedLoads,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to push loads" },
      { status: 500 }
    );
  }
}
