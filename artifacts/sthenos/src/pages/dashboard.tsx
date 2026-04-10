import {
  useGetDailyReport,
  useGetAiDailySummary,
  useGetProfile,
  getGetDailyReportQueryKey,
  getGetAiDailySummaryQueryKey,
  getGetProfileQueryKey,
} from "@/lib/custom-queries";
import { getTodayDateString } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Flame, Activity, Utensils, Brain, Dumbbell, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

function calcDailyGoal(tdee: number, goal: string | null): number {
  if (goal === "perda de peso") return Math.round(tdee - 500);
  if (goal === "ganho muscular") return Math.round(tdee + 300);
  return Math.round(tdee);
}

export default function Dashboard() {
  const today = getTodayDateString();
  const { data: report, isLoading: loadingReport } = useGetDailyReport(
    { date: today },
    { query: { queryKey: getGetDailyReportQueryKey({ date: today }) } }
  );
  const { data: aiSummary } = useGetAiDailySummary(
    { date: today },
    { query: { queryKey: getGetAiDailySummaryQueryKey({ date: today }) } }
  );
  const { data: profile } = useGetProfile({
    query: { queryKey: getGetProfileQueryKey() },
  });

  const burned = Number(report?.totalCaloriesBurned ?? 0);
  const consumed = Number(report?.totalCaloriesConsumed ?? 0);
  const net = Number(report?.netCalories ?? 0);

  const tdee = profile?.tdee ? Number(profile.tdee) : null;
  const dailyGoal = tdee ? calcDailyGoal(tdee, profile?.goal ?? null) : null;

  const remaining = dailyGoal != null ? dailyGoal - net : null;
  const progressPct =
    dailyGoal != null && dailyGoal > 0 && net >= 0
      ? Math.min(100, Math.round((net / dailyGoal) * 100))
      : 0;
  const isOver = dailyGoal != null && net > dailyGoal;

  const goalLabel =
    profile?.goal === "perda de peso"
      ? "Meta de déficit (−500 kcal)"
      : profile?.goal === "ganho muscular"
      ? "Meta de superávit (+300 kcal)"
      : "Meta de manutenção";

  const balanceColor =
    net > 200 ? "text-red-400" : net < -200 ? "text-green-400" : "text-muted-foreground";

  return (
    <div className="p-4 space-y-4 pb-24">
      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Hoje</h1>
        <div className="flex gap-2">
          <Link href="/exercicios">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full bg-card hover:bg-accent border-primary/20"
            >
              <Dumbbell className="w-4 h-4 text-primary" />
            </Button>
          </Link>
          <Link href="/alimentacao">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full bg-card hover:bg-accent border-primary/20"
            >
              <Utensils className="w-4 h-4 text-primary" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Daily goal card */}
      {dailyGoal != null && (
        <Card className="border-primary/30 bg-card overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">{goalLabel}</span>
              </div>
              <span className="text-xs font-semibold text-primary">
                {dailyGoal.toLocaleString("pt-BR")} kcal/dia
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOver ? "bg-red-500" : "bg-primary"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Saldo (Líquido): <span className="text-foreground font-medium">{net.toLocaleString("pt-BR")}</span> kcal
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    isOver ? "text-red-400" : remaining === 0 ? "text-green-400" : "text-muted-foreground"
                  }`}
                >
                  {isOver
                    ? `+${Math.abs(remaining!).toLocaleString("pt-BR")} acima da meta`
                    : remaining === 0
                    ? "Meta atingida!"
                    : `Faltam ${remaining!.toLocaleString("pt-BR")} kcal`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consumed / Burned cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Utensils className="w-3 h-3" /> Consumido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {consumed.toLocaleString("pt-BR")}{" "}
              <span className="text-xs font-normal text-muted-foreground">kcal</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-primary" /> Gasto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {burned.toLocaleString("pt-BR")}{" "}
              <span className="text-xs font-normal text-muted-foreground">kcal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net balance */}
      <Card className="border-primary/20 bg-card overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Activity className="w-24 h-24" />
        </div>
        <CardHeader className="p-4 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Líquido</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 relative z-10">
          <div className={`text-4xl font-bold ${balanceColor}`}>
            {net > 0 ? "+" : ""}
            {net.toLocaleString("pt-BR")}{" "}
            <span className="text-sm font-normal text-muted-foreground">kcal</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {net > 200
              ? "Excedente calórico hoje"
              : net < -200
              ? "Déficit calórico hoje"
              : "Manutenção"}
          </p>
        </CardContent>
      </Card>

      {/* AI summary */}
      {aiSummary && (
        <Card className="border-border bg-card/50">
          <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-medium">Análise de IA</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <p className="text-sm">{aiSummary.summary}</p>
            <div className="text-xs text-muted-foreground bg-black/20 p-2 rounded-md border border-white/5">
              <span className="font-semibold text-primary">Recomendação:</span>{" "}
              {aiSummary.recommendation}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
