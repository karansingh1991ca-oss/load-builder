/**
 * TYPES.TS — Data shape definitions
 * ==================================
 * These describe what a "load" looks like when it comes FROM Walmart
 * and what it must look like when sent TO SHV.
 * No logic here — just the blueprint for the data structures.
 */

/** A single freight tender as returned by the Walmart portal API. */
export interface WalmartLoad {
  load_no: string;
  tender_id: string;
  frt_ord_no: string;
  carrier_scac: string;
  shipper_nm: string;
  vendor_nbr: string;
  orig_city: string;
  orig_st: string;
  dc_nbr: string;
  dest_city: string;
  dest_st: string;
  dept_nbr: string;
  shp_dt: string;
  del_dt: string;
  pallet_cnt: string;
  case_cnt: string;
  wgt: string | null;
  dist_mi: string;
  hazmat_flg: string;
  mode: string;
}

/** The wrapper object Walmart sends back when you fetch tenders. */
export interface WalmartResponse {
  source: string;
  count: number;
  loads: WalmartLoad[];
}

/** Response from our fetch-loads API — raw Walmart records sorted by load number. */
export interface FetchResponse {
  source: string;
  count: number;
  loads: WalmartLoad[];
}

/** A load record in the format SHV TMS expects (after sanitization). */
export interface ShvLoad {
  load_number: string;
  bol_number: string;
  shipper_name: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  ship_date: string;
  delivery_date: string;
  weight: number;
  equipment_type: "Reefer 53'" | "Dry Van 53'";
}

/** What SHV sends back after you push loads. */
export interface ShvPushResponse {
  status: string;
  message: string;
  accepted: string[];
  rejected: Array<{ load_number: string; errors: string[] }>;
}

/** Internal result from the sanitization step. */
export interface SanitizeResult {
  sanitized: ShvLoad[];
  errors: Array<{ load_number: string; errors: string[] }>;
}

/** Extended push response sent to the browser — includes the actual pushed records. */
export interface PushResult extends ShvPushResponse {
  pushedLoads: ShvLoad[];
  sanitizeErrors?: Array<{ load_number: string; errors: string[] }>;
}
