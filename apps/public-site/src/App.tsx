import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2, ArrowRight, ShieldCheck, CreditCard, Globe } from 'lucide-react';

// Safely access env variables, defaulting to empty object if undefined (browser preview)
const env = (import.meta as any).env || {};
const CONTROL_PLANE_URL = env.VITE_CONTROL_PLANE_URL || 'http://localhost:8787';
const SHOPIFY_APP_LISTING_URL = env.VITE_SHOPIFY_APP_LISTING_URL || '#';

interface PreflightResult {
  ok: boolean;
  domain: string;
  reason?: string;
  dnsInstructions?: {
    recordType: string;
    host: string;
    value: string;
  };
}

export default function App() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;
    
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`${CONTROL_PLANE_URL}/api/public/preflight?domain=${encodeURIComponent(domain)}`);
      if (!res.ok) throw new Error('Failed to check domain');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Could not connect to verification service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold tracking-tight">ApplePayVerify</span>
          </div>
          <nav className="flex gap-6">
            <a href="#how-it-works" className="text-sm font-medium hover:text-blue-600">How it Works</a>
            <a href="#pricing" className="text-sm font-medium hover:text-blue-600">Pricing</a>
            <a href={SHOPIFY_APP_LISTING_URL} className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              Install on Shopify
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center bg-white">
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">
          Enable Apple Pay on <span className="text-blue-600">Custom Domains</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          The easiest way to verify your custom domain for Apple Pay on Shopify. 
          Automated verification file hosting and Cloudflare integration in seconds.
        </p>
        <div className="flex justify-center gap-4">
          <a href={SHOPIFY_APP_LISTING_URL} className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-800 transition">
            Get Started
            <ArrowRight className="h-5 w-5" />
          </a>
          <a href="https://admin.shopify.com/store/YOUR_STORE_HANDLE/apps/YOUR_APP_HANDLE" className="flex items-center gap-2 bg-gray-100 text-gray-900 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-200 transition">
            Open App
          </a>
        </div>
      </section>

      {/* Domain Checker Tool */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Check Your Domain Status</h2>
            <form onSubmit={checkDomain} className="flex gap-4 mb-6">
              <input 
                type="text" 
                placeholder="example.com" 
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Check Now'}
              </button>
            </form>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
                <XCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            {result && (
              <div className={`p-6 rounded-lg border ${result.ok ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-start gap-4">
                  {result.ok ? <CheckCircle className="h-6 w-6 text-green-600 mt-1" /> : <XCircle className="h-6 w-6 text-yellow-600 mt-1" />}
                  <div>
                    <h3 className="font-bold text-lg mb-2">
                      {result.ok ? 'Ready for Verification' : 'Verification Issue Detected'}
                    </h3>
                    <p className="text-gray-700 mb-4">{result.reason || 'Your domain is correctly serving the Apple Pay verification file.'}</p>
                    
                    {result.dnsInstructions && (
                      <div className="bg-white p-4 rounded border border-gray-200 text-sm font-mono">
                        <div className="text-gray-500 mb-1">Required DNS Record:</div>
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                          <span className="font-bold">Type:</span> <span>{result.dnsInstructions.recordType}</span>
                          <span className="font-bold">Host:</span> <span>{result.dnsInstructions.host}</span>
                          <span className="font-bold">Value:</span> <span className="break-all">{result.dnsInstructions.value}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">Why use our verification service?</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-4">Global Verification File</h3>
            <p className="text-gray-600">We host the required Apple association file on our edge network, instantly accessible from your domain.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-4">Automated Registration</h3>
            <p className="text-gray-600">One-click API integration directly with Apple's servers to register your merchant ID securely.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-4">Continuous Monitoring</h3>
            <p className="text-gray-600">Our dashboard keeps track of your SSL status and domain configuration to ensure zero downtime.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold mb-4">ApplePayVerify</h4>
            <p className="text-sm">Simplifying payment verification for modern commerce.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Pricing</a></li>
              <li><a href="#" className="hover:text-white">Docs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}