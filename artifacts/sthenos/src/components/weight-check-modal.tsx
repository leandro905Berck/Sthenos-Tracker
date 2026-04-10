import { useGetPendingWeightCheck, useCreateWeightCheck, getGetPendingWeightCheckQueryKey, useGetProfile } from "@workspace/api-client-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export function WeightCheckModal() {
  const { data: profile, isLoading: profileLoading } = useGetProfile({ query: { retry: false } });
  const { data: pendingCheck } = useGetPendingWeightCheck({ query: { enabled: !!profile } });
  const createWeight = useCreateWeightCheck();
  const queryClient = useQueryClient();
  const [weight, setWeight] = useState("");
  const [open, setOpen] = useState(true);

  if (profileLoading || !profile || !pendingCheck?.isPending) return null;

  const handleSubmit = () => {
    if (!weight) return;
    createWeight.mutate(
      { data: { weightKg: Number(weight), date: format(new Date(), "yyyy-MM-dd") } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPendingWeightCheckQueryKey() });
          setOpen(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">Hora de pesar!</DialogTitle>
          <DialogDescription>
            Já se passaram alguns dias desde seu último registro. Mantenha seu progresso atualizado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-weight">Peso atual (kg)</Label>
            <Input 
              id="current-weight" 
              type="number" 
              step="0.1" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
              placeholder="Ex: 75.5" 
            />
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-primary to-orange-600" 
            onClick={handleSubmit} 
            disabled={!weight || createWeight.isPending}
          >
            Registrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
