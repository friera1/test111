import { useI18n } from "@/hooks/use-i18n";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { motion } from "framer-motion";

interface PlayerStatsProps {
  profile: any;
  onEditAlliance: () => void;
}

export default function PlayerStats({ profile, onEditAlliance }: PlayerStatsProps) {
  const { t } = useI18n();

  const statsItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <motion.div
        custom={0}
        variants={statsItemVariants}
        className="bg-gray-900 p-4 rounded-lg"
      >
        <p className="text-gray-400 text-sm">{t("characterName")}</p>
        <p className="text-lg font-semibold">{profile.nickname}</p>
      </motion.div>
      
      <motion.div
        custom={1}
        variants={statsItemVariants}
        className="bg-gray-900 p-4 rounded-lg"
      >
        <p className="text-gray-400 text-sm">{t("server")}</p>
        <p className="text-lg font-semibold">{profile.server || "-"}</p>
      </motion.div>
      
      <motion.div
        custom={2}
        variants={statsItemVariants}
        className="bg-gray-900 p-4 rounded-lg"
      >
        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm">{t("alliance")}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-accent hover:text-accent-hover"
            onClick={onEditAlliance}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-lg font-semibold">{profile.alliance || "-"}</p>
      </motion.div>
      
      <motion.div
        custom={3}
        variants={statsItemVariants}
        className="bg-gray-900 p-4 rounded-lg"
      >
        <p className="text-gray-400 text-sm">{t("level")}</p>
        <p className="text-lg font-semibold">{profile.level || "-"}</p>
      </motion.div>
      
      <motion.div
        custom={4}
        variants={statsItemVariants}
        className="bg-gray-900 p-4 rounded-lg"
      >
        <p className="text-gray-400 text-sm">{t("currentPower")}</p>
        <p className="text-lg font-semibold">{formatNumber(profile.powerNow)}</p>
      </motion.div>
      
      <motion.div
        custom={5}
        variants={statsItemVariants}
        className="bg-gray-900 p-4 rounded-lg"
      >
        <p className="text-gray-400 text-sm">{t("maxPower")}</p>
        <p className="text-lg font-semibold">{formatNumber(profile.powerMax)}</p>
      </motion.div>
      
      <motion.div
        custom={6}
        variants={statsItemVariants}
        className="bg-gray-900 p-4 rounded-lg col-span-1 sm:col-span-2"
      >
        <p className="text-gray-400 text-sm">{t("hiddenPower")}</p>
        <p className="text-lg font-semibold">{formatNumber(profile.hiddenPower)}</p>
      </motion.div>
    </motion.div>
  );
}
