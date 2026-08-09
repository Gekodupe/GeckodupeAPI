# Geckodupe API

Open-source Cloudflare Worker powering [Geckodupe](https://github.com/Gekodupe/Gekodupe) — hosted spam scoring, event idempotency, accounts, API keys, and billing.

**Repo:** [Gekodupe/GeckodupeAPI](https://github.com/Gekodupe/GeckodupeAPI) · **Org:** [Gekodupe](https://github.com/orgs/Gekodupe)

Flareform calls this Worker via `GECKODUPE_SPAM_URL` (see [FlareformAPI](https://github.com/Gekodupe/FlareformAPI)).

## Deploy

```bash
npm install
cp .dev.vars.example .dev.vars
# Set BREVO_*, STRIPE_*, API_KEYS, etc.
npx wrangler deploy
```

Hosted: `https://geckodupe-spam.nic-58f.workers.dev`

Worker Cloudflare name is `geckodupe-spam` (kept for URL stability).

## Auth & accounts

```bash
npx wrangler secret put API_KEYS          # optional static keys
npx wrangler secret put BREVO_API_KEY
npx wrangler secret put BREVO_SENDER_EMAIL
npx wrangler secret put BREVO_SENDER_NAME
npx wrangler secret put APP_ORIGIN        # e.g. https://gekodupe.github.io/Gekodupe
```

| Method | Path | Notes |
|--------|------|-------|
| POST | `/v1/auth/start` | Email magic code via Brevo |
| POST | `/v1/auth/verify` | Exchange code/token for session |
| POST | `/v1/auth/logout` | End session |
| GET | `/v1/auth/me` | Session email |
| GET | `/v1/account` | Profile + keys |
| POST/GET/DELETE | `/v1/account/keys` | Create / list / revoke API keys |

Issued keys (`gd_live_...`) work on `/v1/spam/*` and `/v1/events/*` the same as static `API_KEYS`.

When `API_KEYS` is set, all `/v1/spam/*` and `/v1/events/*` routes require:

```
Authorization: Bearer <geckodupe_api_key>
```

`/v1/health` stays open. Account routes use `Authorization: Bearer sess_...`.

## Routes

| Method | Path | Notes |
|--------|------|-------|
| GET | `/v1/health` | Liveness |
| POST | `/v1/spam/score` | Score payload |
| POST | `/v1/spam/check` | Score + KV burst memory (+ optional Turnstile) |
| POST | `/v1/spam/clean` | Despam text body |
| GET/PUT | `/v1/spam/blocklist` | Per-tenant blocklist |
| POST | `/v1/events/check` | Idempotency: double-submit, retries, webhooks |

## Commands

```bash
npm install
npx wrangler dev
npx wrangler deploy
npm test
```

## SDK

The browser/npm client lives in the [Geckodupe](https://github.com/Gekodupe/Gekodupe) site package (`sdk/`).

```bash
npm install geckodupe
```

## License

GPL-3.0-or-later
