import express from "express";
import cors from "cors";
import { readStartups } from "./storage.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

// GET /api/startups — return all stored startups
app.get("/api/startups", (_req, res) => {
  try {
    const startups = readStartups();
    res.json(startups);
  } catch (err) {
    console.error("Error reading startups:", err);
    res.status(500).json({ error: "Failed to read startups" });
  }
});

// POST /api/ingest — return the curated startup dataset
app.post("/api/ingest", (_req, res) => {
  try {
    const startups = readStartups();
    res.json(startups);
  } catch (err) {
    console.error("Error ingesting startups:", err);
    res
      .status(500)
      .json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// GET /api/export.csv — return CSV of current startups
app.get("/api/export.csv", (_req, res) => {
  try {
    const startups = readStartups();

    const headers = [
      "Company",
      "Domain",
      "Industry",
      "Stage",
      "Amount (USD)",
      "Funding Date",
      "Location",
      "Employees",
      "Lead Score",
      "Investors",
      "Signals",
    ];

    const rows = startups.map((s) => [
      s.name,
      s.domain,
      s.industry,
      s.funding_stage,
      s.funding_amount,
      s.funding_date,
      s.location,
      s.employee_count,
      s.lead_score,
      s.investors.join("; "),
      s.signals.join("; "),
    ]);

    const escape = (val: unknown) => `"${String(val).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="startup-radar.csv"',
    );
    res.send(csv);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Startup Radar API running on http://localhost:${PORT}`);
});
