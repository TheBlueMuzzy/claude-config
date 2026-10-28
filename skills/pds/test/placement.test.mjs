// Tests the page-placement rule using the library's own placeIndex (loaded from library/Code.js).
// Run: node test/placement.test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = {};
vm.createContext(ctx);
vm.runInContext(readFileSync(join(here, "../library/Code.js"), "utf8"), ctx);

const O = "PDS - Overview", H = "PDS - How to Play", C = "PDS - Control Drawing", D = "PDS - Color & Deco", T = "PDS - Texture & Finish", P = "PDS - Printed Sheet", K = "PDS - Packaging";
const pg = (kind, name = "") => ({ kind, name });
// Insert using the library rule, return the deck as short labels
function add(deck, kind, name) {
  const at = ctx.placeIndex(deck, kind, name);
  deck.splice(at, 0, pg(kind, kind === C || kind === D || kind === T ? name.trim() : ""));
  return deck;
}
const show = (deck) => deck.map((p) => ({ [O]: "O", [H]: "H", [C]: "C", [D]: "D", [T]: "T", [P]: "P", [K]: "K" }[p.kind] || "?") + (p.name ? ":" + p.name : "")).join(" ");

let fails = 0;
function check(label, deck, expected) {
  const got = show(deck);
  if (got === expected) console.log("ok   " + label);
  else { fails++; console.log("FAIL " + label + "\n     got      " + got + "\n     expected " + expected); }
}

const full = () => [pg(O), pg(H), pg(C, "Spoon"), pg(D, "Spoon"), pg(T, "Spoon"), pg(C, "Fork"), pg(D, "Fork"), pg(P), pg(K)];

check("new component, all 3 types → new group after last component", [C, D, T].reduce((d, k) => add(d, k, "Knife"), full()),
  "O H C:Spoon D:Spoon T:Spoon C:Fork D:Fork C:Knife D:Knife T:Knife P K");
check("add Texture to existing Fork → end of Fork group", add(full(), T, "Fork"),
  "O H C:Spoon D:Spoon T:Spoon C:Fork D:Fork T:Fork P K");
check("add Control to a group that only has Color & Deco → front of that group",
  add([pg(O), pg(D, "Cup"), pg(C, "Plate"), pg(P)], C, "Cup"), "O C:Cup D:Cup C:Plate P");
check("add Color & Deco between Control and Texture", add([pg(C, "Cup"), pg(T, "Cup"), pg(C, "Plate")], D, "Cup"),
  "C:Cup D:Cup T:Cup C:Plate");
check("name match ignores case and spaces", add(full(), T, "  spoon "), "O H C:Spoon D:Spoon T:Spoon T:spoon C:Fork D:Fork P K");
check("second Control for same component → after the first Control", add(full(), C, "Spoon"),
  "O H C:Spoon C:Spoon D:Spoon T:Spoon C:Fork D:Fork P K");
check("Packaging → after last Packaging", add([pg(O), pg(K), pg(K), pg(P)], K), "O K K K P");
check("Packaging with none yet → after Printed Sheets", add(full().filter((p) => p.kind !== K), K), "O H C:Spoon D:Spoon T:Spoon C:Fork D:Fork P K");
check("Packaging with no Printed/Packaging → after last component", add([pg(O), pg(C, "Cup")], K), "O C:Cup K");
check("Printed Sheet → after last Printed Sheet, before Packaging", add(full(), P), "O H C:Spoon D:Spoon T:Spoon C:Fork D:Fork P P K");
check("Printed with none yet → before Packaging", add([pg(O), pg(C, "Cup"), pg(K)], P), "O C:Cup P K");
check("Overview → after last Overview", add(full(), O), "O O H C:Spoon D:Spoon T:Spoon C:Fork D:Fork P K");
check("How to Play → after last How to Play", add(full(), H), "O H H C:Spoon D:Spoon T:Spoon C:Fork D:Fork P K");
check("How to Play with none → after Overview", add([pg(O), pg(C, "Cup")], H), "O H C:Cup");
check("Overview into a deck with no Overview → very start", add([pg(H), pg(C, "Cup")], O), "O H C:Cup");
check("first component into a deck with only game pages", add([pg(O), pg(H), pg(K)], C, "Cup"), "O H C:Cup K");
check("empty deck", add([], C, "Cup"), "C:Cup");
check("non-PDS pages are ignored", add([pg(O), pg(null), pg(C, "Cup"), pg(null)], D, "Cup"), "O ? C:Cup D:Cup ?");

console.log(fails ? `\n${fails} FAILED` : "\nall placement tests passed");
process.exit(fails ? 1 : 0);
