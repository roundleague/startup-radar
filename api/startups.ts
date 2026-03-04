import { readFileSync, existsSync } from "fs";
import { join } from "path";

export default function handler(_req: any, res: any) {
  try {
    const tmpPath = "/tmp/startups.json";
    const bundledPath = join(process.cwd(), "server", "data", "startups.json");

    let data: unknown[] = [];

    if (existsSync(tmpPath)) {
      data = JSON.parse(readFileSync(tmpPath, "utf-8"));
    } else if (existsSync(bundledPath)) {
      data = JSON.parse(readFileSync(bundledPath, "utf-8"));
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error reading startups:", err);
    return res.status(500).json({ error: "Failed to read startups" });
  }
}
