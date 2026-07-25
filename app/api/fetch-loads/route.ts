/**
 * FETCH-LOADS API ROUTE
 * =====================
 * Called when the user clicks "Fetch Loads".
 * This runs on the server (not in the browser) so we can safely attach
 * the auth token without exposing it to the user's screen.
 *
 * Flow: Browser → this route → Walmart API → returns raw tenders
 */

import { NextResponse } from "next/server";
import { authHeaders, WALMART_API_URL } from "@/lib/config";
import { sortLoadsFifo } from "@/lib/sanitize";
import type { WalmartResponse } from "@/lib/types";

export async function GET() {
  try {
    // Call the Walmart portal with our authenticated email
    const res = await fetch(WALMART_API_URL, {
      headers: authHeaders(),
      cache: "no-store", // always get fresh data, never use a cached copy
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

    // Sort oldest-first (FIFO) so the UI and later push follow correct order
    result.loads = sortLoadsFifo(result.loads ?? []);
    result.count = result.loads.length;

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch loads" },
      { status: 500 }
    );
  }
}
