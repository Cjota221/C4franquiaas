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
const CORS_ORIGIN = 'https://cjotarasteirinhas.com.br';

exports.handler = async function (event) {
  const encoded = event.queryStringParameters && event.queryStringParameters.url;
  if (!encoded) return { statusCode: 400, body: 'url query parameter is required' };

  let normalized = '';
  try {
    // decode and normalize
    normalized = decodeURIComponent(encoded);
  } catch (_) {
    // fallback to raw
    normalized = encoded;
  }

  // fix common malformed patterns
  normalized = normalized.replace(/%3A(?!%[0-9A-F]{2})/gi, '%3A');
  normalized = normalized.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');

  if (!normalized.includes('://')) {
    // treat as relative path on arquivos.facilzap.app.br
    normalized = `https://arquivos.facilzap.app.br/${normalized.replace(/^\/+/, '')}`;
  }

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch (err) {
    return { statusCode: 400, body: 'invalid url' };
  }

  // Allow only specific hosts
  const hostname = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  if (!allowed) return { statusCode: 403, body: 'host not allowed' };

  // fetch the image
  try {
    const res = await fetch(parsed.toString(), { headers: { 'User-Agent': 'cjotarasteirinhas-proxy/1.0' } });
    if (!res.ok) return { statusCode: res.status, body: 'failed to fetch image' };

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    // allow common image content-types only
    if (!/^image\//i.test(contentType)) {
      return { statusCode: 415, body: 'unsupported media type' };
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) return { statusCode: 413, body: 'image too large' };

    const base64 = Buffer.from(buffer).toString('base64');

    // Return base64 with CORS header pinned to the requested domain
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        // Hide the original facilzap domain from responses by not echoing the URL
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (err) {
    // Do not leak the upstream domain or raw URLs in the response body.
    console.error('proxy-facilzap-image error', err);
    return { statusCode: 500, body: 'internal proxy error' };
  }
};
"use strict";

exports.handler = async (event) => {
    // 1. Validar parâmetro
    const encodedUrl = event.queryStringParameters && event.queryStringParameters.url;
    if (!encodedUrl) return { statusCode: 400, body: "URL ausente" };

    // 2. Decodificar e corrigir URL
    let imageUrl;
    try {
        imageUrl = decodeURIComponent(encodedUrl);
        
        // Correção de URLs malformadas
        imageUrl = imageUrl
            .replace(/%3A(\d+)F/g, '%3A%$1F') // Corrige dupla codificação
            .replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
        
        // Forçar domínio correto se faltante
        if (!imageUrl.includes('://')) {
            imageUrl = `https://arquivos.facilzap.app.br/${imageUrl.replace(/^\//, '')}`;
        }
        
        const parsedUrl = new URL(imageUrl);
        
        // 3. Validar domínio
        if (!parsedUrl.hostname.endsWith('.facilzap.app.br')) {
            return { statusCode: 403, body: "Domínio bloqueado" };
        }
        
        // 4. Buscar imagem
        const response = await fetch(imageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (!response.ok) {
            return { statusCode: response.status, body: `Erro ao buscar imagem: ${response.statusText}` };
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
                'Access-Control-Allow-Origin': 'https://cjotarasteirinhas.com.br'
            },
            body: base64,
            isBase64Encoded: true
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Erro no processamento",
                originalUrl: encodedUrl,
                processedUrl: imageUrl,
                message: error instanceof Error ? error.message : String(error)
            })
        };
    }
};
