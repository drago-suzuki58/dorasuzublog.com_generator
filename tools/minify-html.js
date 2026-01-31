'use strict';

const path = require('path');
const fs = require('fs/promises');
const { minify } = require('html-minifier-terser');
const { glob } = require('glob');

const pkg = require("../package.json");

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const MINIFY_OPTIONS = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true
};

async function loadEasterEgg() {
  const eggFile = process.env.HTML_EASTER_EGG_FILE || pkg.config?.htmlEasterEggFile;
  const eggInline = process.env.HTML_EASTER_EGG || pkg.config?.htmlEasterEggInline;

  if (eggFile) {
    const resolved = path.isAbsolute(eggFile)
      ? eggFile
      : path.resolve(process.cwd(), eggFile);
    return fs.readFile(resolved, 'utf8');
  }

  if (eggInline) {
    return eggInline;
  }

  return '';
}

function injectEasterEgg(html, egg) {
  const trimmed = (egg || '').trim();
  if (!trimmed) return html;

  const comment = `<!--\n${trimmed}\n-->`;
  if (html.includes('</body>')) {
    return html.replace('</body>', `${comment}\n</body>`);
  }
  return `${html}\n${comment}\n`;
}

async function minifyHtmlFile(filePath, egg) {
  const original = await fs.readFile(filePath, 'utf8');
  const minified = await minify(original, MINIFY_OPTIONS);
  const withEgg = injectEasterEgg(minified, egg);

  if (withEgg !== original) {
    await fs.writeFile(filePath, withEgg, 'utf8');
    return true;
  }
  return false;
}

async function main() {
  const egg = await loadEasterEgg();

  const files = await glob('**/*.html', {
    cwd: PUBLIC_DIR,
    nodir: true,
    absolute: true
  });

  let changed = 0;
  for (const file of files) {
    try {
      const updated = await minifyHtmlFile(file, egg);
      if (updated) changed += 1;
    } catch (error) {
      console.error(`Failed to minify: ${file}`);
      console.error(error);
      process.exitCode = 1;
    }
  }

  console.log(`Minified HTML files: ${changed}/${files.length}`);
}

main();
