import { createClient } from "@supabase/supabase-js";
import { generateStartups } from "../server/generator.js";
import { fetchStartupsFromRSS } from "../server/rss.js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let startups;
    let source: "newsapi" | "mock";
    let sourceMessage: string;

    try {
      startups = await fetchStartupsFromRSS(20);
      source = "newsapi";
      sourceMessage = `Live feed via NewsAPI — ${startups.length} articles parsed`;
    } catch (rssErr) {
      const reason = rssErr instanceof Error ? rssErr.message : String(rssErr);
      console.warn("NewsAPI fetch failed, falling back to generated data:", reason);
      startups = generateStartups(20);
      source = "mock";
      sourceMessage = `Mock data (NewsAPI unavailable: ${reason})`;
    }

    // Clear old data and insert fresh batch
    await supabase.from("startups").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase.from("startups").insert(
      startups.map((s) => ({
        id: s.id,
        name: s.name,
        domain: s.domain,
        description: s.description,
        funding_stage: s.funding_stage,
        funding_amount: s.funding_amount,
        funding_date: s.funding_date,
        investors: s.investors,
        location: s.location,
        employee_count: s.employee_count,
        industry: s.industry,
        lead_score: s.lead_score,
        signals: s.signals,
        source_links: s.source_links,
      })),
    );

    if (error) throw error;

    return res.json({ startups, source, message: sourceMessage, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Error ingesting startups:", err);
    return res
      .status(500)
      .json({ error: String(err instanceof Error ? err.message : err) });
  }
}
