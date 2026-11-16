import { readFile, access } from "node:fs/promises";
const html = await readFile("dist/index.html", "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(
  (match) => match[1],
);
if (
  !scripts.length ||
  scripts.some((src) => !/^\/FSDashboard\/assets\/.+\.js$/.test(src))
) {
  throw new Error(
    "Pages requires the compiled Vite dist artifact, not the repository source index.html.",
  );
}
for (const src of scripts)
  await access(`dist/${src.slice("/FSDashboard/".length)}`);
if (html.includes("/src/") || html.includes(".tsx"))
  throw new Error("Uncompiled source reference in production HTML");
console.log("Verified compiled JavaScript assets and /FSDashboard/ base path.");
