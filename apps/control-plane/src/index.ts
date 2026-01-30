import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Polyfill types for environment where @cloudflare/workers-types is missing or not configured
interface KVNamespace {
  get(key: string, options?: unknown): Promise<string | null>;
  put(key: string, value: string | ReadableStream | ArrayBuffer, options?: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

interface Fetcher {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

type Bindings = {
  KV: KVNamespace;
  ASSETS: Fetcher;
  SHOPIFY_API_KEY: string;
  SHOPIFY_API_SECRET: string;
  SHOPIFY_APP_URL: string;
  CF_API_TOKEN: string;
  CF_ZONE_ID: string;
  CF_SAAS_CNAME_TARGET: string;
  APPLE_VERIFICATION_KV_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for public endpoints
app.use('/api/public/*', cors());
app.use('/applepay/session', cors());

// --- PUBLIC ROUTES ---

// 1. Verification File
app.get('/.well-known/apple-developer-merchantid-domain-association', async (c) => {
  const key = c.env.APPLE_VERIFICATION_KV_KEY || 'applepay:partner-verification-file';
  const file = await c.env.KV.get(key);
  if (!file) return c.text('Verification file not found', 404);
  return c.text(file);
});

// 2. Apple Pay Session (Proxy)
app.post('/applepay/session', async (c) => {
  const { validationURL } = await c.req.json() as {validationURL: string};
  if (!validationURL) return c.json({ error: 'Missing validationURL' }, 400);

  // In a real implementation, you need mTLS certs here to call Apple.
  // Workers require mTLS binding or an external proxy.
  // Assuming this worker has access via a binding or similar configuration not fully exposed in standard Wrangler yet without Enterprise.
  // We will simulate the response for this SaaS template structure.
  
  // Real call logic:
  // const cert = c.env.APPLE_CERT; 
  // const key = c.env.APPLE_KEY;
  // const res = await fetch(validationURL, { agent: new https.Agent({ cert, key }), ... });
  
  return c.json({ status: 'Simulated Session', validationURL });
});

// --- PUBLIC PREFLIGHT (For Public Site) ---

app.get('/api/public/preflight', async (c) => {
  const domain = c.req.query('domain');
  if (!domain) return c.json({ ok: false, reason: 'No domain provided' }, 400);

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const partnerFileKey = c.env.APPLE_VERIFICATION_KV_KEY || 'applepay:partner-verification-file';
  const expectedFile = await c.env.KV.get(partnerFileKey);

  if (!expectedFile) {
    return c.json({ ok: false, reason: 'Partner configuration error: Missing verification file in KV' }, 500);
  }

  try {
    const res = await fetch(`https://${cleanDomain}/.well-known/apple-developer-merchantid-domain-association`);
    if (!res.ok) {
        throw new Error(`Unreachable: ${res.status}`);
    }
    const text = await res.text();
    
    // Simple comparison
    if (text.trim() === expectedFile.trim()) {
      return c.json({ ok: true, domain: cleanDomain });
    } else {
      return c.json({ 
        ok: false, 
        domain: cleanDomain, 
        reason: 'File content mismatch. Ensure you have pointed your CNAME correctly.',
        dnsInstructions: {
            recordType: 'CNAME',
            host: cleanDomain,
            value: c.env.CF_SAAS_CNAME_TARGET
        }
      });
    }
  } catch (e: any) {
    return c.json({ 
        ok: false, 
        domain: cleanDomain, 
        reason: `Could not fetch verification file: ${e.message}`,
        dnsInstructions: {
            recordType: 'CNAME',
            host: cleanDomain,
            value: c.env.CF_SAAS_CNAME_TARGET
        }
    });
  }
});


// --- APP ROUTES (Simplified) ---

app.get('/api/config', (c) => {
  return c.json({
    shopifyApiKey: c.env.SHOPIFY_API_KEY,
    appUrl: c.env.SHOPIFY_APP_URL
  });
});

app.get('/auth', (c) => {
  const shop = c.req.query('shop');
  if (!shop) return c.text('Missing shop parameter', 400);
  
  const redirectUri = `${c.env.SHOPIFY_APP_URL}/auth/callback`;
  const permissionUrl = `https://${shop}/admin/oauth/authorize?client_id=${c.env.SHOPIFY_API_KEY}&scope=read_products&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  return c.redirect(permissionUrl);
});

app.get('/auth/callback', (c) => {
  const { shop, host, code } = c.req.query();
  // Here you would exchange code for access token and store in DB/KV
  // Then redirect to the app UI
  const target = `https://${shop}/admin/apps/${c.env.SHOPIFY_API_KEY}`; // Simplified deep link
  // In production: Redirect to embedded app URL with host param
  return c.redirect(`/?shop=${shop}&host=${host}`);
});

// Middleware for /api/* (except public) to check Auth would go here
// app.use('/api/shop', authMiddleware);

app.get('/api/shop', (c) => {
  // Mock response based on spec
  return c.json({
    shop: "demo.myshopify.com",
    shopId: "gid://shopify/Shop/1",
    shopName: "Demo Store",
    primaryDomain: c.req.query('domain') || "store.example.com"
  });
});

app.get('/api/applepay/status', (c) => {
  const domain = c.req.query('domain');
  if (!domain) return c.json({ status: 'DNS_NOT_CONFIGURED', lastError: 'No domain provided' });

  // Mock logic
  return c.json({
    domain,
    status: 'DNS_NOT_CONFIGURED',
    cloudflareHostnameStatus: 'PENDING',
    cloudflareSslStatus: 'INITIALIZING',
    lastError: null,
    dnsInstructions: {
      recordType: 'CNAME',
      host: domain,
      value: c.env.CF_SAAS_CNAME_TARGET,
      note: 'Point your custom domain to our SaaS target.'
    },
    appleMerchantId: null
  });
});

app.post('/api/applepay/onboard', async (c) => {
    // This endpoint would:
    // 1. Call Cloudflare API to create Custom Hostname
    // 2. Wait for validation
    // 3. Call Apple API to register merchant
    return c.json({
        domain: 'store.example.com',
        status: 'PENDING',
        cloudflareHostnameStatus: 'PENDING_VALIDATION',
        cloudflareSslStatus: 'PENDING_VALIDATION',
        lastError: null,
        dnsInstructions: null,
        appleMerchantId: null
    });
});

app.post('/api/applepay/check', (c) => {
    return c.json({
        debug: true,
        steps: ['Check CF', 'Check SSL', 'Check Apple'],
        result: 'All systems go'
    });
});

export default app;