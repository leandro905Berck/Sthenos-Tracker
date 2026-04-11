import {
  useListExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
  getListExercisesQueryKey,
  useEstimateExerciseCalories,
} from "@/lib/custom-queries";
import { getTodayDateString } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
import { Dumbbell, Trash2, Plus, Flame, Timer, Pencil, Sparkles, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { EXERCISE_TEMPLATES, calcCalories, type ExerciseTemplate } from "@/lib/exercise-templates";

type Exercise = {
  id: number;
  name: string;
  type: string;
  durationMinutes: number | null;
  sets: number | null;
  reps: number | null;
  weightKg: number | null;
  caloriesBurned: number;
  notes: string | null;
  date: string;
};

export default function Exercises() {
  const today = getTodayDateString();
  const { data: exercises, isLoading } = useListExercises(
    { date: today },
    { query: { queryKey: getListExercisesQueryKey({ date: today }) } }
  );
  const deleteExercise = useDeleteExercise();
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);

  const handleDelete = (id: number) => {
    deleteExercise.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey({ date: today }) }),
    });
  };

  const totalCalories = exercises?.reduce((sum: number, e: any) => sum + Number(e.caloriesBurned), 0) ?? 0;

  return (
    <div className="p-4 space-y-4 pb-24">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Exercícios</h1>
          {exercises && exercises.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Flame className="w-3 h-3 text-primary" />
              {totalCalories} kcal queimadas hoje
            </p>
          )}
        </div>
        <AddExerciseModal date={today} />
      </header>

      {isLoading ? (
        <div className="text-center text-muted-foreground p-8">Carregando...</div>
      ) : exercises?.length === 0 ? (
        <div className="text-center text-muted-foreground p-10 border border-dashed border-border rounded-xl bg-card/30">
          <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum exercício registrado hoje.</p>
          <p className="text-xs mt-1 opacity-60">Toque em + para adicionar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises?.map((ex: any) => (
            <Card key={ex.id} className="bg-card border-border overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${ex.type === "cardio" ? "bg-blue-500/10" : "bg-primary/10"}`}>
                    {ex.type === "cardio"
                      ? <Timer className="w-5 h-5 text-blue-400" />
                      : <Dumbbell className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{ex.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span className="capitalize px-1.5 py-0.5 rounded text-[10px] bg-muted">
                        {ex.type === "cardio" ? "Cardio" : "Academia"}
                      </span>
                      {ex.durationMinutes && <span>{ex.durationMinutes} min</span>}
                      {ex.sets && ex.reps && <span>{ex.sets} séries × {ex.reps} reps</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-right mr-2">
                    <div className="text-sm font-bold flex items-center gap-1 text-primary">
                      <Flame className="w-3 h-3" />{Math.round(Number(ex.caloriesBurned))}
                    </div>
                    <div className="text-[10px] text-muted-foreground">kcal</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => setEditTarget(ex as Exercise)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(ex.id)} disabled={deleteExercise.isPending}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editTarget && (
        <EditExerciseModal exercise={editTarget} date={today} onClose={() => setEditTarget(null)} />
      )}
    </div>
  );
}

function AddExerciseModal({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"academia" | "cardio">("academia");
  const [selectedTemplate, setSelectedTemplate] = useState<ExerciseTemplate | null>(null);
  const [customName, setCustomName] = useState("");
  const [calories, setCalories] = useState("");
  const [duration, setDuration] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");

  const createExercise = useCreateExercise();
  const queryClient = useQueryClient();

  const handleTemplateSelect = (name: string) => {
    const template = EXERCISE_TEMPLATES.find((t) => t.name === name) ?? null;
    setSelectedTemplate(template);
    if (template) {
      setCustomName(template.name);
      if (template.defaultSets) setSets(String(template.defaultSets));
      if (template.defaultReps) setReps(String(template.defaultReps));
      if (template.defaultDuration) setDuration(String(template.defaultDuration));
      const cal = calcCalories(template, template.defaultSets ?? 0, template.defaultReps ?? 0, template.defaultDuration ?? 0);
      if (cal > 0) setCalories(String(cal));
    }
  };

  useEffect(() => {
    if (!selectedTemplate) return;
    const s = parseInt(sets) || 0;
    const r = parseInt(reps) || 0;
    const d = parseInt(duration) || 0;
    const cal = calcCalories(selectedTemplate, s, r, d);
    if (cal > 0) setCalories(String(cal));
  }, [sets, reps, duration, selectedTemplate]);

  const handleTypeChange = (val: "academia" | "cardio") => {
    setType(val);
    setSelectedTemplate(null);
    setCustomName("");
    setCalories("");
    setSets("");
    setReps("");
    setDuration("");
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTemplate(null);
    setCustomName("");
    setCalories("");
    setSets("");
    setReps("");
    setDuration("");
    setType("academia");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    if (!name || !calories) return;
    createExercise.mutate(
      { data: { name, type, caloriesBurned: Number(calories), date, durationMinutes: duration ? Number(duration) : undefined, sets: sets ? Number(sets) : undefined, reps: reps ? Number(reps) : undefined } },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey({ date }) }); handleClose(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Registrar Exercício</DialogTitle></DialogHeader>
        <ExerciseForm
          type={type} selectedTemplate={selectedTemplate} customName={customName}
          calories={calories} duration={duration} sets={sets} reps={reps}
          onTypeChange={handleTypeChange} onTemplateSelect={handleTemplateSelect}
          onCustomNameChange={(v) => { setCustomName(v); setSelectedTemplate(null); }}
          onCaloriesChange={setCalories} onDurationChange={setDuration}
          onSetsChange={setSets} onRepsChange={setReps}
          onSubmit={handleSubmit} isLoading={createExercise.isPending}
          submitLabel="Salvar Exercício"
        />
      </DialogContent>
    </Dialog>
  );
}

function EditExerciseModal({ exercise, date, onClose }: { exercise: Exercise; date: string; onClose: () => void }) {
  const updateExercise = useUpdateExercise();
  const queryClient = useQueryClient();

  const [type, setType] = useState<"academia" | "cardio">(exercise.type as "academia" | "cardio");
  const [customName, setCustomName] = useState(exercise.name);
  const [calories, setCalories] = useState(String(exercise.caloriesBurned));
  const [duration, setDuration] = useState(exercise.durationMinutes ? String(exercise.durationMinutes) : "");
  const [sets, setSets] = useState(exercise.sets ? String(exercise.sets) : "");
  const [reps, setReps] = useState(exercise.reps ? String(exercise.reps) : "");
  const [selectedTemplate, setSelectedTemplate] = useState<ExerciseTemplate | null>(null);

  const handleTemplateSelect = (name: string) => {
    const template = EXERCISE_TEMPLATES.find((t) => t.name === name) ?? null;
    setSelectedTemplate(template);
    if (template) {
      setCustomName(template.name);
      if (template.defaultSets) setSets(String(template.defaultSets));
      if (template.defaultReps) setReps(String(template.defaultReps));
      if (template.defaultDuration) setDuration(String(template.defaultDuration));
      const cal = calcCalories(template, template.defaultSets ?? 0, template.defaultReps ?? 0, template.defaultDuration ?? 0);
      if (cal > 0) setCalories(String(cal));
    }
  };

  useEffect(() => {
    if (!selectedTemplate) return;
    const s = parseInt(sets) || 0;
    const r = parseInt(reps) || 0;
    const d = parseInt(duration) || 0;
    const cal = calcCalories(selectedTemplate, s, r, d);
    if (cal > 0) setCalories(String(cal));
  }, [sets, reps, duration, selectedTemplate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    if (!name || !calories) return;
    updateExercise.mutate(
      { id: exercise.id, data: { name, type, caloriesBurned: Number(calories), durationMinutes: duration ? Number(duration) : undefined, sets: sets ? Number(sets) : undefined, reps: reps ? Number(reps) : undefined } },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey({ date }) }); onClose(); } }
    );
  };

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Exercício</DialogTitle></DialogHeader>
        <ExerciseForm
          type={type} selectedTemplate={selectedTemplate} customName={customName}
          calories={calories} duration={duration} sets={sets} reps={reps}
          onTypeChange={(val) => { setType(val); setSelectedTemplate(null); }}
          onTemplateSelect={handleTemplateSelect}
          onCustomNameChange={(v) => { setCustomName(v); setSelectedTemplate(null); }}
          onCaloriesChange={setCalories} onDurationChange={setDuration}
          onSetsChange={setSets} onRepsChange={setReps}
          onSubmit={handleSubmit} isLoading={updateExercise.isPending}
          submitLabel="Salvar Alterações"
        />
      </DialogContent>
    </Dialog>
  );
}

function ExerciseForm({
  type, selectedTemplate, customName, calories, duration, sets, reps,
  onTypeChange, onTemplateSelect, onCustomNameChange, onCaloriesChange,
  onDurationChange, onSetsChange, onRepsChange, onSubmit, isLoading, submitLabel,
}: {
  type: "academia" | "cardio";
  selectedTemplate: ExerciseTemplate | null;
  customName: string;
  calories: string;
  duration: string;
  sets: string;
  reps: string;
  onTypeChange: (v: "academia" | "cardio") => void;
  onTemplateSelect: (name: string) => void;
  onCustomNameChange: (v: string) => void;
  onCaloriesChange: (v: string) => void;
  onDurationChange: (v: string) => void;
  onSetsChange: (v: string) => void;
  onRepsChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  const [isEstimating, setIsEstimating] = useState(false);
  const { toast } = useToast();
  const estimateExerciseCalories = useEstimateExerciseCalories();
  const filteredTemplates = EXERCISE_TEMPLATES.filter((t) => t.type === type);

  const handleAiEstimate = useCallback(async () => {
    if (!customName.trim()) return;
    setIsEstimating(true);
    estimateExerciseCalories.mutate(
      {
        exerciseName: customName.trim(),
        type,
        duration: duration ? Number(duration) : undefined,
        sets: sets ? Number(sets) : undefined,
        reps: reps ? Number(reps) : undefined,
      },
      {
        onSuccess: (data: any) => {
          if (data?.estimatedCalories > 0) {
            onCaloriesChange(String(data.estimatedCalories));
            toast({
              title: "Calorias estimadas pela IA",
              description: `${data.estimatedCalories} kcal — ${data.description || "Calculado via Gemini"}`,
            });
          } else {
            toast({ title: "Não foi possível estimar", description: "Informe as calorias manualmente.", variant: "destructive" });
          }
          setIsEstimating(false);
        },
        onError: (err: any) => {
          toast({ title: "Erro ao estimar calorias", description: err?.message || "Ocorreu um erro desconhecido.", variant: "destructive" });
          setIsEstimating(false);
        }
      }
    );
  }, [customName, type, duration, sets, reps, onCaloriesChange, toast, estimateExerciseCalories]);

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Tipo</Label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onTypeChange("academia")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${type === "academia" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
            <Dumbbell className="w-4 h-4" /> Academia
          </button>
          <button type="button" onClick={() => onTypeChange("cardio")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${type === "cardio" ? "bg-blue-500 text-white border-blue-500" : "bg-card border-border text-muted-foreground hover:border-blue-400/50"}`}>
            <Timer className="w-4 h-4" /> Cardio
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Exercício (template opcional)</Label>
        <Select value={selectedTemplate?.name ?? ""} onValueChange={onTemplateSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um exercício..." />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {filteredTemplates.map((t) => (
              <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
            ))}
            <SelectItem value="__custom__">Outro (digitar nome)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Nome do exercício</Label>
        <div className="flex gap-2">
          <Input
            required
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            placeholder="Ex: Supino Reto, Corrida, etc."
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            title="Estimar calorias pela IA"
            className="shrink-0 border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleAiEstimate}
            disabled={!customName.trim() || isEstimating}
          >
            {isEstimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>
        {customName.trim() && !calories && (
          <p className="text-[11px] text-muted-foreground">Toque em ✨ para estimar calorias pela IA</p>
        )}
      </div>

      {type === "academia" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Séries</Label>
            <Input type="number" min="1" value={sets} onChange={(e) => onSetsChange(e.target.value)} placeholder="3" />
          </div>
          <div className="space-y-2">
            <Label>Repetições</Label>
            <Input type="number" min="1" value={reps} onChange={(e) => onRepsChange(e.target.value)} placeholder="10" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Duração (minutos)</Label>
        <Input type="number" min="1" value={duration} onChange={(e) => onDurationChange(e.target.value)} placeholder="45" />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-primary" /> Calorias Gastas (kcal)
          {selectedTemplate && <span className="text-[10px] text-muted-foreground font-normal">calculado automaticamente</span>}
        </Label>
        <Input
          type="number"
          required
          min="1"
          value={calories}
          onChange={(e) => onCaloriesChange(e.target.value)}
          placeholder="Ex: 250"
          className={selectedTemplate ? "border-primary/40 bg-primary/5" : ""}
        />
      </div>

      <Button type="submit" className="w-full bg-primary text-primary-foreground"
        disabled={isLoading || !customName || !calories}>
        {isLoading ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
