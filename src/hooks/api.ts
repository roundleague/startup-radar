import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Startup } from "@/lib/types";

async function fetchStartups(): Promise<Startup[]> {
  const res = await fetch("/api/startups");
  if (!res.ok) throw new Error("Failed to fetch startups");
  return res.json();
}

async function ingestStartups(): Promise<Startup[]> {
  const res = await fetch("/api/ingest", { method: "POST" });
  if (!res.ok) throw new Error("Failed to ingest startups");
  return res.json();
}

export function useStartups() {
  return useQuery<Startup[]>({
    queryKey: ["startups"],
    queryFn: fetchStartups,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useIngest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ingestStartups,
    onSuccess: (data) => {
      queryClient.setQueryData(["startups"], data);
      const hotCount = data.filter((s) => s.lead_score >= 71).length;
      toast.success(`${data.length} leads refreshed`, {
        description: `${hotCount} hot lead${hotCount !== 1 ? "s" : ""} found. Sorted by lead score.`,
        duration: 4000,
      });
    },
    onError: () => {
      toast.error("Failed to refresh leads", {
        description: "Check your connection and try again.",
      });
    },
  });
}
