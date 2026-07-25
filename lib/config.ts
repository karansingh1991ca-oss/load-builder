/**
 * CONFIG.TS — Shared settings for API calls
 * ==========================================
 * Stores the email used to authenticate with both portals
 * and the URLs we call on each side.
 */

/** Your account email — sent as a Bearer token to both Walmart and SHV APIs. */
export const AUTH_EMAIL =
  process.env.AUTH_EMAIL ?? "Karansingh1991.ca@gmail.com";

/** Walmart portal endpoint that returns open freight tenders. */
export const WALMART_API_URL =
  "https://wmt-freight-portal.vercel.app/api/sap/loads";

/** SHV TMS endpoint where sanitized loads are created/updated. */
export const SHV_API_URL =
  "https://shv-logistics-tms.vercel.app/api/sor/loads";

/** Builds the Authorization header both APIs require. */
export function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${AUTH_EMAIL}`,
    "Content-Type": "application/json",
  };
}
