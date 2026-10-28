// Catches a call to a helper that doesn't exist (e.g. an edit that added a call but not the function).
// Checks every `name_(` call and every top-level name used in menu()/call() maps. Run: node test/defined.test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "../library/Code.js"), "utf8");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src, ctx);

const called = new Set([...src.matchAll(/\b([A-Za-z]\w*_)\(/g)].map((m) => m[1]));
for (const m of src.matchAll(/\{([^{}]*)\}/g)) for (const n of m[1].matchAll(/:\s*([A-Za-z]\w*)\s*[,}]/g)) if (/^(show|save|add|mark|archive)/.test(n[1])) called.add(n[1]);
const missing = [...called].filter((n) => typeof ctx[n] !== "function");
if (missing.length) { console.log("FAIL missing functions: " + missing.join(", ")); process.exit(1); }
console.log(`ok   all ${called.size} called helpers exist`);
