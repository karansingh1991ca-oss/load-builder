/**
 * FETCH-LOADS API ROUTE
 * Returns raw Walmart tenders sorted by increasing load number.
 */

import { NextResponse } from "next/server";
import { authHeaders, WALMART_API_URL } from "@/lib/config";
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
    const ordered = sortLoadsSequential(result.loads ?? []);

    const response: FetchResponse = {
      source: result.source,
      count: ordered.length,
      loads: ordered,
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch loads" },
      { status: 500 }
    );
  }
}
