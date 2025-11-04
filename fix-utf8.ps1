# Mapeamento de correções UTF-8
 = @{
    'ConfiguraÃƒÆ.*?Âµes dinÃƒÆ.*?Â¢micas' = 'Configurações dinâmicas'
    'CustomizaÃƒÆ.*?Âµes' = 'Customizações'
    'chamadas ÃƒÆ.*?Â ' = 'chamadas à'
    'sugestÃƒÆ.*?Âµes' = 'sugestões'
    'usuÃƒÆ.*?Ârio' = 'usuário'
    'FUNÃƒÆ.*?Â¢O' = 'FUNÇÃO'
    'pÃƒÆ.*?Âgina' = 'página'
    'SUGESTÃƒÆ.*?Â¢O' = 'SUGESTÃO'
    'dinÃƒÆ.*?Â¢micas' = 'dinâmicas'
    'posiÃƒÆ.*?Â§ÃƒÆ.*?Â£o' = 'posição'
    'logo ÃƒÆ.*?Â' = 'logo é'
    'ÃƒÆ.*?ÂÃƒÆ.*?Â¢' = ''
    'CÃƒÆ.*?Â³d:' = 'Cód:'
    'O que vocÃƒÆ.*?Âª procura?' = 'O que você procura?'
    'Ver todos os resultados.*?Â¢' = 'Ver todos os resultados'
}

 = Get-Content 'components\loja\LojaHeader.tsx' -Raw -Encoding UTF8

foreach ( in .Keys) {
     = []
     =  -replace , 
}

 | Set-Content 'components\loja\LojaHeader.tsx' -Encoding UTF8 -NoNewline
Write-Host ' Arquivo limpo!'
