export const AUTH_EMAIL =
  process.env.AUTH_EMAIL ?? "Karansingh1991.ca@gmail.com";

export const WALMART_API_URL =
  "https://wmt-freight-portal.vercel.app/api/sap/loads";

export const SHV_API_URL =
  "https://shv-logistics-tms.vercel.app/api/sor/loads";

export function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${AUTH_EMAIL}`,
    "Content-Type": "application/json",
  };
}
