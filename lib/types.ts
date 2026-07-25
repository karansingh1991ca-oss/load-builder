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

export interface WalmartResponse {
  source: string;
  count: number;
  loads: WalmartLoad[];
}

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

export interface ShvPushResponse {
  status: string;
  message: string;
  accepted: string[];
  rejected: Array<{ load_number: string; errors: string[] }>;
}

export interface SanitizeResult {
  sanitized: ShvLoad[];
  errors: Array<{ load_number: string; errors: string[] }>;
}
