-- Ver estrutura da tabela reseller_products
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reseller_products'
ORDER BY ordinal_position;

-- Ver alguns registros de exemplo
SELECT * FROM reseller_products LIMIT 3;
