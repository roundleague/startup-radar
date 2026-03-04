import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export default async function handler(_req: any, res: any) {
  try {
    const { data, error } = await supabase
      .from("startups")
      .select("*")
      .order("lead_score", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      startups: data ?? [],
      source: "database",
      message: `Supabase database — ${(data ?? []).length} records`,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error reading startups:", err);
    return res.status(500).json({ error: "Failed to read startups" });
  }
}
