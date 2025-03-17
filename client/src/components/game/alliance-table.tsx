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

interface AllianceTableProps {
  alliances: any[];
}

export default function AllianceTable({ alliances }: AllianceTableProps) {
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
            <TableHead>{t("alliance")}</TableHead>
            <TableHead>{t("server")}</TableHead>
            <TableHead className="text-right">{t("memberCount")}</TableHead>
            <TableHead className="text-right">{t("totalPower")}</TableHead>
            <TableHead className="text-right">{t("averagePower")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alliances.length > 0 ? (
            alliances.map((alliance, index) => (
              <motion.tr
                key={`${alliance.name}-${alliance.server}-${index}`}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={tableRowVariants}
                className="transition-colors hover:bg-accent/10"
              >
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{alliance.name}</TableCell>
                <TableCell>{alliance.server}</TableCell>
                <TableCell className="text-right">{alliance.memberCount}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(alliance.totalPower)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(alliance.averagePower)}
                </TableCell>
              </motion.tr>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No alliances found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
