import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dumbbell, Utensils, BarChart2, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Dumbbell className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">
          Sthenos
        </h1>
        <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">
          Força e disciplina
        </p>
        <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
          Acompanhe seus treinos, alimentação e evolução com inteligência artificial.
        </p>

        {/* Features */}
        <div className="mt-8 w-full max-w-xs space-y-3">
          {[
            { icon: Dumbbell, text: "Registro de exercícios com calorias automáticas" },
            { icon: Utensils, text: "Análise de refeições por IA com foto" },
            { icon: BarChart2, text: "Relatórios e evolução do peso" },
            { icon: Sparkles, text: "Plano de dieta personalizado por IA" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 text-left"
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 space-y-3 max-w-xs mx-auto w-full pb-10">
        <Link href="/sign-up" className="block">
          <Button className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            Criar conta grátis
          </Button>
        </Link>
        <Link href="/sign-in" className="block">
          <Button
            variant="outline"
            className="w-full h-12 text-base border-border hover:border-primary/50 hover:bg-card"
          >
            Já tenho uma conta
          </Button>
        </Link>
      </div>
    </div>
  );
}
