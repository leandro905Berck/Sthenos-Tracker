import { Link, useLocation } from "wouter";
import { Home, Dumbbell, Utensils, BarChart2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Hoje" },
  { href: "/exercicios", icon: Dumbbell, label: "Exercícios" },
  { href: "/alimentacao", icon: Utensils, label: "Alimentação" },
  { href: "/relatorios", icon: BarChart2, label: "Relatórios" },
  { href: "/perfil", icon: User, label: "Perfil" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] pb-16 flex flex-col bg-background text-foreground">
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full border-t border-border bg-card/80 backdrop-blur-md pb-safe">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} className="w-full h-full">
                <div className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                )}>
                  <Icon className={cn("w-5 h-5", isActive && "animate-in zoom-in-90")} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
