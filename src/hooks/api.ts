import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Startup } from "@/lib/types";
import { useStore } from "@/store";

interface ApiResponse {
  startups: Startup[];
  source: "newsapi" | "mock" | "database";
  message: string;
  fetchedAt: string;
}

async function fetchStartups(): Promise<ApiResponse> {
  const res = await fetch("/api/startups");
  if (!res.ok) throw new Error("Failed to fetch startups");
  return res.json();
}

async function ingestStartups(): Promise<ApiResponse> {
  const res = await fetch("/api/ingest", { method: "POST" });
  if (!res.ok) throw new Error("Failed to ingest startups");
  return res.json();
}

export function useStartups() {
  const setDataSource = useStore((s) => s.setDataSource);

  return useQuery<Startup[]>({
    queryKey: ["startups"],
    queryFn: async () => {
      const res = await fetchStartups();
      setDataSource({ source: res.source, message: res.message, fetchedAt: res.fetchedAt });
      return res.startups ?? [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useIngest() {
  const queryClient = useQueryClient();
  const setDataSource = useStore((s) => s.setDataSource);

  return useMutation({
    mutationFn: ingestStartups,
    onSuccess: (res) => {
      queryClient.setQueryData(["startups"], res.startups);
      setDataSource({ source: res.source, message: res.message, fetchedAt: res.fetchedAt });
      const hotCount = res.startups.filter((s) => s.lead_score >= 71).length;
      toast.success(`${res.startups.length} leads refreshed`, {
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
