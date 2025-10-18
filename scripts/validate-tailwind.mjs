import { createRequire } from 'module';
const require = createRequire(import.meta.url);

(async function() {
  try {
    const cfg = (await import('../tailwind.config.mjs')).default;
    console.log('tailwind.config.mjs loaded OK');
    console.log('config.content length:', (cfg.content || []).length);
    try {
      const pkg = require('tailwindcss/package.json');
      console.log('tailwindcss package found, version:', pkg.version);
    } catch (pkgErr) {
      console.warn('tailwindcss package not found or cannot read version:', pkgErr.message);
    }
  } catch (err) {
    console.error('Failed to load tailwind.config.mjs:');
    console.error(err);
    process.exit(1);
  }
})();
