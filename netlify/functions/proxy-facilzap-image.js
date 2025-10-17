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
  async function tryFetch(url, extraHeaders = {}) {
    const h = { ...defaultHeaders, ...(extraHeaders || {}) };
    const res = await fetch(url, { headers: h });
    return res;
  }

  try {
    let res = await tryFetch(parsed.toString());

    // If upstream forbids us (403) and we have a FACILZAP_TOKEN configured, retry with Authorization
    const token = process.env.FACILZAP_TOKEN || process.env.NEXT_PUBLIC_FACILZAP_TOKEN || process.env.SYNC_PRODUCTS_TOKEN;
    if (res.status === 403 && token) {
      try {
        res = await tryFetch(parsed.toString(), { Authorization: `Bearer ${token}` });
      } catch {
        // swallow and continue to error handling below
      }
    }

    if (!res.ok) {
      // don't leak upstream URLs in the response. Log a short message and return upstream status.
      console.warn('proxy-facilzap-image: upstream fetch failed', { status: res.status, host: parsed.hostname });
      return { statusCode: res.status, body: 'failed to fetch image' };
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    if (!/^image\//i.test(contentType)) {
      return { statusCode: 415, body: 'unsupported media type' };
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) return { statusCode: 413, body: 'image too large' };

    const base64 = Buffer.from(buffer).toString('base64');

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
  console.error('proxy-facilzap-image error', { message: err instanceof Error ? err.message : String(err) });
  return { statusCode: 500, body: 'internal proxy error' };
  }
};
