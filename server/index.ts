import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./supabase.js";
import { generateStartups } from "./generator.js";
import { fetchStartupsFromRSS } from "./rss.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

// GET /api/startups — return all startups from Supabase
app.get("/api/startups", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("startups")
      .select("*")
      .order("lead_score", { ascending: false });

    if (error) throw error;

    res.json({
      startups: data ?? [],
      source: "database",
      message: `Supabase database — ${(data ?? []).length} records`,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error reading startups:", err);
    res.status(500).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// POST /api/ingest — fetch fresh data and upsert into Supabase
app.post("/api/ingest", async (_req, res) => {
  try {
    let startups;
    let source: "newsapi" | "mock";
    let sourceMessage: string;

    try {
      const result = await fetchStartupsFromRSS(20);
      startups = result.startups;
      source = "newsapi";
      sourceMessage = `Live feed via ${result.feedSource} — ${startups.length} articles parsed`;
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

    res.json({ startups, source, message: sourceMessage, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Error ingesting startups:", err);
    res.status(500).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// GET /api/export.csv — return CSV of current startups
app.get("/api/export.csv", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("startups")
      .select("*")
      .order("lead_score", { ascending: false });

    if (error) throw error;
    const startups = data ?? [];

    const headers = [
      "Company", "Domain", "Industry", "Stage", "Amount (USD)",
      "Funding Date", "Location", "Employees", "Lead Score", "Investors", "Signals",
    ];

    const rows = startups.map((s) => [
      s.name, s.domain, s.industry, s.funding_stage, s.funding_amount,
      s.funding_date, s.location, s.employee_count, s.lead_score,
      s.investors.join("; "), s.signals.join("; "),
    ]);

    const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="startup-radar.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

app.listen(PORT, () => {
  console.log(`Startup Radar API running on http://localhost:${PORT}`);
});
