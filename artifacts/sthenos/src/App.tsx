import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Exercises from "@/pages/exercises";
import Meals from "@/pages/meals";
import Reports from "@/pages/reports";
import Profile from "@/pages/profile";
import Diet from "@/pages/diet";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";

import { Layout } from "@/components/layout";
import { Onboarding } from "@/components/onboarding";
import { WeightCheckModal } from "@/components/weight-check-modal";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Configura o cliente de API para usar o Supabase Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (supabaseUrl) {
  // Ajusta a URL para apontar para o diretório de funções (/functions/v1)
  const apiUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/api`;
  setBaseUrl(apiUrl);
}

setAuthTokenGetter(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
});


function SupabaseQueryClientCacheInvalidator() {

  const { user } = useAuth();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const userId = user?.id ?? null;
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      qc.clear();
    }
    prevUserIdRef.current = userId;
  }, [user, qc]);

  return null;
}

function AppRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/exercicios" component={Exercises} />
        <Route path="/alimentacao" component={Meals} />
        <Route path="/relatorios" component={Reports} />
        <Route path="/perfil" component={Profile} />
        <Route path="/dieta" component={Diet} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public auth pages */}
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <AuthPage />}
      </Route>

      {/* Main App */}
      <Route>
        {user ? (
          <>
            <Onboarding />
            <WeightCheckModal />
            <AppRoutes />
          </>
        ) : (
          <Switch>
            <Route path="/" component={Landing} />
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <SupabaseQueryClientCacheInvalidator />
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
