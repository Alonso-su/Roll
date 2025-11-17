# Raindrop Proxy Worker

This Worker proxies requests to Raindrop.io using a server-side secret.

Files in this directory:

- `src/index.js` - Worker implementation (proxy + edge cache + CORS)
- `wrangler.toml` - Wrangler config (workers_dev enabled). Add `account_id`/`zone_id` and routes when binding to your domain.
- `package.json` - helper scripts for `wrangler` (optional)
- `deploy.ps1` - PowerShell helper to set secret and publish
- `.gitignore` - ignores node_modules and temporary secret files
- `static/raindrop-client.js` - example front-end fetch code (calls `/api/raindrops`)

Quick start (PowerShell):

1. Install wrangler (if you don't have it):

```powershell
npm install -g wrangler
```

2. Login to Cloudflare:

```powershell
wrangler login
```

3. Set the Raindrop token as a secret (interactive):

```powershell
wrangler secret put RAINDROP_TOKEN
# paste your token and press Enter
```

(Or use the included `deploy.ps1` which prompts for the token and publishes.)

4. Publish the Worker:

```powershell
wrangler publish
```

5. (Optional) Bind worker to your domain path via Cloudflare dashboard or by adding `account_id`/`zone_id` and `routes` in `wrangler.toml`.

Integration notes:

- Recommended: route `suus.me/api/*` -> this Worker. Then static site can call `/api/raindrops` directly (same origin).
- Cache-Control in the Worker is configurable. Adjust `s-maxage` to control edge caching.
- Do NOT put `RAINDROP_TOKEN` in code or repo.

Security:

- For high-security scenarios, add origin checks or simple token-based auth to the Worker.
- Consider build-time fetch (static data) if data does not need to be real-time.

