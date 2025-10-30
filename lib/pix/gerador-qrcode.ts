/**
 * Gerador de QR Code PIX
 * Converte payload PIX em imagem QR Code
 */

import QRCode from 'qrcode';

/**
 * Gera QR Code em formato Base64 (imagem PNG)
 * @param payload - String do payload PIX (gerado por gerador-payload.ts)
 * @returns String base64 da imagem (data:image/png;base64,...)
 */
export async function gerarQRCodePix(payload: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(payload, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',  // Cor do QR Code
        light: '#FFFFFF'  // Cor do fundo
      },
      errorCorrectionLevel: 'M' // Nível de correção de erro
    });

    console.log('✅ [QR Code] Imagem gerada com sucesso');
    return qrCodeDataURL;
  } catch (error) {
    console.error('❌ [QR Code] Erro ao gerar imagem:', error);
    throw new Error('Falha ao gerar QR Code');
  }
}

/**
 * Gera QR Code em formato SVG (mais leve)
 * @param payload - String do payload PIX
 * @returns String SVG
 */
export async function gerarQRCodePixSVG(payload: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(payload, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return svgString;
  } catch (error) {
    console.error('❌ [QR Code SVG] Erro ao gerar:', error);
    throw new Error('Falha ao gerar QR Code SVG');
  }
}

/**
 * Salva QR Code como arquivo (para testes)
 * @param payload - String do payload PIX
 * @param caminho - Caminho onde salvar (ex: './qrcode.png')
 */
export async function salvarQRCodePix(payload: string, caminho: string): Promise<void> {
  try {
    await QRCode.toFile(caminho, payload, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log(`✅ [QR Code] Arquivo salvo em: ${caminho}`);
  } catch (error) {
    console.error('❌ [QR Code] Erro ao salvar arquivo:', error);
    throw new Error('Falha ao salvar QR Code');
  }
}
