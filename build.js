import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function build() {
  console.log('Building lightweight-blogger...');
  
  ensureDir(distDir);
  
  // Build ES module version
  await esbuild.build({
    entryPoints: ['src/client.js'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/lightweight-blogger.js',
    minify: false,
    platform: 'browser',
    target: ['es2020'],
    sourcemap: false,
  });
  
  // Build minified ES module version
  await esbuild.build({
    entryPoints: ['src/client.js'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/lightweight-blogger.min.js',
    minify: true,
    platform: 'browser',
    target: ['es2020'],
    sourcemap: false,
  });
  
  console.log('Build complete!');
  console.log('- dist/lightweight-blogger.js');
  console.log('- dist/lightweight-blogger.min.js');
}

build();
