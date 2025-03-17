import { useI18n } from "@/hooks/use-i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import { motion } from "framer-motion";

interface PlayerTableProps {
  players: any[];
}

export default function PlayerTable({ players }: PlayerTableProps) {
  const { t } = useI18n();

  const tableRowVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.05,
      },
    }),
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">{t("rank")}</TableHead>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("alliance")}</TableHead>
            <TableHead>{t("server")}</TableHead>
            <TableHead className="text-right">{t("level")}</TableHead>
            <TableHead className="text-right">{t("currentPower")}</TableHead>
            <TableHead className="text-right">{t("maxPower")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.length > 0 ? (
            players.map((player, index) => (
              <motion.tr
                key={`${player.characterId}-${index}`}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={tableRowVariants}
                className="transition-colors hover:bg-accent/10"
              >
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{player.nickname}</TableCell>
                <TableCell>{player.alliance || "-"}</TableCell>
                <TableCell>{player.server || "-"}</TableCell>
                <TableCell className="text-right">{player.level || "-"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(player.powerNow)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(player.powerMax)}
                </TableCell>
              </motion.tr>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No players found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
