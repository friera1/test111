import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import PlayerTable from "@/components/game/player-table";
import { formatNumber } from "@/lib/utils";

type SortOptions = "powerNow" | "powerMax" | "level";
type SortOrder = "asc" | "desc";

export default function PlayerRankings() {
  const { t } = useI18n();
  const [server, setServer] = useState<string>("");
  const [alliance, setAlliance] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOptions>("powerNow");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Fetch player rankings with filters
  const {
    data: players,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "/api/rankings/players",
      { server, alliance, sortBy, sortOrder },
    ],
    queryFn: async ({ queryKey }) => {
      const [_path, filters] = queryKey;
      const params = new URLSearchParams();
      Object.entries(filters as Record<string, string>).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const url = `/api/rankings/players?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch player rankings");
      return res.json();
    },
  });

  // Fetch all servers and alliances for filter options
  const { data: allPlayers } = useQuery({
    queryKey: ["/api/rankings/players"],
  });

  // Extract unique servers and alliances for filter dropdowns
  const servers = allPlayers
    ? [...new Set(allPlayers.map((p: any) => p.server).filter(Boolean))]
    : [];
  
  const alliances = allPlayers
    ? [...new Set(allPlayers.map((p: any) => p.alliance).filter(Boolean))]
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-opacity-80 backdrop-blur-md">
          <CardHeader>
            <CardTitle>{t("playerRankings")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="filterServer">{t("server")}</Label>
                <Select value={server} onValueChange={setServer}>
                  <SelectTrigger id="filterServer">
                    <SelectValue placeholder={t("all")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("all")}</SelectItem>
                    {servers.map((s: string) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="filterAlliance">{t("alliance")}</Label>
                <Select value={alliance} onValueChange={setAlliance}>
                  <SelectTrigger id="filterAlliance">
                    <SelectValue placeholder={t("all")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("all")}</SelectItem>
                    {alliances.map((a: string) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sortBy">{t("sortBy")}</Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOptions)}>
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder={t("currentPower")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="powerNow">{t("currentPower")}</SelectItem>
                    <SelectItem value="powerMax">{t("maxPower")}</SelectItem>
                    <SelectItem value="level">{t("level")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sortOrder">{t("order")}</Label>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                  <SelectTrigger id="sortOrder">
                    <SelectValue placeholder={t("descending")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">{t("descending")}</SelectItem>
                    <SelectItem value="asc">{t("ascending")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Player Table */}
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center p-6">
                <p className="text-red-500">Failed to load player rankings</p>
              </div>
            ) : (
              <>
                <PlayerTable players={players} />
                <div className="mt-4 text-sm text-gray-400">
                  {t("totalResults", { count: players?.length || 0 })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
