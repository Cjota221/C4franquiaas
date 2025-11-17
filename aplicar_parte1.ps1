$file = "app\admin\produtos\page.tsx"
$content = [System.IO.File]::ReadAllText((Join-Path (Get-Location) $file), [System.Text.Encoding]::UTF8)

Write-Host "Aplicando refatoração completa..." -ForegroundColor Cyan

# 3. Remover busca de produtos com margem
$old3 = @"
      if (error) throw error;

      // Buscar preços personalizados de TODOS os produtos para identificar "novos"
      const produtoIds = (data || []).map((r: ProdutoRow) => r.id);
      const { data: precosPersonalizados } = await createClient()
        .from('produtos_franqueadas')
        .select('produto_id')
        .in('produto_id', produtoIds);

      // Criar Set de produtos que JÁ TÊM margem configurada
      const produtosComMargem = new Set(precosPersonalizados?.map(p => p.produto_id) || []);

      const mapped: ProdutoType[] = (data || []).map((r: ProdutoRow) => {
"@
$new3 = @"
      if (error) throw error;

      const mapped: ProdutoType[] = (data || []).map((r: ProdutoRow) => {
"@
$content = $content.Replace($old3, $new3)
Write-Host "  3. Removida busca de margem"

# 4. Atualizar mapeamento de produtos
$old4 = "          categorias: null, // Será carregado depois da migração
          temMargem: produtosComMargem.has(id), //  NOVO: indica se produto já tem margem
        };
      });

      //  Aplicar filtro de `"Produtos Novos`" (sem margem)
      let produtosFiltradosLocal = mapped;
      if (filtroNovos) {
        produtosFiltradosLocal = produtosFiltradosLocal.filter(p => !p.temMargem);
        console.log(`` Filtro `"Produtos Novos`": `${produtosFiltradosLocal.length} de `${mapped.length}``);
      }

      setProdutosFiltrados(produtosFiltradosLocal);"
$new4 = "          categorias: null,
          created_at: r.created_at || undefined,
        };
      });

      setProdutosFiltrados(mapped);"
$content = $content.Replace($old4, $new4)
Write-Host "  4. Mapeamento atualizado"

# 5. Atualizar dependências do useEffect
$content = $content.Replace('], [pagina, debouncedSearchTerm, filtroCategoria, filtroNovos, carregarProdutos]);', '], [pagina, debouncedSearchTerm, filtroCategoria, carregarProdutos]);')
Write-Host "  5. UseEffect atualizado"

# 6. Atualizar dependências do callback
$content = $content.Replace('}, [setStatusMsg, filtroNovos]);', '}, [setStatusMsg, filtroApenasComEstoque, ordenacao]);')
Write-Host "  6. Callback deps atualizadas"

[System.IO.File]::WriteAllText((Join-Path (Get-Location) $file), $content, [System.Text.Encoding]::UTF8)
Write-Host "`n Parte 1 aplicada!" -ForegroundColor Green