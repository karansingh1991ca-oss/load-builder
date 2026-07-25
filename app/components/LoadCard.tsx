/**
 * Shared load card — same layout for fetched preview and pushed results.
 * Shows the exact SHV field values (no formatting).
 */

import type { ShvLoad } from "@/lib/types";

export function LoadCard({
  load,
  variant = "default",
}: {
  load: ShvLoad;
  variant?: "default" | "pushed";
}) {
  const cardClass =
    variant === "pushed" ? "load-card pushed-card" : "load-card";
  const titleClass = variant === "pushed" ? "pushed" : "";

  return (
    <article className={cardClass}>
      <h3 className={titleClass}>{load.load_number}</h3>
      <dl className="load-grid">
        <dt>BOL Number</dt>
        <dd>{load.bol_number}</dd>
        <dt>Shipper</dt>
        <dd>{load.shipper_name}</dd>
        <dt>Origin</dt>
        <dd>
          {load.origin_city}, {load.origin_state}
        </dd>
        <dt>Destination</dt>
        <dd>
          {load.destination_city}, {load.destination_state}
        </dd>
        <dt>Ship Date</dt>
        <dd>{load.ship_date}</dd>
        <dt>Delivery Date</dt>
        <dd>{load.delivery_date}</dd>
        <dt>Weight</dt>
        <dd>{load.weight}</dd>
        <dt>Equipment</dt>
        <dd>{load.equipment_type}</dd>
      </dl>
    </article>
  );
}
