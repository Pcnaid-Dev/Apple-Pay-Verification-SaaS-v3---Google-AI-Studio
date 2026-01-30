import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import PublicApp from './apps/public-site/src/App';
import MerchantPortalApp from './apps/merchant-portal-ui/src/App';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';

// --- MOCK API LAYER FOR PREVIEW ---
// This allows the UI to function without the actual Cloudflare Worker backend running
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
  const path = url.toString();
  
  if (path.startsWith('/api/')) {
    console.log(`[MockAPI] ${options?.method || 'GET'} ${path}`);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    if (path.includes('/api/config')) {
      return new Response(JSON.stringify({ shopifyApiKey: 'mock_key', appUrl: 'http://localhost' }));
    }
    
    if (path.includes('/api/shop')) {
      return new Response(JSON.stringify({
        shop: "demo-store.myshopify.com",
        shopName: "Apple Pay Demo Store",
        primaryDomain: "shop.example.com"
      }));
    }

    if (path.includes('/api/applepay/status')) {
      return new Response(JSON.stringify({
        domain: "shop.example.com",
        status: "DNS_NOT_CONFIGURED",
        cloudflareHostnameStatus: "PENDING",
        cloudflareSslStatus: "INITIALIZING",
        lastError: null,
        dnsInstructions: {
          recordType: "CNAME",
          host: "shop.example.com",
          value: "target.cloudflare-saas.com",
          note: "Point your custom domain to our SaaS target."
        }
      }));
    }

    if (path.includes('/api/applepay/onboard')) {
      return new Response(JSON.stringify({
        domain: "shop.example.com",
        status: "PENDING",
        cloudflareHostnameStatus: "PENDING_VALIDATION",
        cloudflareSslStatus: "PENDING_VALIDATION",
        dnsInstructions: null
      }));
    }

    if (path.includes('/api/applepay/check')) {
      return new Response(JSON.stringify({
        debug: true,
        steps: ['Check Cloudflare', 'Check SSL', 'Check Apple Merchant ID'],
        result: 'All systems operational (Mock)'
      }));
    }

    if (path.includes('/api/public/preflight')) {
       // Mock for public site domain check
       return new Response(JSON.stringify({
         ok: false,
         domain: 'example.com',
         reason: 'This is a mock response. In a real app, this checks the .well-known file.',
         dnsInstructions: {
            recordType: 'CNAME',
            host: 'example.com',
            value: 'saas.provider.com'
         }
       }));
    }
  }

  return originalFetch(url, options);
};

// --- APP SHELL ---

function AppShell() {
  const [currentApp, setCurrentApp] = useState<'public' | 'portal'>('public');

  // Fix for Merchant Portal expecting query params
  useEffect(() => {
    if (currentApp === 'portal') {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('shop')) {
        url.searchParams.set('shop', 'demo.myshopify.com');
        url.searchParams.set('host', 'base64_mock_host');
        window.history.replaceState({}, '', url);
      }
    }
  }, [currentApp]);

  return (
    <div>
      {/* Navigation Bar for the Preview Shell */}
      <div className="bg-slate-900 text-white p-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="font-mono text-sm font-bold text-yellow-400">
          MONOREPO PREVIEW
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setCurrentApp('public')}
            className={`px-4 py-1 rounded text-sm transition ${currentApp === 'public' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Public Marketing Site
          </button>
          <button 
            onClick={() => setCurrentApp('portal')}
             className={`px-4 py-1 rounded text-sm transition ${currentApp === 'portal' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Merchant Portal App
          </button>
        </div>
      </div>

      {/* App Content */}
      <div className="relative">
        {currentApp === 'public' ? (
          <PublicApp />
        ) : (
          <div className="min-h-screen bg-[#f1f2f3]"> {/* Polaris typical bg */}
            <AppProvider i18n={enTranslations}>
              <MerchantPortalApp />
            </AppProvider>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
