"use client";

/**
 * PAGE.TSX — Main screen the user sees
 * =====================================
 * This is the Load Builder dashboard with two buttons:
 *   1. Fetch Loads   — pull tenders from Walmart
 *   2. Sanitize & Push — clean the data and send it to SHV
 *
 * "use client" means this code runs in the browser (handles button clicks).
 */

import Image from "next/image";
import { useCallback, useState } from "react";
import type {
  PushResult,
  ShvLoad,
  WalmartLoad,
  WalmartResponse,
} from "@/lib/types";

/** Status message shown in the colored banner after each action. */
type Status = {
  type: "loading" | "success" | "error" | "warning";
  message: string;
} | null;

export default function Home() {
  // --- State: data the screen remembers between button clicks ---

  /** Raw tender records fetched from Walmart (shown in "Raw Tenders" section). */
  const [loads, setLoads] = useState<WalmartLoad[]>([]);

  /** Cleaned records that were successfully pushed to SHV (shown after push). */
  const [pushedLoads, setPushedLoads] = useState<ShvLoad[]>([]);

  /** Colored status banner message (success / error / loading). */
  const [status, setStatus] = useState<Status>(null);

  /** Loads that failed validation or were rejected by SHV. */
  const [rejected, setRejected] = useState<
    Array<{ load_number: string; errors: string[] }>
  >([]);

  /** True while the Fetch button is working — disables buttons & shows spinner text. */
  const [fetching, setFetching] = useState(false);

  /** True while the Push button is working. */
  const [pushing, setPushing] = useState(false);

  /** Tracks which step the user is on (1 = fetch, 2 = push) for the step indicator. */
  const [step, setStep] = useState<1 | 2>(1);

  // --- Button 1: Fetch Loads from Walmart ---

  const handleFetch = useCallback(async () => {
    setFetching(true);
    setStatus({
      type: "loading",
      message: "Fetching open tenders from Walmart portal…",
    });
    setRejected([]);
    setPushedLoads([]); // clear previous push results on a fresh fetch

    try {
      const res = await fetch("/api/fetch-loads");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Fetch failed (${res.status})`);
      }

      const result = data as WalmartResponse;
      // API already returns loads in FIFO order (oldest ship date first)
      setLoads(result.loads ?? []);
      setStep(2);
      setStatus({
        type: "success",
        message: `Fetched ${result.count ?? result.loads?.length ?? 0} open tender(s) from Walmart (oldest first).`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to fetch loads",
      });
    } finally {
      setFetching(false);
    }
  }, []);

  // --- Button 2: Sanitize & Push to SHV ---

  const handlePush = useCallback(async () => {
    if (loads.length === 0) {
      setStatus({
        type: "warning",
        message: "No loads to push. Fetch loads first.",
      });
      return;
    }

    setPushing(true);
    setStatus({
      type: "loading",
      message: "Sanitizing data and pushing to SHV TMS…",
    });
    setRejected([]);
    setPushedLoads([]);

    try {
      const res = await fetch("/api/push-loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loads }),
      });

      const data = await res.json();

      const sanitizeErrors = data.sanitizeErrors ?? [];
      const apiRejected = data.rejected ?? [];

      if (!res.ok) {
        setRejected([...sanitizeErrors, ...apiRejected]);
        setPushedLoads(data.pushedLoads ?? []);
        throw new Error(
          data.error ?? data.message ?? `Push failed (${res.status})`
        );
      }

      const result = data as PushResult;
      const allRejected = [...sanitizeErrors, ...(result.rejected ?? [])];
      setRejected(allRejected);
      setPushedLoads(result.pushedLoads ?? []);

      if (allRejected.length > 0) {
        setStatus({
          type: "warning",
          message: `${result.accepted?.length ?? 0} accepted, ${allRejected.length} rejected.`,
        });
      } else {
        setStatus({
          type: "success",
          message:
            result.message ??
            `${result.accepted?.length ?? 0} load(s) pushed to SHV TMS.`,
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to push loads",
      });
    } finally {
      setPushing(false);
    }
  }, [loads]);

  // --- Render the page ---

  return (
    <main className="app">
      {/* SHV logo banner at the top */}
      <div className="logo-bar">
        <Image
          src="/logo.jpg"
          alt="SHV Logistics"
          width={280}
          height={80}
          className="logo"
          priority
        />
      </div>

      <header>
        <h1>Walmart → SHV Logistics Load Builder</h1>
        <p>
          Fetch raw Walmart freight tenders, sanitize them per the SHV rules, and
          push them into the TMS.
        </p>
        <p className="email">Auth: Karansingh1991.ca@gmail.com</p>
      </header>

      {/* Step indicator: 1 Fetch → 2 Push */}
      <div className="steps">
        <span className={`step ${step >= 1 ? "active" : ""}`}>
          <span className="step-num">1</span> Fetch loads
        </span>
        <span>→</span>
        <span className={`step ${step >= 2 ? "active" : ""}`}>
          <span className="step-num">2</span> Sanitize &amp; push
        </span>
      </div>

      {/* The two action buttons */}
      <div className="actions">
        <button
          className="btn-fetch"
          onClick={handleFetch}
          disabled={fetching || pushing}
        >
          {fetching ? "Fetching…" : "1 · Fetch Loads"}
        </button>
        <button
          className="btn-push"
          onClick={handlePush}
          disabled={fetching || pushing || loads.length === 0}
        >
          {pushing ? "Pushing…" : "2 · Sanitize & Push"}
        </button>
      </div>

      <p className="hint">
        Fetch first to see the raw tenders (oldest first), then sanitize &amp;
        push them to the TMS.
      </p>

      {/* Status banner — green for success, red for error, etc. */}
      {status && (
        <div className={`status-bar ${status.type}`}>{status.message}</div>
      )}

      {/* Rejected loads with error details */}
      {rejected.length > 0 && (
        <div className="rejected-list">
          <h2 className="section-title rejected-title">Rejected Loads</h2>
          {rejected.map((item) => (
            <div key={item.load_number} className="rejected-item">
              <strong>{item.load_number}</strong>
              <ul>
                {item.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Successfully pushed loads — shown after Sanitize & Push */}
      {pushedLoads.length > 0 && (
        <section className="loads-section pushed-section">
          <h2 className="section-title pushed-title">
            Pushed to SHV ({pushedLoads.length})
          </h2>
          {pushedLoads.map((load) => (
            <article key={load.load_number} className="load-card pushed-card">
              <h3>{load.load_number}</h3>
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
                <dt>Weight (lbs)</dt>
                <dd>{load.weight.toLocaleString()}</dd>
                <dt>Equipment</dt>
                <dd>{load.equipment_type}</dd>
              </dl>
            </article>
          ))}
        </section>
      )}

      {/* Raw Walmart tenders fetched in step 1 */}
      <section className="loads-section">
        <h2 className="section-title">
          {loads.length > 0
            ? `Raw Tenders (${loads.length}) — oldest first`
            : "Raw Tenders"}
        </h2>

        {loads.length === 0 ? (
          <div className="empty-state">
            No tenders loaded yet. Click &ldquo;Fetch Loads&rdquo; to pull open
            tenders from the Walmart portal.
          </div>
        ) : (
          loads.map((load) => (
            <article key={load.load_no} className="load-card">
              <h3>{load.load_no}</h3>
              <dl className="load-grid">
                <dt>Tender ID</dt>
                <dd>{load.tender_id}</dd>
                <dt>Freight Order</dt>
                <dd>{load.frt_ord_no}</dd>
                <dt>Shipper</dt>
                <dd>{load.shipper_nm}</dd>
                <dt>Origin</dt>
                <dd>
                  {load.orig_city}, {load.orig_st}
                </dd>
                <dt>Destination</dt>
                <dd>
                  {load.dest_city}, {load.dest_st}
                </dd>
                <dt>Ship Date</dt>
                <dd>{load.shp_dt}</dd>
                <dt>Delivery Date</dt>
                <dd>{load.del_dt}</dd>
                <dt>Weight</dt>
                <dd>{load.wgt ?? "—"}</dd>
                <dt>Mode</dt>
                <dd>{load.mode.trim()}</dd>
                <dt>Pallets / Cases</dt>
                <dd>
                  {load.pallet_cnt} / {load.case_cnt}
                </dd>
              </dl>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
