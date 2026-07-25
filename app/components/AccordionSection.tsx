/**
 * Collapsible accordion section for fetched / pushed load lists.
 */

import type { ReactNode } from "react";

export function AccordionSection({
  title,
  count,
  isOpen,
  onToggle,
  variant = "default",
  children,
}: {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  variant?: "default" | "pushed";
  children: ReactNode;
}) {
  return (
    <section className={`accordion ${variant} ${isOpen ? "open" : "collapsed"}`}>
      <button
        type="button"
        className="accordion-header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="accordion-title">
          {title} ({count})
        </span>
        <span className="accordion-chevron" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <div className="accordion-body" hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}
