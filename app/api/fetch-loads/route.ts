import { NextResponse } from "next/server";
import { authHeaders, WALMART_API_URL } from "@/lib/config";
import type { WalmartResponse } from "@/lib/types";

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

    return NextResponse.json(data as WalmartResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch loads" },
      { status: 500 }
    );
  }
}
