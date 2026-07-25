/**
 * PUSH-LOADS API ROUTE
 * ====================
 * Called when the user clicks "Sanitize & Push".
 *
 * Each load is pushed ONE AT A TIME to SHV, in sequential order.
 * We never send a batch — each record waits for the previous one to finish.
 */

import { NextResponse } from "next/server";
import { authHeaders, SHV_API_URL } from "@/lib/config";
import { sanitizeLoad, sortLoadsSequential } from "@/lib/sanitize";
import type { ShvLoad, ShvPushResponse, WalmartLoad } from "@/lib/types";

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

    // Work through loads in sequential order (oldest ship date first)
    const ordered = sortLoadsSequential(rawLoads);

    const accepted: string[] = [];
    const rejected: Array<{ load_number: string; errors: string[] }> = [];
    const pushedLoads: ShvLoad[] = [];
    const sanitizeErrors: Array<{ load_number: string; errors: string[] }> = [];

    // Push each load individually — wait for one to finish before starting the next
    for (const rawLoad of ordered) {
      let sanitized: ShvLoad;

      try {
        sanitized = sanitizeLoad(rawLoad);
      } catch (err) {
        sanitizeErrors.push({
          load_number: rawLoad.load_no || "unknown",
          errors: [err instanceof Error ? err.message : String(err)],
        });
        continue;
      }

      const res = await fetch(SHV_API_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ load: sanitized }),
      });

      const data = (await res.json().catch(() => null)) as ShvPushResponse | null;

      if (res.ok && data) {
        if (data.accepted?.length) {
          accepted.push(...data.accepted);
          pushedLoads.push(sanitized);
        }
        if (data.rejected?.length) {
          rejected.push(...data.rejected);
        }
      } else if (data?.rejected?.length) {
        rejected.push(...data.rejected);
      } else {
        rejected.push({
          load_number: sanitized.load_number,
          errors: [data?.message ?? `SHV API returned ${res.status}`],
        });
      }
    }

    if (pushedLoads.length === 0 && rejected.length === 0 && sanitizeErrors.length > 0) {
      return NextResponse.json(
        {
          status: "rejected",
          message: "All loads failed sanitization.",
          accepted: [],
          rejected: sanitizeErrors,
          pushedLoads: [],
          sanitizeErrors,
        },
        { status: 422 }
      );
    }

    const allRejected = [...sanitizeErrors, ...rejected];
    const message =
      pushedLoads.length > 0
        ? `${pushedLoads.length} load(s) pushed to SHV TMS in sequential order.`
        : "No loads were accepted by SHV.";

    return NextResponse.json({
      status:
        allRejected.length > 0 && pushedLoads.length > 0
          ? "partial"
          : pushedLoads.length > 0
            ? "ok"
            : "rejected",
      message,
      accepted,
      rejected,
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
