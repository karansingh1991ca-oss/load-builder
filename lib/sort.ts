import type { ShvLoad, WalmartLoad } from "./types";

/**
 * Example: "LD-3262360" → 3262360
 */
export function loadNumberValue(loadNo: string): number {
  const match = loadNo.trim().match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Sort loads in increasing order of load number (LD-3262360 before LD-3262361).
 * Used for both fetch display and sequential push.
 */
export function sortLoadsSequential(loads: WalmartLoad[]): WalmartLoad[] {
  return [...loads].sort(
    (a, b) => loadNumberValue(a.load_no) - loadNumberValue(b.load_no)
  );
}

/** Sort sanitized SHV loads by load_number the same way. */
export function sortShvLoadsSequential(loads: ShvLoad[]): ShvLoad[] {
  return [...loads].sort(
    (a, b) => loadNumberValue(a.load_number) - loadNumberValue(b.load_number)
  );
}

/** @deprecated Use sortLoadsSequential */
export const sortLoadsFifo = sortLoadsSequential;
