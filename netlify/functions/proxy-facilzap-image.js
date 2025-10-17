"use strict";

// Proxy function for images from FácilZap. Returns the image as base64 with
// Access-Control-Allow-Origin fixed to https://cjotarasteirinhas.com.br
// Security/perf notes:
// - Only allows requests to known FácilZap image hosts.
// - Normalizes malformed paths and forces https.
// - Adds Cache-Control to help CDN caching.
// - Enforces an upper size limit to avoid being used as an arbitrary proxy.

const ALLOWED_HOSTS = [
  'arquivos.facilzap.app.br',
  'facilzap.app.br',
];

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const CORS_ORIGIN = 'https://c4franquiaas.netlify.app';

exports.handler = async function (event) {
  // Prefer explicit 'facilzap' param (original URL) when provided, fall back to 'url'
  const encoded = event.queryStringParameters && (event.queryStringParameters.facilzap ?? event.queryStringParameters.url);
  if (!encoded) return { statusCode: 400, body: 'url query parameter is required' };

  let normalized = '';
  try {
    // decode and normalize (be permissive)
    try {
      normalized = decodeURIComponent(encoded);
    } catch {
      // try raw if decode fails
      normalized = encoded;
    }

    // replace stray spaces and control chars
    normalized = normalized.replace(/\s+/g, '%20');
    // fix common malformed patterns
    normalized = normalized.replace(/%3A(?!%[0-9A-F]{2})/gi, '%3A');
    normalized = normalized.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');

    // if missing scheme, treat as relative path on arquivos.facilzap.app.br
    if (!normalized.includes('://') && !normalized.startsWith('data:')) {
      normalized = `https://arquivos.facilzap.app.br/${normalized.replace(/^\/+/, '')}`;
    }

    // try multiple parsing strategies before failing
    let parsed = null;
    const parsers = [
      (s) => new URL(s),
      (s) => new URL(encodeURI(s)),
      (s) => new URL(s.startsWith('http') ? s : `https://${s}`),
    ];
    let lastErr = null;
    for (const p of parsers) {
      try {
        parsed = p(normalized);
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!parsed) {
      console.warn('proxy-facilzap-image: invalid url after normalization', { original: encoded, lastError: lastErr instanceof Error ? lastErr.message : String(lastErr) });
      return { statusCode: 400, body: 'invalid url' };
    }
  } catch (err) {
    console.warn('proxy-facilzap-image: normalization failure', { original: encoded, err: err instanceof Error ? err.message : String(err) });
    return { statusCode: 400, body: 'invalid url' };
  }

  // Allow only specific hosts
  const hostname = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  if (!allowed) return { statusCode: 403, body: 'host not allowed' };

  // fetch the image with conservative headers; some hosts block unknown UAs or missing referer
  const defaultHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; cjotarasteirinhas-proxy/1.0)', Referer: 'https://app.facilzap.app.br' };

  // small helper to fetch with timeout
  async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal, ...options });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  // Try multiple attempts to avoid transient network errors
  const MAX_RETRIES = 2;
  const token = process.env.FACILZAP_TOKEN || process.env.NEXT_PUBLIC_FACILZAP_TOKEN || process.env.SYNC_PRODUCTS_TOKEN;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.debug('proxy-facilzap-image: fetching', { url: parsed.toString(), attempt });
      const headers = { ...defaultHeaders };
      let res = await fetchWithTimeout(parsed.toString(), { headers }, 10000);

      // If upstream forbids us (403) and we have a token, retry with Authorization
      if (res.status === 403 && token) {
        console.debug('proxy-facilzap-image: retrying with token (403 received)');
        headers.Authorization = `Bearer ${token}`;
        res = await fetchWithTimeout(parsed.toString(), { headers }, 10000);
      }

      if (!res.ok) {
        // Log details but avoid echoing full upstream URL to clients
        console.warn('proxy-facilzap-image: upstream responded with error', { status: res.status, host: parsed.hostname, attempt });
        // For 5xx/4xx respond with the same status so Netlify logs are informative
        const text = await res.text().catch(() => '');
        console.debug('proxy-facilzap-image: upstream body snippet', { snippet: text.slice(0, 200) });
        return { statusCode: res.status, body: `upstream returned status ${res.status}` };
      }

      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      if (!/^image\//i.test(contentType)) {
        const txt = await res.text().catch(() => '');
        console.warn('proxy-facilzap-image: upstream returned non-image content', { contentType, snippet: txt.slice(0, 200) });
        return { statusCode: 415, body: 'unsupported media type' };
      }

      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_BYTES) {
        console.warn('proxy-facilzap-image: image too large', { length: arrayBuffer.byteLength });
        return { statusCode: 413, body: 'image too large' };
      }

      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': CORS_ORIGIN,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
        body: base64,
        isBase64Encoded: true,
      };
    } catch (err) {
      // AbortError or network error
      const msg = err && err.message ? err.message : String(err);
      console.error('proxy-facilzap-image: fetch attempt failed', { attempt, err: msg });
      if (attempt === MAX_RETRIES) {
        // Final failure — return a 502 to indicate gateway problem
        return { statusCode: 502, body: `gateway error: ${msg}` };
      }
      // otherwise retry after small delay
      await new Promise((res) => setTimeout(res, 300 * attempt));
    }
  }
};
