import { useGetDailyReportHistory, useListWeightChecks, getGetDailyReportHistoryQueryKey, getListWeightChecksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, parseISO } from "date-fns";

export default function Reports() {
  const { data: history, isLoading: loadingHistory } = useGetDailyReportHistory({ days: 30 }, { query: { queryKey: getGetDailyReportHistoryQueryKey({ days: 30 }) } });
  const { data: weightChecks, isLoading: loadingWeight } = useListWeightChecks({ query: { queryKey: getListWeightChecksQueryKey() } });

  if (loadingHistory || loadingWeight) {
    return <div className="p-8 text-center text-muted-foreground">Carregando relatórios...</div>;
  }

  // Format data for charts
  const historyData = [...(history || [])].reverse().map(day => ({
    ...day,
    formattedDate: format(parseISO(day.date), "dd/MM")
  }));

  const weightData = [...(weightChecks || [])].reverse().map(check => ({
    ...check,
    formattedDate: format(parseISO(check.date), "dd/MM")
  }));

  // Calculate meal distribution from the last 7 days to get a meaningful pie chart
  const recentDays = historyData.slice(-7);
  const mealDistData = [
    { name: "Café", value: recentDays.reduce((acc, d) => acc + d.breakfastCalories, 0) },
    { name: "Almoço", value: recentDays.reduce((acc, d) => acc + d.lunchCalories, 0) },
    { name: "Jantar", value: recentDays.reduce((acc, d) => acc + d.dinnerCalories, 0) },
    { name: "Lanche", value: recentDays.reduce((acc, d) => acc + d.snackCalories, 0) },
  ].filter(d => d.value > 0);

  const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74'];

  return (
    <div className="p-4 space-y-6 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Relatórios</h1>
      </header>

      <Card className="bg-card border-border">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-medium">Balanço Calórico (Últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-4 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
                labelStyle={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
              <Bar dataKey="totalCaloriesConsumed" name="Consumido" fill="#3f3f46" radius={[2, 2, 0, 0]} />
              <Bar dataKey="totalCaloriesBurned" name="Gasto" fill="#ea580c" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-medium">Evolução de Peso (kg)</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-4 h-[200px]">
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 2', 'auto']} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', color: '#ea580c' }}
                  labelStyle={{ fontSize: '12px', color: '#a1a1aa' }}
                />
                <Line type="monotone" dataKey="weightKg" name="Peso" stroke="#ea580c" strokeWidth={3} dot={{ fill: '#ea580c', r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Sem dados de peso registrados
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-medium">Distribuição de Refeições (7 dias)</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-4 h-[200px]">
          {mealDistData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mealDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mealDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Sem refeições registradas nos últimos 7 dias
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
