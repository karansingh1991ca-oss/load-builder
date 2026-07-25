/**
 * FETCH-LOADS API ROUTE
 * =====================
 * Called when the user clicks "Fetch Loads".
 * Pulls from Walmart, sorts by load number (lowest first), sanitizes,
 * and returns the SHV-ready records for display.
 */

import { NextResponse } from "next/server";
import { authHeaders, WALMART_API_URL } from "@/lib/config";
import { sanitizeLoads } from "@/lib/sanitize";
import { sortLoadsSequential } from "@/lib/sort";
import type { FetchResponse, WalmartResponse } from "@/lib/types";

export async function GET() {
  try {
    const res = await fetch(WALMART_API_URL, {
      headers: authHeaders(),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.message ?? `Walmart API returned ${res.status}`,
          status: res.status,
        },
        { status: res.status }
      );
    }

    const result = data as WalmartResponse;

    // Sort by increasing load number, then sanitize for display
    const ordered = sortLoadsSequential(result.loads ?? []);
    const { sanitized, errors } = sanitizeLoads(ordered);

    const response: FetchResponse = {
      source: result.source,
      count: sanitized.length,
      loads: sanitized,
      rawLoads: ordered,
      sanitizeErrors: errors,
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch loads" },
      { status: 500 }
    );
  }
}
