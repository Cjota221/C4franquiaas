# Script para corrigir encoding UTF-8 corretamente
$file = "c:\Users\carol\c4-franquias-admin\app\revendedora\personalizacao\page.tsx"

# Ler arquivo como bytes
$bytes = [System.IO.File]::ReadAllBytes($file)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Corrigir caracteres problemáticos individuais
$content = $content -replace 'op��es', 'opções'
$content = $content -replace 'espec�fica', 'específica'
$content = $content -replace 'bot�o', 'botão'
$content = $content -replace 'cabe�alho', 'cabeçalho'
$content = $content -replace 'prim�ria', 'primária'
$content = $content -replace 'padr�o', 'padrão'
$content = $content -replace 'modera��o', 'moderação'
$content = $content -replace 'submiss�es', 'submissões'
$content = $content -replace 'Personaliza��o', 'Personalização'
$content = $content -replace 't�tulo', 'título'
$content = $content -replace 'p�gina', 'página'
$content = $content -replace 'Usu�rio', 'Usuário'
$content = $content -replace 'aprova��o', 'aprovação'
$content = $content -replace 'notifica��o', 'notificação'
$content = $content -replace 'altera��es', 'alterações'
$content = $content -replace 'CAT�LOGO', 'CATÁLOGO'
$content = $content -replace 'VIS�VEL', 'VISÍVEL'
$content = $content -replace 'DESCRI��O', 'DESCRIÇÃO'
$content = $content -replace 'voc�!', 'você!'
$content = $content -replace 'Bot�es', 'Botões'
$content = $content -replace 'gr�tis', 'grátis'
$content = $content -replace '\?\? ', '📝 '

# Corrigir problemas criados por replace anterior
$content = $content -replace 'ESTÁados', 'Estados'
$content = $content -replace 'usESTÁate', 'useState'
$content = $content -replace 'SE��O', 'SEÇÃO'

# Salvar com UTF-8 sem BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)

Write-Host "Arquivo corrigido com sucesso!" -ForegroundColor Green
