import { useListMeals, useCreateMeal, useUpdateMeal, useDeleteMeal, useAnalyzeFoodImage, getListMealsQueryKey } from "@workspace/api-client-react";
import { getTodayDateString } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useCallback } from "react";
import { Trash2, Plus, Utensils, Camera, Brain, Loader2, Sparkles, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

type Meal = {
  id: number;
  name: string;
  category: string;
  caloriesKcal: number;
  description: string | null;
  aiAnalyzed: boolean;
};

async function compressImageToBase64(file: File, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function Meals() {
  const today = getTodayDateString();
  const { data: meals, isLoading } = useListMeals({ date: today }, { query: { queryKey: getListMealsQueryKey({ date: today }) } });
  const deleteMeal = useDeleteMeal();
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<Meal | null>(null);

  const handleDelete = (id: number) => {
    deleteMeal.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMealsQueryKey({ date: today }) })
    });
  };

  const categories: Record<string, string> = {
    cafe: "Café da Manhã",
    almoco: "Almoço",
    janta: "Jantar",
    lanche: "Lanche",
  };

  const totalCalories = meals?.reduce((acc, m) => acc + Number(m.caloriesKcal), 0) ?? 0;

  return (
    <div className="p-4 space-y-4 pb-24">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Alimentação</h1>
          {meals && meals.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Utensils className="w-3 h-3" />
              {totalCalories.toLocaleString("pt-BR")} kcal consumidas hoje
            </p>
          )}
        </div>
        <AddMealModal date={today} />
      </header>

      {isLoading ? (
        <div className="text-center text-muted-foreground p-8">Carregando...</div>
      ) : meals?.length === 0 ? (
        <div className="text-center text-muted-foreground p-10 border border-dashed border-border rounded-xl bg-card/30">
          <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma refeição registrada hoje.</p>
          <p className="text-xs mt-1 opacity-60">Toque em + para adicionar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categories).map(([catKey, catName]) => {
            const catMeals = meals?.filter(m => m.category === catKey) || [];
            if (catMeals.length === 0) return null;
            const totalCatCals = catMeals.reduce((acc, m) => acc + Number(m.caloriesKcal), 0);

            return (
              <div key={catKey} className="space-y-2">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h2 className="font-semibold text-sm text-foreground/80">{catName}</h2>
                  <span className="text-xs font-bold text-muted-foreground">{totalCatCals.toLocaleString("pt-BR")} kcal</span>
                </div>
                {catMeals.map((meal) => (
                  <Card key={meal.id} className="bg-card border-border overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-sm truncate">{meal.name}</h3>
                          {meal.aiAnalyzed && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 bg-primary/10 text-primary border-primary/20 shrink-0">
                              <Brain className="w-2.5 h-2.5 mr-0.5" /> IA
                            </Badge>
                          )}
                        </div>
                        {meal.description && (
                          <p className="text-xs text-muted-foreground truncate">{meal.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="text-right mr-1">
                          <div className="text-sm font-bold text-foreground">{Number(meal.caloriesKcal).toLocaleString("pt-BR")}</div>
                          <div className="text-[10px] text-muted-foreground">kcal</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => setEditTarget(meal as Meal)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(meal.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {editTarget && (
        <EditMealModal meal={editTarget} date={today} onClose={() => setEditTarget(null)} />
      )}
    </div>
  );
}

function MealFormFields({
  category, name, calories, description, isAiAnalyzed,
  onCategoryChange, onNameChange, onCaloriesChange, onDescriptionChange,
  extraNameAction,
}: {
  category: string;
  name: string;
  calories: string;
  description: string;
  isAiAnalyzed: boolean;
  onCategoryChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onCaloriesChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  extraNameAction?: React.ReactNode;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Refeição</Label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cafe">Café da Manhã</SelectItem>
            <SelectItem value="almoco">Almoço</SelectItem>
            <SelectItem value="janta">Jantar</SelectItem>
            <SelectItem value="lanche">Lanche</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Nome do Alimento
          {isAiAnalyzed && <Badge className="text-[10px] h-4 py-0 bg-primary/20 text-primary border-primary/30">IA</Badge>}
        </Label>
        <div className="flex gap-2">
          <Input required value={name} onChange={e => onNameChange(e.target.value)} placeholder="Ex: Frango com batata doce" className="flex-1" />
          {extraNameAction}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Calorias (kcal)
          {isAiAnalyzed && calories && <span className="text-[10px] text-muted-foreground font-normal">estimado pela IA</span>}
        </Label>
        <Input type="number" required min="1" value={calories} onChange={e => onCaloriesChange(e.target.value)} placeholder="Ex: 450"
          className={isAiAnalyzed && calories ? "border-primary/40 bg-primary/5" : ""} />
      </div>

      <div className="space-y-2">
        <Label>Descrição / Notas (Opcional)</Label>
        <Input value={description} onChange={e => onDescriptionChange(e.target.value)} placeholder="Ingredientes ou detalhes..." />
      </div>
    </>
  );
}

function AddMealModal({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("almoco");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [description, setDescription] = useState("");
  const [isAiAnalyzed, setIsAiAnalyzed] = useState(false);
  const [isEstimatingCalories, setIsEstimatingCalories] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMeal = useCreateMeal();
  const analyzeImage = useAnalyzeFoodImage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getToken } = useAuth();

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToBase64(file, 800);
      analyzeImage.mutate({ data: { imageBase64: compressed, mealCategory: category } }, {
        onSuccess: (result) => {
          if (result.foodName && result.foodName !== "Alimento não identificado") {
            setName(result.foodName);
            setCalories(String(result.estimatedCalories));
            setDescription(result.description ?? "");
            setIsAiAnalyzed(true);
            toast({ title: "Alimento identificado pela IA!", description: result.foodName });
          } else {
            toast({ title: "Não consegui identificar o alimento", description: "Digite o nome manualmente.", variant: "destructive" });
          }
        },
        onError: () => toast({ title: "Erro na análise da foto", variant: "destructive" }),
      });
    } catch {
      toast({ title: "Erro ao processar imagem", variant: "destructive" });
    }
    if (e.target) e.target.value = "";
  }, [analyzeImage, category, toast]);

  const estimateCaloriesFromName = useCallback(async () => {
    if (!name.trim()) return;
    setIsEstimatingCalories(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/ai/estimate-calories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ foodName: name.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.estimatedCalories > 0) {
        setCalories(String(data.estimatedCalories));
        if (data.description) setDescription(data.description);
        setIsAiAnalyzed(true);
        toast({ title: "Calorias estimadas pela IA", description: `${data.estimatedCalories} kcal — ${data.description}` });
      }
    } catch {
      toast({ title: "Erro ao estimar calorias", variant: "destructive" });
    } finally {
      setIsEstimatingCalories(false);
    }
  }, [name, toast, getToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;
    createMeal.mutate({ data: { name, category, caloriesKcal: Number(calories), description, aiAnalyzed: isAiAnalyzed, date } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMealsQueryKey({ date }) });
        setOpen(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setName(""); setCalories(""); setDescription(""); setIsAiAnalyzed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isAnalyzing = analyzeImage.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Refeição</DialogTitle>
        </DialogHeader>
        <div className="pt-2 space-y-4">
          <div>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <Button type="button" variant="outline"
              className="w-full h-12 flex items-center justify-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
              {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando com IA...</> : <><Camera className="w-4 h-4" /> Analisar Foto com IA</>}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou insira manualmente</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <MealFormFields
              category={category} name={name} calories={calories} description={description} isAiAnalyzed={isAiAnalyzed}
              onCategoryChange={setCategory}
              onNameChange={(v) => { setName(v); setIsAiAnalyzed(false); }}
              onCaloriesChange={setCalories}
              onDescriptionChange={setDescription}
              extraNameAction={
                <Button type="button" size="icon" variant="outline" title="Estimar calorias pelo nome"
                  className="shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={estimateCaloriesFromName} disabled={!name.trim() || isEstimatingCalories}>
                  {isEstimatingCalories ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              }
            />
            <Button type="submit" className="w-full bg-primary text-primary-foreground"
              disabled={createMeal.isPending || isAnalyzing || !name || !calories}>
              {createMeal.isPending ? "Salvando..." : "Salvar Refeição"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditMealModal({ meal, date, onClose }: { meal: Meal; date: string; onClose: () => void }) {
  const [category, setCategory] = useState(meal.category);
  const [name, setName] = useState(meal.name);
  const [calories, setCalories] = useState(String(meal.caloriesKcal));
  const [description, setDescription] = useState(meal.description ?? "");
  const [isEstimatingCalories, setIsEstimatingCalories] = useState(false);

  const updateMeal = useUpdateMeal();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getToken } = useAuth();

  const estimateCaloriesFromName = useCallback(async () => {
    if (!name.trim()) return;
    setIsEstimatingCalories(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/ai/estimate-calories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ foodName: name.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.estimatedCalories > 0) {
        setCalories(String(data.estimatedCalories));
        if (data.description) setDescription(data.description);
        toast({ title: "Calorias estimadas pela IA", description: `${data.estimatedCalories} kcal` });
      }
    } catch {
      toast({ title: "Erro ao estimar calorias", variant: "destructive" });
    } finally {
      setIsEstimatingCalories(false);
    }
  }, [name, toast, getToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;
    updateMeal.mutate({ id: meal.id, data: { name, category, caloriesKcal: Number(calories), description } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMealsQueryKey({ date }) });
        onClose();
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Refeição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <MealFormFields
            category={category} name={name} calories={calories} description={description} isAiAnalyzed={false}
            onCategoryChange={setCategory}
            onNameChange={setName}
            onCaloriesChange={setCalories}
            onDescriptionChange={setDescription}
            extraNameAction={
              <Button type="button" size="icon" variant="outline" title="Estimar calorias pelo nome"
                className="shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                onClick={estimateCaloriesFromName} disabled={!name.trim() || isEstimatingCalories}>
                {isEstimatingCalories ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
            }
          />
          <Button type="submit" className="w-full bg-primary text-primary-foreground"
            disabled={updateMeal.isPending || !name || !calories}>
            {updateMeal.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
