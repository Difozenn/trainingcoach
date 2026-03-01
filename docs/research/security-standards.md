# Security Standards — TrainingCoach (2026)

## Password Hashing

**Standard**: Argon2id (OWASP 2025 recommendation)

Parameters:
- Algorithm: Argon2id (hybrid — side-channel + GPU resistance)
- Memory: 64 MiB (65536 KiB)
- Iterations: 3
- Parallelism: 4

**Source**: OWASP Password Storage Cheat Sheet (2025 update)
- Argon2id is the winner of the Password Hashing Competition (2015) and is recommended by OWASP as the primary choice over bcrypt/scrypt for new applications.
- Minimum 19 MiB memory recommended; we use 64 MiB for stronger resistance.

**Why not bcrypt?** Argon2id provides configurable memory-hardness, making it significantly more expensive to attack with GPUs/ASICs. bcrypt is limited to 4KB memory usage.

## Token Encryption

**Standard**: AES-256-GCM

- 256-bit key (32 bytes, stored as 64 hex characters in env var)
- 96-bit (12 byte) random IV per encryption
- 128-bit authentication tag
- Output format: base64(IV + ciphertext + authTag)

**Used for**: OAuth access/refresh tokens from Strava, Garmin, Wahoo stored in `platform_connections` table.

**Key rotation**: TOKEN_ENCRYPTION_KEY should be rotated annually. Migration: decrypt with old key, re-encrypt with new key.

## Session Security

**Standard**: JWT via Auth.js v5

Cookie configuration:
- `HttpOnly`: true (prevents XSS token theft)
- `Secure`: true in production (HTTPS only)
- `SameSite`: Strict (prevents CSRF)
- `Path`: / (available across site)
- Max age: 30 days

**Why JWT over database sessions?** Stateless verification reduces DB load. Auth.js handles token rotation. For invalidation on password change, we check a `passwordChangedAt` field.

## Rate Limiting

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| Login | 5 requests | 5 minutes | Brute force prevention |
| Signup | 3 requests | 1 hour | Spam prevention |
| API (general) | 100 requests | 1 minute | Abuse prevention |

**Implementation**: In-memory sliding window (development). For production at scale, use Redis with `INCR` + `EXPIRE` (or Vercel Edge Config).

**Account lockout**: Exponential backoff after failed login attempts:
- 5 failures → 1 minute lockout
- 10 failures → 5 minutes
- 15 failures → 15 minutes
- 20+ failures → 1 hour

## Security Headers

Applied via `next.config.ts` `headers()`:

| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Force HTTPS for 1 year |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME-type sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Limit referrer leakage |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Disable unnecessary APIs |
| Content-Security-Policy | See below | Prevent XSS, injection |

**CSP Directives**:
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com` — Stripe JS required
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — Google Fonts + Tailwind
- `font-src 'self' https://fonts.gstatic.com`
- `img-src 'self' data: blob: https://*.strava.com https://lh3.googleusercontent.com` — Strava photos + Google avatars
- `connect-src 'self' https://api.stripe.com https://www.strava.com https://connect.garmin.com`
- `frame-src 'self' https://js.stripe.com` — Stripe checkout iframe
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`

## Payment Security (Stripe)

- **PCI Compliance**: Via Stripe hosted checkout — no card data touches our servers
- **Webhook verification**: `stripe.webhooks.constructEvent(body, sig, secret)` on every webhook
- **Key separation**: `STRIPE_SECRET_KEY` server-only; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` client-safe
- **Event deduplication**: Store processed Stripe event IDs to prevent double-processing
- **Test mode**: Separate keys for development/staging

**Source**: Stripe Security Documentation, PCI DSS v4.0 (2024)

## Database Security

- **Connection encryption**: SSL/TLS enforced for production connections
- **Parameterized queries**: All queries via Drizzle ORM (SQL injection prevention)
- **Field encryption**: AES-256-GCM for OAuth tokens (at-rest encryption)
- **Backup encryption**: Daily encrypted backups with separate backup key
- **Access control**: Separate DB roles:
  - `app_user` — CRUD on application tables
  - `migration_user` — DDL permissions for schema changes
  - `readonly_user` — SELECT only for analytics

## CSRF Protection

- Next.js Server Actions have built-in CSRF protection via origin checking
- API routes: validated via `SameSite=Strict` cookies + `Origin` header check
- Stripe webhooks: signature verification replaces CSRF tokens

## Input Validation

- **Runtime validation**: Zod schemas on all API inputs
- **Type safety**: TypeScript strict mode end-to-end
- **ORM safety**: Drizzle ORM parameterizes all queries
- **File uploads**: Not supported (no user file uploads in current scope)

## Compliance

### GDPR
- **Data export**: Users can export all personal data as JSON
- **Account deletion**: CASCADE deletes remove all user data across all tables
- **Consent**: Explicit consent for health data processing during onboarding
- **Data minimization**: Only collect data necessary for training recommendations

### FTC Health Breach Notification Rule
- **Applicability**: Health data (HRV, resting HR, sleep) from Garmin qualifies
- **Plan**: 60-day notification to affected users + FTC in case of breach
- **Documentation**: Incident response plan maintained

### Disclaimers
- "Not medical advice" — displayed during onboarding and on health/nutrition pages
- "Not dietary advice" — displayed on nutrition targets page
- "Consult a healthcare professional before starting any training program"

## Dependencies

- **npm audit**: Run in CI pipeline, block deployment on critical vulnerabilities
- **Dependabot**: Enabled for automated dependency updates
- **Lock file**: `package-lock.json` committed and used for reproducible builds

## References

- OWASP Password Storage Cheat Sheet (2025): https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Top 10 (2021, still current): https://owasp.org/www-project-top-ten/
- Next.js Security Documentation: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
- Stripe Security: https://stripe.com/docs/security
- GDPR Article 17 (Right to Erasure): https://gdpr.eu/article-17-right-to-be-forgotten/
- FTC Health Breach Notification Rule (2024 update): https://www.ftc.gov/legal-library/browse/rules/health-breach-notification-rule
- PCI DSS v4.0: https://www.pcisecuritystandards.org/
