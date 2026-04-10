import fs from "node:fs";
import path from "node:path";

const inputUrl = process.argv[2];

if (!inputUrl) {
  console.error("Usage: npm run android:set-url -- https://your-domain.example");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(inputUrl);
} catch {
  console.error("Invalid URL. Example: https://orders.ahmad-enterprises.com");
  process.exit(1);
}

const configPath = path.resolve("capacitor.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

config.server = {
  ...(config.server || {}),
  url: parsed.toString(),
  cleartext: parsed.protocol === "http:"
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
console.log(`Updated capacitor server URL to: ${parsed.toString()}`);
