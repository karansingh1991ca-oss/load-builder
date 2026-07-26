/** Smooth-scroll the window so `element` sits near the top of the viewport. */
export function scrollToElement(element: HTMLElement | null, offsetPx = 12): void {
  if (!element) return;

  const top =
    window.scrollY + element.getBoundingClientRect().top - offsetPx;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

/** Scroll now and again after content renders (status bar, accordions). */
export function scrollToElementDelayed(
  element: HTMLElement | null,
  delayMs = 300,
  offsetPx = 12
): void {
  if (!element) return;

  requestAnimationFrame(() => {
    scrollToElement(element, offsetPx);
  });

  window.setTimeout(() => {
    scrollToElement(element, offsetPx);
  }, delayMs);
}
