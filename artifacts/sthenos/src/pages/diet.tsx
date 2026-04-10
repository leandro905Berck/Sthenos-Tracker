import { useGetAiDietPlan, getGetAiDietPlanQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Info, Utensils, Target, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Diet() {
  const { data: dietPlan, isLoading } = useGetAiDietPlan({ query: { queryKey: getGetAiDietPlanQueryKey() } });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Brain className="w-8 h-8 text-primary animate-pulse" />
        <p>A IA está gerando seu plano personalizado...</p>
      </div>
    );
  }

  if (!dietPlan) {
    return <div className="p-8 text-center text-muted-foreground">Não foi possível carregar o plano.</div>;
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/perfil" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Dieta IA</h1>
      </header>

      <Card className="bg-gradient-to-br from-primary/20 to-card border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Seu Alvo Diário</h2>
          </div>
          <div className="text-4xl font-black text-foreground">{dietPlan.targetCalories} <span className="text-base font-medium text-muted-foreground">kcal</span></div>
          <div className="mt-4 flex gap-2">
            <Badge variant="outline" className="bg-background/50 border-border">IMC: {dietPlan.bmi?.toFixed(1)}</Badge>
            <Badge variant="outline" className="bg-background/50 border-border capitalize">{dietPlan.bmiCategory.replace("_", " ")}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2"><Utensils className="w-4 h-4" /> Sugestões por Refeição</h3>
        
        <MealSuggestions title="Café da Manhã" items={dietPlan.breakfastSuggestions} />
        <MealSuggestions title="Almoço" items={dietPlan.lunchSuggestions} />
        <MealSuggestions title="Lanche" items={dietPlan.snackSuggestions} />
        <MealSuggestions title="Jantar" items={dietPlan.dinnerSuggestions} />
      </div>

      {dietPlan.generalAdvice && (
        <Card className="bg-card border-border mt-6">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Conselho Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground leading-relaxed">{dietPlan.generalAdvice}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MealSuggestions({ title, items }: { title: string, items: string[] }) {
  if (!items || items.length === 0) return null;
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
