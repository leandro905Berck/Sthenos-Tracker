import {
  useGetProfile,
  useUpdateProfile,
  getGetProfileQueryKey,
  useListWeightChecks,
  useCreateWeightCheck,
  getListWeightChecksQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight, Target, Activity, Edit2, Save, Scale, Plus, TrendingDown, TrendingUp, Minus, LogOut, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTodayDateString } from "@/lib/date-utils";

type WeightCheck = { id: number; weightKg: number; date: string; notes: string | null };

export default function Profile() {
  const { data: profile, isLoading } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { signOut } = useAuth();


  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        name: profile.name,
        age: profile.age || "",
        gender: profile.gender || "",
        weightKg: profile.weightKg || "",
        heightCm: profile.heightCm || "",
        goal: profile.goal || "",
        activityLevel: profile.activityLevel || "",
      });
    }
  }, [profile, isEditing]);

  const handleSave = () => {
    updateProfile.mutate(
      {
        data: {
          name: formData.name,
          age: formData.age ? Number(formData.age) : undefined,
          gender: formData.gender,
          weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
          heightCm: formData.heightCm ? Number(formData.heightCm) : undefined,
          goal: formData.goal,
          activityLevel: formData.activityLevel,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          setIsEditing(false);
          toast({ title: "Perfil atualizado com sucesso" });
        },
      }
    );
  };

  if (isLoading || !profile) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  const bmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Abaixo do peso", color: "text-blue-400" };
    if (bmi < 25) return { label: "Peso normal", color: "text-green-400" };
    if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-400" };
    return { label: "Obesidade", color: "text-red-400" };
  };

  const bmiInfo = profile.bmi ? bmiCategory(profile.bmi) : null;

  return (
    <div className="p-4 space-y-4 pb-24">
      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Perfil</h1>
        <Button variant="ghost" size="icon" onClick={() => (isEditing ? handleSave() : setIsEditing(true))}>
          {isEditing ? <Save className="w-5 h-5 text-primary" /> : <Edit2 className="w-5 h-5 text-muted-foreground" />}
        </Button>
      </header>

      <Card className="bg-card border-border overflow-hidden">
        <div className="bg-gradient-to-r from-card to-primary/5 p-6 border-b border-border text-center">
          <div className="w-20 h-20 bg-background rounded-full mx-auto mb-3 flex items-center justify-center border border-border shadow-inner text-2xl font-bold text-primary uppercase">
            {profile.name.substring(0, 2)}
          </div>
          {isEditing ? (
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-center font-bold text-lg bg-background/50 max-w-[200px] mx-auto" />
          ) : (
            <h2 className="text-xl font-bold">{profile.name}</h2>
          )}
        </div>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Idade</Label>
              {isEditing ? (
                <Input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="h-8" />
              ) : (
                <div className="font-medium">{profile.age || "-"} anos</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Gênero</Label>
              {isEditing ? (
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium capitalize">{profile.gender || "-"}</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Peso (kg)</Label>
              {isEditing ? (
                <Input type="number" step="0.1" value={formData.weightKg} onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })} className="h-8" />
              ) : (
                <div className="font-medium">{profile.weightKg || "-"} kg</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Altura (cm)</Label>
              {isEditing ? (
                <Input type="number" value={formData.heightCm} onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })} className="h-8" />
              ) : (
                <div className="font-medium">{profile.heightCm || "-"} cm</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Metas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Objetivo Principal</Label>
            {isEditing ? (
              <Select value={formData.goal} onValueChange={(v) => setFormData({ ...formData, goal: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="perda de peso">Perda de peso</SelectItem>
                  <SelectItem value="manutenção">Manutenção</SelectItem>
                  <SelectItem value="ganho muscular">Ganho muscular</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="font-medium capitalize">{profile.goal || "-"}</div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nível de Atividade</Label>
            {isEditing ? (
              <Select value={formData.activityLevel} onValueChange={(v) => setFormData({ ...formData, activityLevel: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentario">Sedentário</SelectItem>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="intenso">Intenso</SelectItem>
                  <SelectItem value="muito_intenso">Muito Intenso</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="font-medium capitalize">{profile.activityLevel?.replace("_", " ") || "-"}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">IMC</div>
            <div className="text-2xl font-bold text-foreground">{profile.bmi?.toFixed(1) || "-"}</div>
            {bmiInfo && <div className={`text-[11px] mt-1 font-medium ${bmiInfo.color}`}>{bmiInfo.label}</div>}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">Metabolismo Basal</div>
            <div className="text-2xl font-bold text-foreground">
              {profile.bmr ? Math.round(profile.bmr) : "-"}{" "}
              <span className="text-[10px] font-normal text-muted-foreground">kcal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <WeightSection />

      <Link href="/dieta">
        <Button variant="outline" className="w-full justify-between h-14 bg-gradient-to-r from-card to-card border-primary/20 hover:border-primary hover:bg-card">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-medium">Plano de Dieta IA</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Button>
      </Link>

      <Button variant="ghost" className="w-full h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2 border border-border/50"
        onClick={() => signOut({ redirectUrl: "/" })}>
        <LogOut className="w-4 h-4" />
        Sair da conta
      </Button>
    </div>
  );
}

function WeightSection() {
  const { data: checks, isLoading } = useListWeightChecks({ query: { queryKey: getListWeightChecksQueryKey() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showAll, setShowAll] = useState(false);
  const [editTarget, setEditTarget] = useState<WeightCheck | null>(null);

  const displayed = showAll ? checks : checks?.slice(0, 5);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/weight-checks/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        queryClient.invalidateQueries({ queryKey: getListWeightChecksQueryKey() });
        toast({ title: "Medição excluída" });
      }
    } catch {
      toast({ title: "Erro ao excluir medição", variant: "destructive" });
    }
  };

  const getTrend = (index: number) => {
    if (!checks || index >= checks.length - 1) return null;
    const current = Number(checks[index].weightKg);
    const previous = Number(checks[index + 1].weightKg);
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return { icon: <Minus className="w-3 h-3" />, color: "text-muted-foreground", diff: 0 };
    if (diff < 0) return { icon: <TrendingDown className="w-3 h-3" />, color: "text-green-400", diff };
    return { icon: <TrendingUp className="w-3 h-3" />, color: "text-red-400", diff };
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" /> Histórico de Peso
          </CardTitle>
          <AddWeightModal />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-4">Carregando...</div>
        ) : !displayed || displayed.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">Nenhuma medição registrada ainda.</div>
        ) : (
          <>
            {displayed.map((c, i) => {
              const trend = getTrend(i);
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <div className="text-sm font-semibold">{Number(c.weightKg).toFixed(1)} kg</div>
                    {c.notes && <div className="text-xs text-muted-foreground">{c.notes}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    {trend && (
                      <div className={`flex items-center gap-0.5 text-xs ${trend.color} mr-1`}>
                        {trend.icon}
                        {trend.diff !== 0 && <span>{trend.diff > 0 ? "+" : ""}{trend.diff.toFixed(1)}</span>}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mr-1">{c.date}</div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => setEditTarget(c as WeightCheck)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {checks && checks.length > 5 && (
              <button onClick={() => setShowAll(!showAll)} className="text-xs text-primary hover:underline w-full text-center pt-1">
                {showAll ? "Ver menos" : `Ver mais ${checks.length - 5} registros`}
              </button>
            )}
          </>
        )}
      </CardContent>

      {editTarget && (
        <EditWeightModal check={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </Card>
  );
}

function AddWeightModal() {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState("");

  const createWeightCheck = useCreateWeightCheck();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    createWeightCheck.mutate(
      { data: { weightKg: Number(weight), date, notes: notes || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWeightChecksQueryKey() });
          toast({ title: "Peso registrado com sucesso" });
          setOpen(false);
          setWeight("");
          setNotes("");
          setDate(getTodayDateString());
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-primary hover:bg-primary/10 gap-1 text-xs">
          <Plus className="w-3.5 h-3.5" /> Registrar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> Registrar Peso
          </DialogTitle>
        </DialogHeader>
        <WeightForm
          weight={weight} date={date} notes={notes}
          onWeightChange={setWeight} onDateChange={setDate} onNotesChange={setNotes}
          onSubmit={handleSubmit} isLoading={createWeightCheck.isPending}
          submitLabel="Salvar Medição"
        />
      </DialogContent>
    </Dialog>
  );
}

function EditWeightModal({ check, onClose }: { check: WeightCheck; onClose: () => void }) {
  const [weight, setWeight] = useState(String(check.weightKg));
  const [date, setDate] = useState(check.date);
  const [notes, setNotes] = useState(check.notes ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/weight-checks/${check.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: Number(weight), date, notes: notes || null }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getListWeightChecksQueryKey() });
        toast({ title: "Medição atualizada" });
        onClose();
      }
    } catch {
      toast({ title: "Erro ao atualizar medição", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> Editar Medição
          </DialogTitle>
        </DialogHeader>
        <WeightForm
          weight={weight} date={date} notes={notes}
          onWeightChange={setWeight} onDateChange={setDate} onNotesChange={setNotes}
          onSubmit={handleSubmit} isLoading={isLoading}
          submitLabel="Salvar Alterações"
        />
      </DialogContent>
    </Dialog>
  );
}

function WeightForm({ weight, date, notes, onWeightChange, onDateChange, onNotesChange, onSubmit, isLoading, submitLabel }: {
  weight: string; date: string; notes: string;
  onWeightChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Peso (kg)</Label>
        <Input required type="number" step="0.1" min="20" max="400" autoFocus
          value={weight} onChange={(e) => onWeightChange(e.target.value)} placeholder="Ex: 75.5" className="text-lg font-semibold" />
      </div>
      <div className="space-y-2">
        <Label>Data</Label>
        <Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Observações (opcional)</Label>
        <Input value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Ex: após treino, em jejum..." />
      </div>
      <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={isLoading || !weight}>
        {isLoading ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
