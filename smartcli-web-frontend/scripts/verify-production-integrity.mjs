import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const forbidden = [
  'Scenario Switcher',
  'Acme Platform',
  'prod-us-east-1',
  'Emergency rollback',
  'AI quota',
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

const files = (await filesUnder(dist)).filter((path) =>
  ['.js', '.css', '.html'].includes(extname(path))
);

const violations = [];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const marker of forbidden) {
    if (content.includes(marker)) violations.push(`${marker} in ${file}`);
  }
}

if (violations.length > 0) {
  console.error('Production build contains demo-only fixtures:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Production integrity verified across ${files.length} built assets.`);
