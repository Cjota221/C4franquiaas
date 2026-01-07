# Script para verificar banners das revendedoras

# Carregar variáveis de ambiente do arquivo .env.local
$envFile = Get-Content .env.local
foreach ($line in $envFile) {
    if ($line -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

Write-Host "✅ Variáveis de ambiente carregadas" -ForegroundColor Green
Write-Host ""

# Executar o script TypeScript
npx tsx verificar-banners-revendedoras.ts
