import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { generateStartups } from "../server/generator.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Serve the bundled curated dataset for consistent results
    const bundledPath = join(process.cwd(), "server", "data", "startups.json");

    if (existsSync(bundledPath)) {
      const data = JSON.parse(readFileSync(bundledPath, "utf-8"));
      return res.json(data);
    }

    // Fallback: generate a fresh batch if bundled file is missing
    const startups = generateStartups(20);
    return res.json(startups);
  } catch (err) {
    console.error("Error ingesting startups:", err);
    return res
      .status(500)
      .json({ error: String(err instanceof Error ? err.message : err) });
  }
}
