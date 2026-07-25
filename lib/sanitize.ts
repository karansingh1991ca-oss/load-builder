import type { SanitizeResult, ShvLoad, WalmartLoad } from "./types";

const REEFER_MODES = new Set([
  "REEFER",
  "REF",
  "FROZEN",
  "FRZ",
  "CHILLED",
  "CLD",
  "TEMP CONTROL",
  "TEMPERATURE CONTROL",
]);

/** Convert MMDDYYYY (Walmart) → DDMMYYYY (SHV) */
export function convertDate(mmddyyyy: string): string {
  const cleaned = mmddyyyy.trim();
  if (!/^\d{8}$/.test(cleaned)) {
    throw new Error(`Invalid date "${mmddyyyy}" — expected 8 digits in MMDDYYYY format`);
  }
  const mm = cleaned.slice(0, 2);
  const dd = cleaned.slice(2, 4);
  const yyyy = cleaned.slice(4, 8);
  return `${dd}${mm}${yyyy}`;
}

/** Parse weight string like "41,860 lbs" → 41860 */
export function parseWeight(wgt: string | null): number {
  if (!wgt || !wgt.trim()) {
    throw new Error("Weight is missing");
  }
  const digits = wgt.replace(/[^\d]/g, "");
  if (!digits) {
    throw new Error(`Cannot parse weight from "${wgt}"`);
  }
  const weight = parseInt(digits, 10);
  if (weight <= 0) {
    throw new Error(`Weight must be a positive whole number, got ${weight}`);
  }
  return weight;
}

/** Map Walmart mode code to SHV equipment type */
export function mapEquipmentType(mode: string): "Reefer 53'" | "Dry Van 53'" {
  const normalized = mode.trim().toUpperCase();
  if (REEFER_MODES.has(normalized) || normalized.includes("REEF") || normalized.includes("FRZ")) {
    return "Reefer 53'";
  }
  return "Dry Van 53'";
}

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

export function sanitizeLoads(loads: WalmartLoad[]): SanitizeResult {
  const sanitized: ShvLoad[] = [];
  const errors: SanitizeResult["errors"] = [];

  for (const load of loads) {
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
