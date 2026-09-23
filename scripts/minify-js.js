import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as terser from 'terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsDir = path.resolve(__dirname, '../assets/js');

async function minifyAll() {
  const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.min.js'));
  console.log(`Minifying ${files.length} JavaScript files in assets/js...`);

  let totalOriginal = 0;
  let totalMinified = 0;

  for (const file of files) {
    const filePath = path.join(jsDir, file);
    const minFilePath = path.join(jsDir, file.replace(/\.js$/, '.min.js'));
    const sourceCode = fs.readFileSync(filePath, 'utf8');

    try {
      const minified = await terser.minify(sourceCode, {
        compress: {
          toplevel: false,
          drop_console: false
        },
        mangle: {
          toplevel: false
        },
        format: {
          comments: false
        }
      });

      if (!minified.code) {
        throw new Error(`Terser returned empty code for ${file}`);
      }

      fs.writeFileSync(minFilePath, minified.code, 'utf8');
      const origSize = Buffer.byteLength(sourceCode, 'utf8');
      const minSize = Buffer.byteLength(minified.code, 'utf8');
      totalOriginal += origSize;
      totalMinified += minSize;

      console.log(`  ✓ ${file} -> ${path.basename(minFilePath)} (${origSize}B -> ${minSize}B, -${Math.round((1 - minSize / origSize) * 100)}%)`);
    } catch (err) {
      console.error(`  ✗ Error minifying ${file}:`, err);
      process.exit(1);
    }
  }

  console.log(`Done! Total: ${totalOriginal}B -> ${totalMinified}B (-${Math.round((1 - totalMinified / totalOriginal) * 100)}%)`);
}

minifyAll();
