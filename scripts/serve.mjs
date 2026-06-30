import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { localProfile } from "../src/api/profileAttributes.js";

const port = Number(process.env.PORT || 8090);
const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === "/api/profile") {
    const persona = url.searchParams.get("persona") || "anonymous";
    const identity = {
      email: url.searchParams.get("email") || "",
      phone: url.searchParams.get("phone") || "",
      userId: url.searchParams.get("userId") || "",
      meiroUserId: url.searchParams.get("meiroUserId") || ""
    };
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ...localProfile(persona, identity), source: "local-dev-profile-proxy" }));
    return;
  }
  let filePath = path.join(root, decodeURIComponent(url.pathname));
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": types[path.extname(filePath)] || "application/octet-stream" });
    response.end(body);
  } catch {
    const body = await readFile(path.join(root, "index.html"));
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(body);
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Elsewhere Travel Co. running at http://localhost:${port}/`);
});
