import bcrypt from 'bcryptjs';

const senha = 'Admin@123';
const hashAntigo = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
const hashNovo = '$2b$10$z2bLNVrDuhN4zuraQixvQuo2R0KWMAv7oxsHXb7C7pIY0.CSJpmG2';

console.log('\n🔐 Testando bcrypt...\n');

console.log('Senha:', senha);
console.log('\nHash antigo (Laravel):');
console.log(hashAntigo);
console.log('Válido?', await bcrypt.compare(senha, hashAntigo));
console.log('Válido com "password"?', await bcrypt.compare('password', hashAntigo));

console.log('\nHash novo (gerado agora):');
console.log(hashNovo);
console.log('Válido?', await bcrypt.compare(senha, hashNovo));

// Testar com outros valores comuns
console.log('\n\n🧪 Testando senhas comuns com hash antigo:');
const senhasComuns = ['Admin@123', 'admin@123', 'password', '123456', 'admin'];
for (const s of senhasComuns) {
  const valido = await bcrypt.compare(s, hashAntigo);
  if (valido) {
    console.log(`✅ ENCONTRADO: "${s}"`);
  }
}
