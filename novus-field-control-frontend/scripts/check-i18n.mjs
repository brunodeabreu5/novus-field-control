import fs from 'node:fs';
import path from 'node:path';

const baseDir = path.resolve(process.cwd(), 'src', 'i18n');
const languages = ['pt', 'es', 'en'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function flatten(obj, prefix = '', output = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, nextKey, output);
    } else {
      output[nextKey] = value;
    }
  }

  return output;
}

const dictionaries = Object.fromEntries(
  languages.map((language) => [language, flatten(readJson(path.join(baseDir, `${language}.json`)))])
);

const allKeys = [...new Set(languages.flatMap((language) => Object.keys(dictionaries[language])))]
  .sort();

let hasError = false;

for (const language of languages) {
  const missing = allKeys.filter((key) => !(key in dictionaries[language]));
  if (missing.length) {
    hasError = true;
    console.error(`Missing keys in ${language}:`);
    console.error(missing.join('\n'));
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`i18n dictionaries are aligned across ${languages.join(', ')}.`);
