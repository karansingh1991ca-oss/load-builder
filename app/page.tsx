"use client";

import { useCallback, useState } from "react";
import type { ShvPushResponse, WalmartLoad, WalmartResponse } from "@/lib/types";

type Status = { type: "loading" | "success" | "error" | "warning"; message: string } | null;

export default function Home() {
  const [loads, setLoads] = useState<WalmartLoad[]>([]);
  const [status, setStatus] = useState<Status>(null);
  const [rejected, setRejected] = useState<Array<{ load_number: string; errors: string[] }>>([]);
  const [fetching, setFetching] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleFetch = useCallback(async () => {
    setFetching(true);
    setStatus({ type: "loading", message: "Fetching open tenders from Walmart portal…" });
    setRejected([]);

    try {
      const res = await fetch("/api/fetch-loads");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Fetch failed (${res.status})`);
      }

      const result = data as WalmartResponse;
      setLoads(result.loads ?? []);
      setStep(2);
      setStatus({
        type: "success",
        message: `Fetched ${result.count ?? result.loads?.length ?? 0} open tender(s) from Walmart.`,
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

  const handlePush = useCallback(async () => {
    if (loads.length === 0) {
      setStatus({ type: "warning", message: "No loads to push. Fetch loads first." });
      return;
    }

    setPushing(true);
    setStatus({ type: "loading", message: "Sanitizing data and pushing to SHV TMS…" });
    setRejected([]);

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
        throw new Error(data.error ?? data.message ?? `Push failed (${res.status})`);
      }

      const result = data as ShvPushResponse & {
        sanitizeErrors?: Array<{ load_number: string; errors: string[] }>;
      };

      const allRejected = [...sanitizeErrors, ...(result.rejected ?? [])];
      setRejected(allRejected);

      if (allRejected.length > 0) {
        setStatus({
          type: "warning",
          message: `${result.accepted?.length ?? 0} accepted, ${allRejected.length} rejected.`,
        });
      } else {
        setStatus({
          type: "success",
          message: result.message ?? `${result.accepted?.length ?? 0} load(s) pushed to SHV TMS.`,
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

  return (
    <main className="app">
      <header>
        <h1>Walmart → SHV Logistics Load Builder</h1>
        <p>
          Fetch raw Walmart freight tenders, sanitize them per the SHV rules, and
          push them into the TMS.
        </p>
        <p className="email">Auth: Karansingh1991.ca@gmail.com</p>
      </header>

      <div className="steps">
        <span className={`step ${step >= 1 ? "active" : ""}`}>
          <span className="step-num">1</span> Fetch loads
        </span>
        <span>→</span>
        <span className={`step ${step >= 2 ? "active" : ""}`}>
          <span className="step-num">2</span> Sanitize &amp; push
        </span>
      </div>

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
        Fetch first to see the raw tenders, then sanitize &amp; push them to the TMS.
      </p>

      {status && (
        <div className={`status-bar ${status.type}`}>{status.message}</div>
      )}

      {rejected.length > 0 && (
        <div className="rejected-list">
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

      <section className="loads-section">
        <h2>
          {loads.length > 0
            ? `Raw Tenders (${loads.length})`
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
                <dd>{load.mode}</dd>
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
