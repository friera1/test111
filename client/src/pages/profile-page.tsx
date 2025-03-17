import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GameForm from "@/components/game/game-form";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Edit, User, RefreshCw } from "lucide-react";
import PlayerStats from "@/components/game/player-stats";
import EditAllianceForm from "@/components/game/edit-alliance-form";
import { useState } from "react";
import { useGameApi } from "@/lib/useGameApi";
import { useToast } from "@/hooks/use-toast";
import { GameProfile } from "@shared/schema";

export default function ProfilePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showEditAlliance, setShowEditAlliance] = useState(false);
  const { getGameData, isLoading: isLoadingGameData } = useGameApi();

  // Fetch game profile
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery<GameProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Mutation to save game data to profile
  const saveGameDataMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Saving game data:", data);
      const res = await apiRequest("POST", "/api/profile/game-data", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: t("gameDataFetched"),
        description: t("profileUpdated"),
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to save game data";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Mutation to refresh game stats from API
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!profile) return null;
      
      // Получаем свежие данные из игрового API
      const gameData = await getGameData(profile.characterId, profile.nickname);
      
      if (!gameData) {
        throw new Error("Failed to fetch game data");
      }
      
      // Сохраняем полученные данные в профиль
      return saveGameDataMutation.mutate({
        characterId: profile.characterId,
        nickname: profile.nickname,
        server: gameData.server,
        level: gameData.level,
        powerNow: gameData.power_now,
        powerMax: gameData.power_max,
        hiddenPower: gameData.poten,
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to refresh game data";
      toast({
        title: "Error refreshing data",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Layout variants for animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* User Profile Card */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <Card className="bg-opacity-80 backdrop-blur-md">
            <CardHeader>
              <CardTitle>{t("profile")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-5xl text-accent">
                  <User />
                </div>
                <h3 className="text-xl font-semibold">{user?.username}</h3>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>

              {!profile && (
                <div className="mt-4 p-4 bg-gray-800 rounded-md">
                  <p className="text-center text-gray-300">
                    {t("gameConnection")}
                  </p>
                  <GameForm />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Game Stats Card */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="bg-opacity-80 backdrop-blur-md">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>{t("gameStats")}</CardTitle>
              {profile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshMutation.mutate()}
                  disabled={refreshMutation.isPending || isLoadingGameData}
                  className="flex items-center gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshMutation.isPending || isLoadingGameData ? "animate-spin" : ""
                    }`}
                  />
                  {t("updateGameData")}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-lg">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="text-center p-6">
                  <p className="text-red-500">
                    {error instanceof Error
                      ? error.message
                      : "Failed to load profile"}
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["/api/profile"],
                      })
                    }
                  >
                    Retry
                  </Button>
                </div>
              ) : profile ? (
                <>
                  <PlayerStats
                    profile={profile}
                    onEditAlliance={() => setShowEditAlliance(true)}
                  />
                  {showEditAlliance && (
                    <EditAllianceForm
                      currentAlliance={profile.alliance || ""}
                      onCancel={() => setShowEditAlliance(false)}
                      onSubmit={() => setShowEditAlliance(false)}
                    />
                  )}
                </>
              ) : (
                <div className="text-center p-6">
                  <p className="text-gray-400">{t("noGameDataYet")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
