---
status: awaiting_human_verify
trigger: "Dev server startup error causing page to crash or show blank screen"
created: 2026-03-01T00:00:00Z
updated: 2026-03-01T01:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — two route groups both resolving to "/" caused a Turbopack compilation error that crashed every page
test: Ran dev server and hit HTTP endpoints — confirmed 500 on all routes
expecting: After moving (dashboard)/page.tsx to (dashboard)/dashboard/page.tsx, "/" returns 200 and "/dashboard" renders (failing only on DB not found, not routing)
next_action: Human verification that pages render correctly with a real .env.local and running DB

## Symptoms

expected: Dev server starts cleanly, pages load normally
actual: Page crashes or shows blank — every route returned HTTP 500
errors: "You cannot have two parallel pages that resolve to the same path. Please check /(dashboard) and /(marketing)."
reproduction: npm run dev, navigate to any page
started: After Garmin/Wahoo integration was added (18 new files, 5 modified files) — but the root cause pre-dates that; Next.js 16 Turbopack now strictly enforces this rule

## Eliminated

- hypothesis: New oauth-1.0a import causes module-level crash
  evidence: Package is CJS with proper module.exports, esModuleInterop:true in tsconfig, no module-load side effects
  timestamp: 2026-03-01T00:30:00Z

- hypothesis: Missing Garmin/Wahoo env vars crash startup
  evidence: env.ts only validates GARMIN_CONSUMER_KEY/WAHOO_CLIENT_ID inside functions, not at module load time; server starts with warnings not crashes
  timestamp: 2026-03-01T00:31:00Z

- hypothesis: New sync files have runtime errors in module scope
  evidence: All exports are function declarations or inngest.createFunction() calls — no module-level throws
  timestamp: 2026-03-01T00:32:00Z

## Evidence

- timestamp: 2026-03-01T00:20:00Z
  checked: npm run dev output
  found: Server starts without error but every page request results in 500
  implication: Not a startup crash but a per-request compilation failure

- timestamp: 2026-03-01T00:21:00Z
  checked: Error message from HTTP 500 response body
  found: "You cannot have two parallel pages that resolve to the same path. Please check /(dashboard) and /(marketing)."
  implication: Both route groups have a page.tsx at their root, both resolve to "/" since route groups don't add URL segments

- timestamp: 2026-03-01T00:22:00Z
  checked: src/app/(marketing)/page.tsx and src/app/(dashboard)/page.tsx
  found: (marketing)/page.tsx is the public landing page; (dashboard)/page.tsx is the auth-protected dashboard overview
  implication: Dashboard overview must move to /dashboard subfolder so it resolves to /dashboard not /

- timestamp: 2026-03-01T00:25:00Z
  checked: Next.js 16 upgrade note in server log
  found: Next.js 16.1.6 with Turbopack is running — this version enforces strict route uniqueness that Next.js 15 may have silently allowed
  implication: This conflict was latent from commit a6ca06a (landing page added) and became fatal with Next.js 16

- timestamp: 2026-03-01T00:35:00Z
  checked: proxy.ts warning
  found: Next.js 16 renamed middleware.ts to proxy.ts AND requires the exported function to be named "proxy" (not "middleware")
  implication: Additional fix needed for the middleware → proxy rename

- timestamp: 2026-03-01T00:50:00Z
  checked: GET / after fix
  found: HTTP 200 — landing page renders correctly
  implication: Route conflict resolved; (marketing)/page.tsx correctly owns "/"

- timestamp: 2026-03-01T00:51:00Z
  checked: GET /dashboard after fix
  found: HTTP 500 with "DATABASE_URL not set" — compilation succeeds, fails only on missing DB connection
  implication: Route conflict is resolved; DB error is expected in an environment without .env.local

## Resolution

root_cause: Both src/app/(dashboard)/page.tsx and src/app/(marketing)/page.tsx resolved to the same URL path "/" because Next.js route groups (parenthesized folder names) don't add URL segments. Next.js 16 Turbopack now strictly enforces uniqueness and throws a compilation error on every page request, causing HTTP 500 across the entire app.

fix: |
  1. Moved src/app/(dashboard)/page.tsx → src/app/(dashboard)/dashboard/page.tsx
     (dashboard overview now lives at /dashboard)
  2. Updated dashboard-sidebar.tsx: Overview nav href "/" → "/dashboard", logo link "/" → "/dashboard"
  3. Updated login/page.tsx: router.push("/") → router.push("/dashboard"), callbackUrl "/" → "/dashboard"
  4. Updated register/page.tsx: router.push("/") → router.push("/dashboard"), callbackUrl "/" → "/dashboard"
  5. Renamed src/middleware.ts → src/proxy.ts and renamed export "middleware" → "proxy" per Next.js 16 convention

verification: |
  GET / returns HTTP 200 (marketing landing page renders correctly)
  GET /dashboard returns HTTP 500 only because DATABASE_URL is not set (no .env.local in this environment) — not a routing or compilation error
  No "parallel pages" Turbopack error in server log
  No "middleware" deprecation warning in server log

files_changed:
  - src/app/(dashboard)/page.tsx → DELETED (moved to dashboard/)
  - src/app/(dashboard)/dashboard/page.tsx → CREATED
  - src/components/layout/dashboard-sidebar.tsx → href "/" to "/dashboard" (2 occurrences)
  - src/app/(auth)/login/page.tsx → router.push and callbackUrl updated to "/dashboard"
  - src/app/(auth)/register/page.tsx → router.push and callbackUrl updated to "/dashboard"
  - src/middleware.ts → DELETED (renamed to proxy.ts)
  - src/proxy.ts → CREATED (function renamed from "middleware" to "proxy")
