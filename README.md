# Walmart → SHV Logistics Load Builder

Web app that fetches open freight tenders from the Walmart portal, sanitizes them per SHV TMS rules, and pushes them via the SOR API.

## Features

- **Fetch Loads** — pulls open tenders from `wmt-freight-portal.vercel.app`
- **Sanitize & Push** — transforms and POSTs loads to `shv-logistics-tms.vercel.app`
- Mobile-responsive UI (matches the runbook case sim layout)

## Sanitization rules

| Walmart field | SHV field | Transform |
|---|---|---|
| `load_no` | `load_number` | trim whitespace |
| `frt_ord_no` | `bol_number` | trim |
| `shipper_nm` | `shipper_name` | trim |
| `orig_city` / `orig_st` | `origin_city` / `origin_state` | trim |
| `dest_city` / `dest_st` | `destination_city` / `destination_state` | trim |
| `shp_dt` / `del_dt` | `ship_date` / `delivery_date` | MMDDYYYY → DDMMYYYY |
| `wgt` | `weight` | strip commas/units → integer lbs |
| `mode` | `equipment_type` | Reefer modes → `Reefer 53'`, else `Dry Van 53'` |

## Local development

```bash
cd load-builder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this folder to a GitHub repo (or import directly in Vercel).
2. In [vercel.com](https://vercel.com), click **Add New Project** and import the repo.
3. Set the root directory to `load-builder` if the repo root is the parent folder.
4. Add environment variable (optional):
   - `AUTH_EMAIL` = `Karansingh1991.ca@gmail.com`
5. Deploy — Vercel auto-detects Next.js and runs `next build`.

## Auth

Both APIs use `Authorization: Bearer [email]`. The email defaults to `Karansingh1991.ca@gmail.com` and can be overridden with the `AUTH_EMAIL` env var on Vercel.
