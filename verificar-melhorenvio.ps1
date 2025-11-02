# Script de Verificação - Melhor Envio
# Execute: .\verificar-melhorenvio.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VERIFICAÇÃO - MELHOR ENVIO CONFIG" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Ler .env.local
$envPath = ".\.env.local"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    # Extrair valores
    if ($envContent -match 'MELHORENVIO_CLIENT_ID=(\d+)') {
        $clientId = $matches[1]
        Write-Host "✓ Client ID: $clientId" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Client ID não encontrado!" -ForegroundColor Red
    }
    
    if ($envContent -match 'MELHORENVIO_CLIENT_SECRET=([^\s]+)') {
        $secret = $matches[1]
        $secretPreview = $secret.Substring(0, [Math]::Min(10, $secret.Length))
        Write-Host "✓ Client Secret: $secretPreview..." -ForegroundColor Green
    }
    else {
        Write-Host "✗ Client Secret não encontrado!" -ForegroundColor Red
    }
    
    if ($envContent -match 'MELHORENVIO_SANDBOX=(true|false)') {
        $sandbox = $matches[1]
        $ambiente = if ($sandbox -eq 'true') { 'SANDBOX (Testes)' } else { 'PRODUÇÃO (Real)' }
        Write-Host "✓ Ambiente: $ambiente" -ForegroundColor $(if ($sandbox -eq 'true') { 'Yellow' } else { 'Magenta' })
    }
    
    if ($envContent -match 'NEXT_PUBLIC_BASE_URL=([^\s]+)') {
        $baseUrl = $matches[1]
        Write-Host "✓ Base URL: $baseUrl" -ForegroundColor Green
    }
    
    Write-Host "`n----------------------------------------" -ForegroundColor Cyan
    Write-Host "URLs Importantes:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    
    $redirectUri = "$baseUrl/admin/configuracoes/melhorenvio/callback"
    Write-Host "Redirect URI (copie para o Melhor Envio):" -ForegroundColor Yellow
    Write-Host $redirectUri -ForegroundColor White
    
    Write-Host "`nURL de Autorização:" -ForegroundColor Yellow
    if ($sandbox -eq 'true') {
        $authUrl = "https://sandbox.melhorenvio.com.br/oauth/authorize?client_id=$clientId&redirect_uri=$([uri]::EscapeDataString($redirectUri))&response_type=code&scope=cart-read%20cart-write%20companies-read%20companies-write%20coupons-read%20coupons-write%20notifications-read%20orders-read%20products-read%20products-write%20purchases-read%20shipping-calculate%20shipping-cancel%20shipping-checkout%20shipping-companies%20shipping-generate%20shipping-preview%20shipping-print%20shipping-share%20shipping-tracking%20ecommerce-shipping%20transactions-read"
        Write-Host $authUrl -ForegroundColor White
        Write-Host "`nPainel Sandbox:" -ForegroundColor Yellow
        Write-Host "https://sandbox.melhorenvio.com.br/painel/gerenciar/tokens" -ForegroundColor White
    }
    else {
        $authUrl = "https://melhorenvio.com.br/oauth/authorize?client_id=$clientId&redirect_uri=$([uri]::EscapeDataString($redirectUri))&response_type=code&scope=cart-read%20cart-write%20companies-read%20companies-write%20coupons-read%20coupons-write%20notifications-read%20orders-read%20products-read%20products-write%20purchases-read%20shipping-calculate%20shipping-cancel%20shipping-checkout%20shipping-companies%20shipping-generate%20shipping-preview%20shipping-print%20shipping-share%20shipping-tracking%20ecommerce-shipping%20transactions-read"
        Write-Host $authUrl -ForegroundColor White
        Write-Host "`nPainel Produção:" -ForegroundColor Yellow
        Write-Host "https://melhorenvio.com.br/painel/gerenciar/tokens" -ForegroundColor White
    }
    
    Write-Host "`n========================================`n" -ForegroundColor Cyan
    
}
else {
    Write-Host "✗ Arquivo .env.local não encontrado!" -ForegroundColor Red
}
