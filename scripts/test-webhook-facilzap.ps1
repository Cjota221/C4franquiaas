# Script de Teste do Webhook FacilZap
# Execute: .\scripts\test-webhook-facilzap.ps1

$baseUrl = "https://c4franquiaas.netlify.app"
$webhookSecret = "MinhaSenhaSecreta2025!"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TESTE 1: Verificando status do webhook" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/webhook/facilzap" -Method GET
    Write-Host "Status: $($statusResponse.status)" -ForegroundColor Green
    Write-Host "Auth habilitada: $($statusResponse.authentication.enabled)" -ForegroundColor Yellow
    Write-Host "Metodos aceitos:" -ForegroundColor Gray
    $statusResponse.authentication.methods | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
}
catch {
    Write-Host "Erro ao verificar status: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TESTE 2: Evento estoque_atualizado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$headers = @{
    "Content-Type"         = "application/json"
    "X-FacilZap-Signature" = $webhookSecret
}

$payload = @{
    event      = "estoque_atualizado"
    produto_id = "TESTE-001"
    timestamp  = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    data       = @{
        id      = "TESTE-001"
        nome    = "Produto de Teste"
        estoque = 99
        preco   = 149.90
    }
} | ConvertTo-Json -Depth 3

Write-Host "Enviando payload..." -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/webhook/facilzap" -Method POST -Headers $headers -Body $payload -ContentType "application/json"
    Write-Host "Sucesso!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
}
catch {
    $statusCode = $null
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
    }
    Write-Host "Erro HTTP $statusCode" -ForegroundColor Red
    if ($statusCode -eq 401) {
        Write-Host "Assinatura incorreta! Verifique FACILZAP_WEBHOOK_SECRET" -ForegroundColor Yellow
    }
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TESTE 3: Via Query Parameter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$payloadQuery = @{
    event      = "estoque_atualizado"
    produto_id = "TESTE-002"
    data       = @{
        id      = "TESTE-002"
        nome    = "Produto via Query"
        estoque = 50
    }
} | ConvertTo-Json -Depth 3

try {
    $urlComSecret = "$baseUrl/api/webhook/facilzap?secret=$webhookSecret"
    $response2 = Invoke-RestMethod -Uri $urlComSecret -Method POST -Body $payloadQuery -ContentType "application/json"
    Write-Host "Sucesso via query param!" -ForegroundColor Green
    Write-Host ($response2 | ConvertTo-Json -Depth 3) -ForegroundColor White
}
catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Testes concluidos!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifique os logs em:" -ForegroundColor White
Write-Host "1. Netlify: https://app.netlify.com/sites/c4franquiaas/logs/functions" -ForegroundColor Gray
Write-Host "2. Supabase: SELECT * FROM logs_sincronizacao WHERE tipo LIKE 'webhook%' ORDER BY created_at DESC" -ForegroundColor Gray
Write-Host ""
