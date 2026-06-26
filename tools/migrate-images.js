'use strict';

const fs = require('fs/promises');
const path = require('path');
const { glob } = require('glob');

const SOURCE_DIR = path.resolve(__dirname, '..', 'source');
const POSTS_DIR = path.join(SOURCE_DIR, '_posts');
const IMAGES_DIR = path.join(SOURCE_DIR, 'images', 'posts');
const WORDPRESS_IMAGE_RE = /!\[([^\]\n]*)\]\((https?:\/\/dorasuzublog\.com\/wp-content\/uploads\/[^)\s]+)\)/g;

const options = {
  check: process.argv.includes('--check'),
  dryRun: process.argv.includes('--dry-run'),
  force: process.argv.includes('--force')
};

function sanitizeName(value, fallback) {
  const sanitized = value
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return sanitized || fallback;
}

function assetPathForPost(postPath) {
  const relative = path.relative(POSTS_DIR, postPath).replace(/\.md$/i, '');
  return relative
    .split(path.sep)
    .map(segment => sanitizeName(segment, 'post'))
    .join('/');
}

function imageName(url, postSlug, index) {
  const parsed = new URL(url);
  const originalName = decodeURIComponent(path.posix.basename(parsed.pathname));
  const ext = sanitizeName(path.posix.extname(originalName).slice(1), 'jpg');
  const padded = String(index).padStart(2, '0');

  return `${postSlug}-${padded}.${ext}`;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchImage(url) {
  const headers = { 'User-Agent': 'dorasuzublog.com image migrator' };
  let response = await fetch(url, { headers });

  if (!response.ok && url.startsWith('http://')) {
    response = await fetch(url.replace(/^http:\/\//, 'https://'), { headers });
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function saveImage(url, destination) {
  if (!options.force && await exists(destination)) {
    return false;
  }

  if (options.dryRun || options.check) {
    return false;
  }

  const body = await fetchImage(url);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, body);
  return true;
}

async function migratePost(filePath) {
  const original = await fs.readFile(filePath, 'utf8');
  const lines = original.split('\n');
  const assetPath = assetPathForPost(filePath);
  const postSlug = sanitizeName(path.posix.basename(assetPath), 'post');
  const urlMap = new Map();
  let nextIndex = 1;
  let changed = false;
  let found = 0;
  let downloaded = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];

    if (line.includes('word_balloon')) {
      continue;
    }

    WORDPRESS_IMAGE_RE.lastIndex = 0;
    const matches = Array.from(line.matchAll(WORDPRESS_IMAGE_RE));
    if (matches.length === 0) {
      continue;
    }

    let updated = line;
    for (const match of matches) {
      const [fullMatch, alt, url] = match;
      found += 1;

      if (!urlMap.has(url)) {
        const filename = imageName(url, postSlug, nextIndex);
        nextIndex += 1;

        urlMap.set(url, {
          publicPath: `/images/posts/${assetPath}/${filename}`,
          destination: path.join(IMAGES_DIR, assetPath, filename)
        });
      }

      const image = urlMap.get(url);
      if (await saveImage(url, image.destination)) {
        downloaded += 1;
      }

      updated = updated.replace(fullMatch, `![${alt}](${image.publicPath})`);
    }

    if (updated !== line) {
      lines[lineIndex] = updated;
      changed = true;
    }
  }

  if (changed && !options.dryRun && !options.check) {
    await fs.writeFile(filePath, lines.join('\n'), 'utf8');
  }

  return { filePath, found, changed, downloaded };
}

async function main() {
  const files = await glob('**/*.md', {
    cwd: POSTS_DIR,
    absolute: true,
    nodir: true
  });

  let found = 0;
  let changed = 0;
  let downloaded = 0;

  for (const file of files.sort()) {
    const result = await migratePost(file);
    found += result.found;
    downloaded += result.downloaded;
    if (result.changed) {
      changed += 1;
      console.log(`${options.check ? 'Needs migration' : 'Migrated'}: ${path.relative(process.cwd(), file)} (${result.found} images)`);
    }
  }

  console.log(`WordPress markdown images: ${found}`);
  console.log(`Changed posts: ${changed}`);
  console.log(`Downloaded images: ${downloaded}`);

  if (options.check && changed > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
