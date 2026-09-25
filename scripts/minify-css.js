import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssDir = path.resolve(__dirname, '../assets/css');

function safeMinifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\r\n|\r|\n/g, ' ')      // collapse newlines
    .replace(/\s+/g, ' ')             // collapse whitespace
    .replace(/\s*([{}:;,>+~])\s*/g, '$1') // remove space around delimiters
    .replace(/;}/g, '}')              // remove trailing semicolons
    .trim();
}

const targetFiles = ['kwave-drawer.css', 'styles.css'];

for (const file of targetFiles) {
  const filePath = path.join(cssDir, file);
  if (!fs.existsSync(filePath)) continue;

  const minFilePath = path.join(cssDir, file.replace(/\.css$/, '.min.css'));
  const rawCss = fs.readFileSync(filePath, 'utf8');
  const minified = safeMinifyCss(rawCss);

  fs.writeFileSync(minFilePath, minified, 'utf8');
  console.log(`✓ Minified ${file} -> ${path.basename(minFilePath)} (${rawCss.length}B -> ${minified.length}B)`);
}
