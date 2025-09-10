import fs from 'node:fs';
import path from 'node:path';

async function ensureSharp() {
  try {
    const sharp = (await import('sharp')).default;
    return sharp;
  } catch (e) {
    console.error('\n[Erreur] Le module \"sharp\" n\'est pas installé.');
    console.error('Installe-le avec:');
    console.error('  npm i -D sharp');
    process.exit(1);
  }
}

async function main() {
  const sharp = await ensureSharp();
  const root = process.cwd();
  const src = path.join(root, 'assets', 'icon.png');
  const outDir = path.join(root, 'web', 'icons');

  if (!fs.existsSync(src)) {
    console.error(`[Erreur] Fichier source introuvable: ${src}`);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const targets = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 64,  name: 'favicon.png' },
  ];

  for (const t of targets) {
    const dest = path.join(outDir, t.name);
    console.log(`Génération ${t.size}x${t.size} -> ${dest}`);
    await sharp(src).resize(t.size, t.size, { fit: 'cover' }).png().toFile(dest);
  }

  console.log('\nIcônes générées avec succès dans web/icons/.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
