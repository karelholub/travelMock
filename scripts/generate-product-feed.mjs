import { writeFile } from "node:fs/promises";
import { products } from "../src/catalog/products.js";

const siteUrl = "https://travelagentmockup.netlify.app";
const feedPath = "assets/product-feed.xml";
const generatedAt = process.env.FEED_GENERATED_AT || "2026-07-01T00:00:00.000Z";

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function element(name, value, indent = "    ") {
  if (value === undefined || value === null || value === "") return "";
  return `${indent}<${name}>${escapeXml(value)}</${name}>\n`;
}

function listElement(name, itemName, values = [], indent = "    ") {
  if (!values.length) return "";
  const inner = values.map((value) => `${indent}  <${itemName}>${escapeXml(value)}</${itemName}>`).join("\n");
  return `${indent}<${name}>\n${inner}\n${indent}</${name}>\n`;
}

function productXml(product) {
  const url = `${siteUrl}/product/${product.slug}`;
  const availability = product.type === "insurance" ? "available_as_add_on" : "in_stock";
  return [
    "  <product>\n",
    element("id", product.id),
    element("item_id", product.id),
    element("sku", product.id),
    element("slug", product.slug),
    element("title", product.name),
    element("name", product.name),
    element("description", product.tagline),
    element("url", url),
    element("image_url", product.image),
    element("product_type", product.type),
    element("category", product.type),
    element("destination", product.destination),
    element("trip_type", product.tripType),
    element("price", product.price),
    element("currency", "EUR"),
    element("margin", product.margin),
    element("duration", product.duration),
    element("departure_date", product.departureDate),
    element("return_date", product.returnDate),
    element("availability", availability),
    listElement("tags", "tag", product.tags || []),
    listElement("details", "detail", product.details || []),
    "  </product>\n"
  ].join("");
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>\n',
  `<product_feed generated_at="${escapeXml(generatedAt)}" source="elsewhere-travel-demo" site_url="${escapeXml(siteUrl)}">\n`,
  `  <products count="${products.length}">\n`,
  products.map(productXml).join(""),
  "  </products>\n",
  "</product_feed>\n"
].join("");

await writeFile(feedPath, xml);
console.log(`Product feed written: ${feedPath}`);
