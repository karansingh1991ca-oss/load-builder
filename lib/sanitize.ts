/**
 * SANITIZE.TS — Data cleaning & conversion layer
 * ================================================
 * Walmart and SHV use different field names and formats for the same information.
 * This file converts each Walmart tender into the exact shape SHV expects.
 *
 * Think of it like translating a form from one company's layout to another's.
 */

import type { SanitizeResult, ShvLoad, WalmartLoad } from "./types";

/**
 * Sort loads into sequential processing order (FIFO).
 * Oldest ship date goes first — each record is pulled and pushed in this order.
 */
export function sortLoadsSequential(loads: WalmartLoad[]): WalmartLoad[] {
  return [...loads].sort((a, b) => {
    const dateCompare = a.shp_dt.trim().localeCompare(b.shp_dt.trim());
    if (dateCompare !== 0) return dateCompare;
    return a.load_no.localeCompare(b.load_no);
  });
}

/** @deprecated Use sortLoadsSequential — kept for clarity in older imports */
export const sortLoadsFifo = sortLoadsSequential;

/**
 * Convert a Walmart date (MMDDYYYY) into SHV format (DDMMYYYY).
 * Example: Walmart "07152026" (July 15) → SHV "15072026" (15 July)
 */
export function convertDate(mmddyyyy: string): string {
  const cleaned = mmddyyyy.trim();
  if (!/^\d{8}$/.test(cleaned)) {
    throw new Error(
      `Invalid date "${mmddyyyy}" — expected 8 digits in MMDDYYYY format`
    );
  }
  const mm = cleaned.slice(0, 2); // month
  const dd = cleaned.slice(2, 4); // day
  const yyyy = cleaned.slice(4, 8); // year
  return `${dd}${mm}${yyyy}`; // SHV wants day first
}

/**
 * Turn a weight string like "41,860 lbs" into a plain number: 41860.
 * SHV rejects commas, units, or quoted numbers.
 */
export function parseWeight(wgt: string | null): number {
  if (!wgt || !wgt.trim()) {
    throw new Error("Weight is missing");
  }
  const digits = wgt.replace(/[^\d]/g, ""); // strip everything except digits
  if (!digits) {
    throw new Error(`Cannot parse weight from "${wgt}"`);
  }
  const weight = parseInt(digits, 10);
  if (weight <= 0) {
    throw new Error(`Weight must be a positive whole number, got ${weight}`);
  }
  return weight;
}

/**
 * Map Walmart "mode" to SHV "equipment_type".
 *
 * Business rule (per your requirements):
 *   AMBIENT  →  Dry Van 53'   (room-temperature trailer)
 *   FREEZER  →  Reefer 53'    (refrigerated trailer)
 */
export function mapEquipmentType(
  mode: string
): "Reefer 53'" | "Dry Van 53'" {
  const normalized = mode.trim().toUpperCase();

  if (normalized === "FREEZER") {
    return "Reefer 53'";
  }

  if (normalized === "AMBIENT") {
    return "Dry Van 53'";
  }

  // Fallback for unexpected mode values — treat unknown as ambient/dry van
  return "Dry Van 53'";
}

/** Remove leading/trailing spaces and validate a required text field. */
function trimField(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }
  if (trimmed.length > 200) {
    throw new Error(`${fieldName} exceeds 200 characters`);
  }
  return trimmed;
}

/**
 * Convert ONE Walmart tender record into ONE SHV load record.
 * Each field on the left (Walmart name) maps to the right (SHV name).
 */
export function sanitizeLoad(load: WalmartLoad): ShvLoad {
  return {
    load_number: trimField(load.load_no, "load_number"),
    bol_number: trimField(load.frt_ord_no, "bol_number"),
    shipper_name: trimField(load.shipper_nm, "shipper_name"),
    origin_city: trimField(load.orig_city, "origin_city"),
    origin_state: trimField(load.orig_st, "origin_state"),
    destination_city: trimField(load.dest_city, "destination_city"),
    destination_state: trimField(load.dest_st, "destination_state"),
    ship_date: convertDate(load.shp_dt),
    delivery_date: convertDate(load.del_dt),
    weight: parseWeight(load.wgt),
    equipment_type: mapEquipmentType(load.mode),
  };
}

/**
 * Sanitize a batch of Walmart loads.
 * Loads that fail validation are collected in `errors` so the rest can still proceed.
 */
export function sanitizeLoads(loads: WalmartLoad[]): SanitizeResult {
  const sanitized: ShvLoad[] = [];
  const errors: SanitizeResult["errors"] = [];

  // Process in sequential order before converting
  const ordered = sortLoadsSequential(loads);

  for (const load of ordered) {
    try {
      sanitized.push(sanitizeLoad(load));
    } catch (err) {
      errors.push({
        load_number: load.load_no || "unknown",
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
  }

  return { sanitized, errors };
}
