"use client";

/**
 * PAGE.TSX — Main screen
 *   Fetch Loads   → show raw Walmart columns (Load No., Frt Ord No., etc.)
 *   Sanitize & Push → show SHV API columns (load_number, bol_number, etc.)
 */

import Image from "next/image";
import { useCallback, useState } from "react";
import { AccordionSection } from "@/app/components/AccordionSection";
import { ShvLoadCard } from "@/app/components/ShvLoadCard";
import { WalmartLoadCard } from "@/app/components/WalmartLoadCard";
import type { FetchResponse, ShvLoad, WalmartLoad } from "@/lib/types";

type Status = {
  type: "loading" | "success" | "error" | "warning";
  message: string;
} | null;

/** Which action button stays highlighted until the other is clicked. */
type ActiveAction = "fetch" | "push" | null;

export default function Home() {
  const [fetchedLoads, setFetchedLoads] = useState<WalmartLoad[]>([]);
  const [pushedLoads, setPushedLoads] = useState<ShvLoad[]>([]);
  const [status, setStatus] = useState<Status>(null);
  const [rejected, setRejected] = useState<
    Array<{ load_number: string; errors: string[] }>
  >([]);
  const [fetching, setFetching] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  /** Sticky highlight on the last action button clicked. */
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);

  /** Accordion open/closed state for each results section. */
  const [fetchedOpen, setFetchedOpen] = useState(true);
  const [pushedOpen, setPushedOpen] = useState(false);

  const handleFetch = useCallback(async () => {
    setActiveAction("fetch");
    setFetchedOpen(true);
    setPushedOpen(false);

    setFetching(true);
    setStatus({
      type: "loading",
      message: "Fetching open tenders from Walmart portal…",
    });
    setRejected([]);
    setPushedLoads([]);
    setFetchedLoads([]);

    try {
      const res = await fetch("/api/fetch-loads");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Fetch failed (${res.status})`);
      }

      const result = data as FetchResponse;
      setFetchedLoads(result.loads ?? []);
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
    if (fetchedLoads.length === 0) {
      setStatus({
        type: "warning",
        message: "No loads to push. Fetch loads first.",
      });
      return;
    }

    setActiveAction("push");
    setFetchedOpen(false);
    setPushedOpen(true);

    setPushing(true);
    setRejected([]);
    setPushedLoads([]);

    const accumulatedPushed: ShvLoad[] = [];
    const accumulatedRejected: Array<{ load_number: string; errors: string[] }> =
      [];

    try {
      for (let i = 0; i < fetchedLoads.length; i++) {
        const loadNum = fetchedLoads[i].load_no;
        setStatus({
          type: "loading",
          message: `Pushing ${loadNum} (${i + 1} of ${fetchedLoads.length})…`,
        });

        const res = await fetch("/api/push-loads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loads: [fetchedLoads[i]] }),
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
  }, [fetchedLoads]);

  const showPushedSection = pushing || pushedLoads.length > 0;

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
          className={`btn-fetch ${activeAction === "fetch" ? "active" : ""}`}
          onClick={handleFetch}
          disabled={fetching || pushing}
        >
          {fetching ? "Fetching…" : "1 · Fetch Loads"}
        </button>
        <button
          className={`btn-push ${activeAction === "push" ? "active" : ""}`}
          onClick={handlePush}
          disabled={fetching || pushing || fetchedLoads.length === 0}
        >
          {pushing ? "Pushing…" : "2 · Sanitize & Push"}
        </button>
      </div>

      <p className="hint">
        Fetch shows Walmart source columns. Push shows the sanitized SHV API
        fields sent to the TMS.
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

      {fetchedLoads.length > 0 && (
        <AccordionSection
          title="Fetched from Walmart"
          count={fetchedLoads.length}
          isOpen={fetchedOpen}
          onToggle={() => setFetchedOpen((o) => !o)}
        >
          {fetchedLoads.map((load) => (
            <WalmartLoadCard key={load.load_no} load={load} />
          ))}
        </AccordionSection>
      )}

      {fetchedLoads.length === 0 && !fetching && (
        <section className="loads-section">
          <div className="empty-state">
            No loads yet. Click &ldquo;Fetch Loads&rdquo; to pull open tenders
            from the Walmart portal.
          </div>
        </section>
      )}

      {showPushedSection && (
        <AccordionSection
          title="Pushed to SHV"
          count={pushedLoads.length}
          isOpen={pushedOpen}
          onToggle={() => setPushedOpen((o) => !o)}
          variant="pushed"
        >
          {pushedLoads.length === 0 && pushing ? (
            <p className="accordion-loading">Pushing loads…</p>
          ) : (
            pushedLoads.map((load) => (
              <ShvLoadCard key={load.load_number} load={load} />
            ))
          )}
        </AccordionSection>
      )}
    </main>
  );
}
