import fs from "fs";
import path from "path";

const dir = path.join(import.meta.dirname, "../src/lib/i18n");
const enSrc = fs.readFileSync(path.join(dir, "en.ts"), "utf8");
const esSrc = fs.readFileSync(path.join(dir, "es.ts"), "utf8");

function extractKeys(src) {
  const keys = [];
  for (const m of src.matchAll(/^\s+"([^"]+)":/gm)) keys.push(m[1]);
  return keys;
}

const enKeys = extractKeys(enSrc);
const esKeys = extractKeys(esSrc);
const enSet = new Set(enKeys);
const esSet = new Set(esKeys);
const dupEn = enKeys.filter((k, i) => enKeys.indexOf(k) !== i);
const missingInEs = [...enSet].filter((k) => !esSet.has(k)).sort();
const missingInEn = [...esSet].filter((k) => !enSet.has(k)).sort();
console.log("en unique:", enSet.size, "es unique:", esSet.size);
console.log("en duplicates:", [...new Set(dupEn)]);
console.log("missing in es:", missingInEs.length);
if (missingInEs.length) console.log(missingInEs.join("\n"));
console.log("missing in en:", missingInEn.length);
