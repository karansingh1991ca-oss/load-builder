/**
 * SHV load card — shown after "Sanitize & Push".
 * Field labels match the SHV SOR API exactly.
 */

import type { ShvLoad } from "@/lib/types";

const FIELDS: { label: string; key: keyof ShvLoad }[] = [
  { label: "load_number", key: "load_number" },
  { label: "bol_number", key: "bol_number" },
  { label: "shipper_name", key: "shipper_name" },
  { label: "origin_city", key: "origin_city" },
  { label: "origin_state", key: "origin_state" },
  { label: "destination_city", key: "destination_city" },
  { label: "destination_state", key: "destination_state" },
  { label: "ship_date", key: "ship_date" },
  { label: "delivery_date", key: "delivery_date" },
  { label: "weight", key: "weight" },
  { label: "equipment_type", key: "equipment_type" },
];

export function ShvLoadCard({ load }: { load: ShvLoad }) {
  return (
    <article className="load-card pushed-card">
      <h3 className="pushed">{load.load_number}</h3>
      <dl className="load-grid">
        {FIELDS.map(({ label, key }) => (
          <div key={key} className="load-row">
            <dt>{label}</dt>
            <dd>{load[key]}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
