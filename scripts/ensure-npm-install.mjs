import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pnpmDir = join(root, "node_modules", ".pnpm");
const viteChunk = join(root, "node_modules", "vite", "dist", "node", "chunks");

if (existsSync(pnpmDir)) {
  console.error(
    "\n[QAIS Foods] Mixed package manager install detected (node_modules/.pnpm).\n" +
      "This breaks Vite and causes the dep-*.js Internal Server Error.\n\n" +
      "Fix:\n" +
      "  1. Delete node_modules\n" +
      "  2. Run: npm install\n" +
      "  3. Run: npm run dev\n\n" +
      "Use npm only — do not run pnpm install in this project.\n",
  );
  process.exit(1);
}

if (!existsSync(viteChunk)) {
  console.error(
    "\n[QAIS Foods] Vite is not installed correctly.\n" +
      "Run: npm install\n",
  );
  process.exit(1);
}
