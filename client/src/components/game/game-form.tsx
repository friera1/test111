import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@/hooks/use-i18n";
import { useGameApi } from "@/lib/useGameApi";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const gameFormSchema = z.object({
  characterId: z.string().min(1, { message: "Player ID is required" }),
  nickname: z.string().min(1, { message: "Nickname is required" }),
});

type GameFormValues = z.infer<typeof gameFormSchema>;

export default function GameForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { getGameData, isLoading: isLoadingGameData } = useGameApi();
  const [isConnecting, setIsConnecting] = useState(false);

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      characterId: "",
      nickname: "",
    },
  });

  // Mutation to save game data to profile
  const saveGameDataMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        console.log("Saving game data:", data);
        const res = await apiRequest("POST", "/api/profile/game-data", data);
        console.log("Game data save response:", res.status);
        return res.json();
      } catch (error) {
        console.error("Error in mutation function:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("Game data saved successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: t("gameDataFetched"),
        description: t("profileUpdated"),
      });
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error("Error saving game data:", error);
      
      // Check if it's an auth error
      const message = error instanceof Error ? error.message : "Failed to save game data";
      if (message.includes("401")) {
        toast({
          title: "Authentication Error",
          description: "You are not logged in. Please login and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
      
      setIsConnecting(false);
    },
  });

  const onSubmit = async (values: GameFormValues) => {
    try {
      setIsConnecting(true);
      
      // Get game data using external API
      const gameData = await getGameData(values.characterId, values.nickname);
      
      if (!gameData) {
        setIsConnecting(false);
        return;
      }
      
      // Save game data to profile
      saveGameDataMutation.mutate({
        characterId: values.characterId,
        nickname: values.nickname,
        server: gameData.server,
        level: gameData.level,
        powerNow: gameData.power_now,
        powerMax: gameData.power_max,
        hiddenPower: gameData.poten,
      });
    } catch (error) {
      console.error("Error connecting to game:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to game",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="characterId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("gameId")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("gameNick")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full"
          disabled={isConnecting || isLoadingGameData}
        >
          {(isConnecting || isLoadingGameData) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t("connectGame")}
        </Button>
      </form>
    </Form>
  );
}
