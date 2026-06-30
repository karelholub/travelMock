import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT || 8090);
const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === "/api/profile") {
    const persona = url.searchParams.get("persona") || "anonymous";
    const fields = {
      anonymous: ["Lisbon", "2026-09-12", 1640, "Guest", ["transfer-emotional-support", "exp-sunset-networking"]],
      abandoner: ["Lisbon", "2026-09-12", 1640, "Silver Almost There", ["transfer-emotional-support", "hotel-lisbon-optimistic-view"]],
      vip: ["Kyoto", "2026-11-02", 4820, "Platinum Calm", ["addon-lounge-nap", "exp-pretend-understand"]],
      family: ["Mallorca", "2026-08-08", 2450, "Gold Snack Strategist", ["addon-baggage-metaphorical", "transfer-emotional-support"]],
      business: ["Zurich", "2026-10-03", 1300, "Corporate Smooth", ["addon-lounge-nap", "transfer-emotional-support"]]
    }[persona] || ["Lisbon", "2026-09-12", 1640, "Guest", ["transfer-emotional-support"]];
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      source: "local-proxy-fallback",
      persona,
      fields: {
        next_trip_destination: fields[0],
        next_departure_date: fields[1],
        booking_value: fields[2],
        loyalty_tier: fields[3],
        recommended_add_on_ids: fields[4]
      }
    }));
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
