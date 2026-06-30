import { access, mkdir, cp, rm } from "node:fs/promises";
import { constants } from "node:fs";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("index.html", "dist/index.html");
await cp("_redirects", "dist/_redirects");
await cp("src", "dist/src", { recursive: true });
await cp("api", "dist/api", { recursive: true });
await cp("assets", "dist/assets", { recursive: true });
await access("dist/index.html", constants.R_OK);
await access("dist/src/main.js", constants.R_OK);
await access("dist/assets/favicon.svg", constants.R_OK);
console.log("Build complete: dist/");
