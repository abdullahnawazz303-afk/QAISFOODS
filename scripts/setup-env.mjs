import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const envPath = join(root, ".env");
const examplePath = join(root, ".env.example");

if (existsSync(envPath)) {
  process.exit(0);
}

if (!existsSync(examplePath)) {
  console.warn("[QAIS Foods] .env.example not found — create a .env file manually.");
  process.exit(0);
}

copyFileSync(examplePath, envPath);
console.log("[QAIS Foods] Created .env from .env.example — ready for npm run dev.");
