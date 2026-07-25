"use client";

/**
 * PAGE.TSX — Main screen the user sees
 * =====================================
 *   1. Fetch Loads   — pull from Walmart, show sanitized SHV-format records
 *   2. Sanitize & Push — push each load to SHV in increasing load number order
 */

import Image from "next/image";
import { useCallback, useState } from "react";
import { LoadCard } from "@/app/components/LoadCard";
import type { FetchResponse, ShvLoad, WalmartLoad } from "@/lib/types";

type Status = {
  type: "loading" | "success" | "error" | "warning";
  message: string;
} | null;

export default function Home() {
  /** Sanitized loads shown after Fetch — same format as what gets pushed. */
  const [fetchedLoads, setFetchedLoads] = useState<ShvLoad[]>([]);

  /** Raw Walmart records kept in load-number order for sequential push. */
  const [rawLoads, setRawLoads] = useState<WalmartLoad[]>([]);

  /** Loads successfully pushed to SHV (appears one-by-one during push). */
  const [pushedLoads, setPushedLoads] = useState<ShvLoad[]>([]);

  const [status, setStatus] = useState<Status>(null);
  const [rejected, setRejected] = useState<
    Array<{ load_number: string; errors: string[] }>
  >([]);
  const [fetching, setFetching] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleFetch = useCallback(async () => {
    setFetching(true);
    setStatus({
      type: "loading",
      message: "Fetching open tenders from Walmart portal…",
    });
    setRejected([]);
    setPushedLoads([]);
    setFetchedLoads([]);
    setRawLoads([]);

    try {
      const res = await fetch("/api/fetch-loads");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Fetch failed (${res.status})`);
      }

      const result = data as FetchResponse;

      // Display sanitized SHV-format records sorted by increasing load number
      setFetchedLoads(result.loads ?? []);
      setRawLoads(result.rawLoads ?? []);

      if (result.sanitizeErrors?.length) {
        setRejected(result.sanitizeErrors);
      }

      setStep(2);
      setStatus({
        type: "success",
        message: `Fetched ${result.count ?? 0} load(s) in increasing load number order.`,
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
    if (rawLoads.length === 0) {
      setStatus({
        type: "warning",
        message: "No loads to push. Fetch loads first.",
      });
      return;
    }

    setPushing(true);
    setRejected([]);
    setPushedLoads([]);

    const accumulatedPushed: ShvLoad[] = [];
    const accumulatedRejected: Array<{ load_number: string; errors: string[] }> =
      [];

    try {
      // Push in increasing load number order (rawLoads already sorted from fetch)
      for (let i = 0; i < rawLoads.length; i++) {
        const loadNum = rawLoads[i].load_no;
        setStatus({
          type: "loading",
          message: `Pushing ${loadNum} (${i + 1} of ${rawLoads.length})…`,
        });

        const res = await fetch("/api/push-loads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loads: [rawLoads[i]] }),
        });

        const data = await res.json();
        const sanitizeErrors = data.sanitizeErrors ?? [];
        const apiRejected = data.rejected ?? [];

        if (data.pushedLoads?.length) {
          accumulatedPushed.push(...data.pushedLoads);
          setPushedLoads([...accumulatedPushed]);
        }

        if (sanitizeErrors.length || apiRejected.length) {
          accumulatedRejected.push(...sanitizeErrors, ...apiRejected);
          setRejected([...accumulatedRejected]);
        }
      }

      if (accumulatedPushed.length === 0) {
        setStatus({
          type: "error",
          message: "No loads were accepted by SHV.",
        });
      } else if (accumulatedRejected.length > 0) {
        setStatus({
          type: "warning",
          message: `${accumulatedPushed.length} accepted, ${accumulatedRejected.length} rejected.`,
        });
      } else {
        setStatus({
          type: "success",
          message: `${accumulatedPushed.length} load(s) pushed in increasing load number order.`,
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
  }, [rawLoads]);

  return (
    <main className="app">
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
          disabled={fetching || pushing || rawLoads.length === 0}
        >
          {pushing ? "Pushing…" : "2 · Sanitize & Push"}
        </button>
      </div>

      <p className="hint">
        Loads are pulled and pushed in increasing load number order (e.g.
        LD-3262360, then LD-3262361).
      </p>

      {status && (
        <div className={`status-bar ${status.type}`}>{status.message}</div>
      )}

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

      {/* Fetched loads — sanitized SHV format, shown only after Fetch */}
      {fetchedLoads.length > 0 && (
        <section className="loads-section">
          <h2 className="section-title">
            Fetched Loads ({fetchedLoads.length}) — increasing load number
          </h2>
          {fetchedLoads.map((load) => (
            <LoadCard key={load.load_number} load={load} />
          ))}
        </section>
      )}

      {fetchedLoads.length === 0 && !fetching && (
        <section className="loads-section">
          <div className="empty-state">
            No loads yet. Click &ldquo;Fetch Loads&rdquo; to pull and preview
            sanitized records from Walmart.
          </div>
        </section>
      )}

      {/* Pushed loads — same card format, appears as each load is pushed */}
      {pushedLoads.length > 0 && (
        <section className="loads-section pushed-section">
          <h2 className="section-title pushed-title">
            Pushed to SHV ({pushedLoads.length})
          </h2>
          {pushedLoads.map((load) => (
            <LoadCard key={load.load_number} load={load} variant="pushed" />
          ))}
        </section>
      )}
    </main>
  );
}
