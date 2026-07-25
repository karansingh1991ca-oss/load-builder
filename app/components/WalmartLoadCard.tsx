/**
 * Walmart raw tender card — shown after "Fetch Loads".
 * Displays the source columns exactly as they come from Walmart.
 */

import type { WalmartLoad } from "@/lib/types";

const FIELDS: { label: string; key: keyof WalmartLoad }[] = [
  { label: "Load No.", key: "load_no" },
  { label: "Frt Ord No.", key: "frt_ord_no" },
  { label: "Shipper", key: "shipper_nm" },
  { label: "Origin City", key: "orig_city" },
  { label: "Origin State", key: "orig_st" },
  { label: "Destination City", key: "dest_city" },
  { label: "Destination State", key: "dest_st" },
  { label: "Ship Date", key: "shp_dt" },
  { label: "Delivery Date", key: "del_dt" },
  { label: "Weight", key: "wgt" },
  { label: "Mode", key: "mode" },
];

export function WalmartLoadCard({ load }: { load: WalmartLoad }) {
  return (
    <article className="load-card">
      <h3>{load.load_no}</h3>
      <dl className="load-grid">
        {FIELDS.filter(({ key }) => key !== "load_no").map(({ label, key }) => (
          <div key={key} className="load-row">
            <dt>{label}</dt>
            <dd>
              {load[key] == null || load[key] === ""
                ? "—"
                : String(load[key]).trim() || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
