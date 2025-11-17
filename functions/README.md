# Cloudflare Pages Functions Configuration

This folder contains serverless functions deployed automatically with Pages.

## Structure

- `api/raindrops.js` — Proxy endpoint for Raindrop.io bookmarks API

## Environment Variables

In Cloudflare Pages:

1. Go to Project → Settings → Environment variables
2. Add:
   - Name: `RAINDROP_TOKEN`
   - Value: (your Raindrop API token)
   - Environment: Production (and Preview if needed)

The token will be available in the function as `context.env.RAINDROP_TOKEN`.

## Usage

After deploying, call from your site:

```javascript
fetch('/api/raindrops')
  .then(r => r.json())
  .then(data => console.log(data));
```

No need to manage a separate Worker or wrangler — Pages Functions are deployed automatically on git push.
