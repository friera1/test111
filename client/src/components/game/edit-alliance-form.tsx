import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@/hooks/use-i18n";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const allianceFormSchema = z.object({
  alliance: z.string().min(1, { message: "Alliance name is required" }),
});

type AllianceFormValues = z.infer<typeof allianceFormSchema>;

interface EditAllianceFormProps {
  currentAlliance: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function EditAllianceForm({
  currentAlliance,
  onCancel,
  onSubmit,
}: EditAllianceFormProps) {
  const { t } = useI18n();
  const { toast } = useToast();

  const form = useForm<AllianceFormValues>({
    resolver: zodResolver(allianceFormSchema),
    defaultValues: {
      alliance: currentAlliance || "",
    },
  });

  // Mutation to update alliance
  const updateAllianceMutation = useMutation({
    mutationFn: async (data: AllianceFormValues) => {
      const res = await apiRequest("PATCH", "/api/profile/alliance", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: t("allianceUpdated"),
        description: t("profileUpdated"),
      });
      onSubmit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update alliance",
        variant: "destructive",
      });
    },
  });

  const onSubmitForm = (values: AllianceFormValues) => {
    updateAllianceMutation.mutate(values);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mt-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("editAlliance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
              <FormField
                control={form.control}
                name="alliance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("newAlliance")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={updateAllianceMutation.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={updateAllianceMutation.isPending}
                >
                  {updateAllianceMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("save")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
