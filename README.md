# Apple Pay Verification SaaS

## Architecture
- **Public Site**: React + Vite (Cloudflare Pages)
- **Merchant Portal**: React + Vite + Shopify Polaris (Served by Worker)
- **Control Plane**: Cloudflare Worker (Hono API + Asset Serving)

## How to Run Locally

### 1. Public Site
```bash
npm run dev:public
```
Visit http://localhost:5173

### 2. Merchant Portal
```bash
npm run dev:portal
```
Visit http://localhost:5174 (Note: API calls will fail without the worker proxying)

### 3. Control Plane (API + Portal)
```bash
npm run dev:worker
```
This runs the Worker at http://localhost:8787. It expects the portal to be built in `apps/merchant-portal-ui/dist`.

**Recommended Dev Flow:**
1. Build the portal: `npm run build --workspace=apps/merchant-portal-ui`
2. Run the worker: `npm run dev:worker`
3. Access the portal at http://localhost:8787/?shop=test.myshopify.com&host=test

## How to Deploy

### 1. Build Portal & Deploy Worker
```bash
npm run deploy
```
This builds the `apps/merchant-portal-ui` and deploys the `apps/control-plane` worker which includes the portal assets.

### 2. Deploy Public Site
Deploy `apps/public-site` to Cloudflare Pages via Git integration or:
```bash
cd apps/public-site
npm run build
npx wrangler pages deploy dist --project-name=apple-pay-public
```

## Integration Checklist

### 1. Cloudflare
- [ ] Create a KV Namespace.
- [ ] Seed KV with Apple Verification File:
  ```bash
  npx wrangler kv:key put applepay:partner-verification-file "$(cat apple-developer-merchantid-domain-association)" --binding=KV
  ```
- [ ] Enable Cloudflare for SaaS on your zone.
- [ ] Set `CF_SAAS_CNAME_TARGET` env var.
- [ ] Upload mTLS certificates (if using Enterprise or custom setup for Apple calls).

### 2. Shopify Partner Dashboard
- [ ] Create App.
- [ ] Set App URL to your Worker URL (e.g., `https://applepay-control-plane.your.workers.dev`).
- [ ] Set Allowed Redirection URLs:
  - `https://applepay-control-plane.your.workers.dev/auth/callback`
  - `https://applepay-control-plane.your.workers.dev/auth`
