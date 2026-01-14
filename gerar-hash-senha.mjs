import bcrypt from 'bcryptjs';

const senha = 'Admin@123';
const hash = await bcrypt.hash(senha, 10);

console.log('\n🔐 Hash gerado para senha "Admin@123":');
console.log(hash);
console.log('\n✅ Execute este SQL no Supabase:');
console.log(`
UPDATE grade_fechada_usuarios 
SET senha_hash = '${hash}'
WHERE email = 'admin@gradefechada.com';
`);
