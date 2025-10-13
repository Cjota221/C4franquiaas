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
