-- ============================================
-- 🧪 TESTE DIRETO: Executar função de exclusão
-- ============================================
-- Testar a função diretamente para ver o erro real
-- ============================================

-- Testar com os IDs que não foram excluídos
SELECT excluir_produtos_completo(ARRAY[
  '1c7eae0a-4357-4e1d-babe-f5926ad1cb66'::uuid,
  '34977799-69d0-4ed4-8f60-5252e4866899'::uuid,
  '375ba9cd-4528-4790-aca3-e73967159a28'::uuid,
  '51b2ae57-605d-4c9f-9e4b-335f583e88df'::uuid,
  '5bb1b98d-be33-40ed-9970-08a37c304b05'::uuid
]::uuid[]);

-- Se retornar algo como:
-- {"success": false, "error": "..."}
-- Veremos qual é o erro real!

-- ============================================
-- Ou teste com apenas 1 produto:
-- ============================================

SELECT excluir_produtos_completo(ARRAY[
  '1c7eae0a-4357-4e1d-babe-f5926ad1cb66'::uuid
]::uuid[]);
