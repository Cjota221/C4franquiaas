# Script de Configuração Rápida - C4 Franquias Admin
# Execute este script para criar o arquivo .env.local

Write-Host "🚀 C4 Franquias Admin - Setup Local" -ForegroundColor Cyan
Write-Host ""

# Verificar se já existe .env.local
if (Test-Path ".env.local") {
    Write-Host "⚠️  Arquivo .env.local já existe!" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseja sobrescrevê-lo? (s/n)"
    if ($overwrite -ne "s") {
        Write-Host "Operação cancelada." -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "📝 Por favor, forneça suas credenciais do Supabase:" -ForegroundColor Green
Write-Host "   (Encontre em: https://supabase.com/dashboard → Settings → API)" -ForegroundColor Gray
Write-Host ""

# Solicitar URL do Supabase
$supabaseUrl = Read-Host "🔗 SUPABASE_URL (ex: https://xxxxx.supabase.co)"

# Solicitar ANON KEY
$supabaseAnonKey = Read-Host "🔑 SUPABASE_ANON_KEY"

# Opcional: FacilZap Token
Write-Host ""
$facilzapToken = Read-Host "🛒 FACILZAP_API_TOKEN (opcional, pressione Enter para pular)"

# Criar arquivo .env.local
$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey

# FácilZap API
$(if ($facilzapToken) { "FACILZAP_API_TOKEN=$facilzapToken" } else { "# FACILZAP_API_TOKEN=" })

# Debug Mode
NEXT_PUBLIC_DEBUG_MODE=true
DEBUG_SYNC=true
"@

# Salvar arquivo
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ Arquivo .env.local criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Execute: npm run dev" -ForegroundColor White
Write-Host "   2. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📊 Para acessar produtos: http://localhost:3000/admin/produtos" -ForegroundColor Yellow
Write-Host ""

# Perguntar se quer iniciar o servidor
$startServer = Read-Host "Deseja iniciar o servidor agora? (s/n)"
if ($startServer -eq "s") {
    Write-Host ""
    Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
    npm run dev
}
