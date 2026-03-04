import { writeFileSync } from "fs";
import { generateStartups } from "../server/generator.js";
import { fetchStartupsFromRSS } from "../server/rss.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let startups;

    try {
      startups = await fetchStartupsFromRSS(20);
    } catch (rssErr) {
      console.warn("RSS fetch failed, falling back to generated data:", rssErr);
      startups = generateStartups(20);
    }

    // Persist to /tmp so GET /api/startups can read it within the same lambda instance
    try {
      writeFileSync(
        "/tmp/startups.json",
        JSON.stringify(startups, null, 2),
        "utf-8",
      );
    } catch {
      /* non-critical */
    }

    return res.json(startups);
  } catch (err) {
    console.error("Error ingesting startups:", err);
    return res
      .status(500)
      .json({ error: String(err instanceof Error ? err.message : err) });
  }
}
