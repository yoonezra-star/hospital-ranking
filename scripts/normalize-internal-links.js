const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const files = [
  ...fs.readdirSync(root)
    .filter((name) => name.endsWith('.html'))
    .map((name) => path.join(root, name)),
  ...listJavaScript(path.join(root, 'js')),
  ...listJavaScript(path.join(root, 'scripts')),
];

let changedFiles = 0;
let changedLinks = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let updated = original.replace(
    /href=(["'])(?!https?:\/\/|mailto:|tel:|#|\/)([^"'?#]+)\.html([?#][^"']*)?\1/g,
    (match, quote, target, suffix = '') => {
      changedLinks += 1;
      return `href=${quote}${cleanPath(target, suffix)}${quote}`;
    },
  );
  updated = updated.replace(
    /(href\s*:\s*)(["'])(?!https?:\/\/|mailto:|tel:|#|\/)([^"'?#]+)\.html([?#][^"']*)?\2/g,
    (match, prefix, quote, target, suffix = '') => {
      changedLinks += 1;
      return `${prefix}${quote}${cleanPath(target, suffix)}${quote}`;
    },
  );

  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    changedFiles += 1;
  }
}

console.log(`Normalized ${changedLinks} internal links across ${changedFiles} files.`);

function cleanPath(target, suffix) {
  const normalized = target.replace(/^\.\//, '');
  return normalized === 'index' ? `/${suffix}` : `/${normalized}${suffix}`;
}

function listJavaScript(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJavaScript(fullPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
}
