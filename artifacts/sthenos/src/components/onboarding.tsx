import { useGetProfile, useCreateProfile } from "@/lib/custom-queries";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProfileQueryKey } from "@/lib/custom-queries";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  age: z.coerce.number().min(10, "Idade inválida"),
  gender: z.string().min(1, "Gênero é obrigatório"),
  weightKg: z.coerce.number().min(30, "Peso inválido"),
  heightCm: z.coerce.number().min(100, "Altura inválida"),
  goal: z.string().min(1, "Objetivo é obrigatório"),
  activityLevel: z.string().min(1, "Nível de atividade é obrigatório"),
});

export function Onboarding() {
  const { data: profile, isLoading, error } = useGetProfile({ query: { retry: false } });
  const createProfile = useCreateProfile();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      age: 25,
      gender: "masculino",
      weightKg: 70,
      heightCm: 170,
      goal: "manutencao",
      activityLevel: "moderado",
    },
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-background"><p>Carregando...</p></div>;
  if (profile) return null; // Already has profile

  const onSubmit = (data: z.infer<typeof schema>) => {
    createProfile.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-card p-6 rounded-xl border border-border shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-center text-primary">STHENOS</h1>
        <p className="text-muted-foreground text-center mb-6">Configure seu perfil para começar</p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input id="age" type="number" {...form.register("age")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Select onValueChange={(val) => form.setValue("gender", val)} defaultValue={form.getValues("gender")}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weightKg">Peso (kg)</Label>
              <Input id="weightKg" type="number" step="0.1" {...form.register("weightKg")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightCm">Altura (cm)</Label>
              <Input id="heightCm" type="number" {...form.register("heightCm")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Objetivo</Label>
            <Select onValueChange={(val) => form.setValue("goal", val)} defaultValue={form.getValues("goal")}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="perda de peso">Perda de peso</SelectItem>
                <SelectItem value="manutenção">Manutenção</SelectItem>
                <SelectItem value="ganho muscular">Ganho muscular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityLevel">Nível de Atividade</Label>
            <Select onValueChange={(val) => form.setValue("activityLevel", val)} defaultValue={form.getValues("activityLevel")}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentario">Sedentário</SelectItem>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="moderado">Moderado</SelectItem>
                <SelectItem value="intenso">Intenso</SelectItem>
                <SelectItem value="muito_intenso">Muito Intenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full mt-6 bg-gradient-to-r from-primary to-orange-600" disabled={createProfile.isPending}>
            {createProfile.isPending ? "Salvando..." : "Começar Jornada"}
          </Button>
        </form>
      </div>
    </div>
  );
}
