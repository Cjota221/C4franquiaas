# ===========================================
# 🧪 Script de Teste do Webhook FácilZap
# ===========================================
# Execute este script no PowerShell para testar
# se o webhook está funcionando corretamente.
# ===========================================

# Configuração
$baseUrl = "https://c4franquiaas.netlify.app"
# $baseUrl = "http://localhost:3000"  # Descomente para teste local

$webhookSecret = "MinhaSenhaSecreta2025!"  # ⚠️ MUDE para o valor real!

# ===========================================
# TESTE 1: Verificar Status do Webhook
# ===========================================
Write-Host "`n🔍 TESTE 1: Verificando status do webhook..." -ForegroundColor Cyan

try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/webhook/facilzap" -Method GET
    Write-Host "✅ Status: $($statusResponse.status)" -ForegroundColor Green
    Write-Host "🔐 Segurança: $($statusResponse.security)" -ForegroundColor Yellow
    Write-Host "📅 Timestamp: $($statusResponse.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao verificar status: $_" -ForegroundColor Red
}

# ===========================================
# TESTE 2: Simular Evento de Estoque
# ===========================================
Write-Host "`n📦 TESTE 2: Simulando evento estoque_atualizado..." -ForegroundColor Cyan

$headers = @{
    "Content-Type" = "application/json"
    "X-FacilZap-Signature" = $webhookSecret
}

$estoquePayload = @{
    event = "estoque_atualizado"
    produto_id = "TESTE-001"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    data = @{
        id = "TESTE-001"
        nome = "Produto de Teste PowerShell"
        estoque = 99
        preco = 149.90
    }
} | ConvertTo-Json -Depth 3

Write-Host "📤 Enviando payload:" -ForegroundColor Gray
Write-Host $estoquePayload -ForegroundColor DarkGray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/webhook/facilzap" -Method POST -Headers $headers -Body $estoquePayload
    Write-Host "✅ Resposta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Erro HTTP $statusCode" -ForegroundColor Red
    
    if ($statusCode -eq 401) {
        Write-Host "🔐 A assinatura está incorreta! Verifique FACILZAP_WEBHOOK_SECRET" -ForegroundColor Yellow
    } elseif ($statusCode -eq 400) {
        Write-Host "📋 Payload inválido - verifique o formato" -ForegroundColor Yellow
    } else {
        Write-Host "Detalhes: $_" -ForegroundColor Red
    }
}

# ===========================================
# TESTE 3: Simular Produto Criado
# ===========================================
Write-Host "`n🆕 TESTE 3: Simulando evento produto_criado..." -ForegroundColor Cyan

$produtoPayload = @{
    event = "produto_criado"
    produto_id = "TESTE-002"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    data = @{
        id = "TESTE-002"
        nome = "Novo Produto via Webhook"
        preco = 79.90
        estoque = 25
        imagem = "https://via.placeholder.com/200"
        ativo = $true
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/webhook/facilzap" -Method POST -Headers $headers -Body $produtoPayload
    Write-Host "✅ Produto criado com sucesso!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

# ===========================================
# TESTE 4: Simular Estoque Zerado (trigger desativação)
# ===========================================
Write-Host "`n🚫 TESTE 4: Simulando estoque zerado..." -ForegroundColor Cyan

$estoqueZeroPayload = @{
    event = "estoque_atualizado"
    produto_id = "TESTE-001"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    data = @{
        id = "TESTE-001"
        estoque = 0
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/webhook/facilzap" -Method POST -Headers $headers -Body $estoqueZeroPayload
    Write-Host "✅ Estoque zerado - produto deve ser desativado nas franquias!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

# ===========================================
# RESUMO
# ===========================================
Write-Host "`n" + "=" * 50 -ForegroundColor Cyan
Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host @"

Para verificar se os testes funcionaram:

1. 🔍 Veja os logs no Netlify:
   https://app.netlify.com/sites/c4franquiaas/logs/functions

2. 📊 Consulte a tabela logs_sincronizacao no Supabase:
   SELECT * FROM logs_sincronizacao 
   WHERE tipo LIKE 'webhook%' 
   ORDER BY created_at DESC LIMIT 10;

3. 📦 Verifique se o produto foi criado/atualizado:
   SELECT * FROM produtos 
   WHERE id_externo LIKE 'TESTE%';

"@ -ForegroundColor White

Write-Host "🏁 Testes concluídos!" -ForegroundColor Green
