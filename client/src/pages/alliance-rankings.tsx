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
import AllianceTable from "@/components/game/alliance-table";

type SortOptions = "totalPower" | "memberCount" | "averagePower";
type SortOrder = "asc" | "desc";

export default function AllianceRankings() {
  const { t } = useI18n();
  const [server, setServer] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOptions>("totalPower");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Fetch alliance rankings with filters
  const {
    data: alliances,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "/api/rankings/alliances",
      { server, sortBy, sortOrder },
    ],
    queryFn: async ({ queryKey }) => {
      const [_path, filters] = queryKey;
      const params = new URLSearchParams();
      Object.entries(filters as Record<string, string>).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const url = `/api/rankings/alliances?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch alliance rankings");
      return res.json();
    },
  });

  // Fetch all servers for filter options
  const { data: allAlliances } = useQuery({
    queryKey: ["/api/rankings/alliances"],
  });

  // Extract unique servers for filter dropdown
  const servers = allAlliances 
    ? [...new Set(allAlliances.map((a: any) => a.server).filter(Boolean))]
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
            <CardTitle>{t("allianceRankings")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="allianceFilterServer">{t("server")}</Label>
                <Select value={server} onValueChange={setServer}>
                  <SelectTrigger id="allianceFilterServer">
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
                <Label htmlFor="allianceSortBy">{t("sortBy")}</Label>
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortOptions)}
                >
                  <SelectTrigger id="allianceSortBy">
                    <SelectValue placeholder={t("totalPower")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalPower">{t("totalPower")}</SelectItem>
                    <SelectItem value="memberCount">{t("memberCount")}</SelectItem>
                    <SelectItem value="averagePower">{t("averagePower")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="allianceSortOrder">{t("order")}</Label>
                <Select
                  value={sortOrder}
                  onValueChange={(v) => setSortOrder(v as SortOrder)}
                >
                  <SelectTrigger id="allianceSortOrder">
                    <SelectValue placeholder={t("descending")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">{t("descending")}</SelectItem>
                    <SelectItem value="asc">{t("ascending")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Alliance Table */}
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center p-6">
                <p className="text-red-500">Failed to load alliance rankings</p>
              </div>
            ) : (
              <>
                <AllianceTable alliances={alliances} />
                <div className="mt-4 text-sm text-gray-400">
                  {t("totalAllianceResults", { count: alliances?.length || 0 })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
