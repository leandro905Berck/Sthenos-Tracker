export type ExerciseTemplate = {
  name: string;
  type: "academia" | "cardio";
  calPerSet?: number;
  calPerMinute?: number;
  defaultSets?: number;
  defaultReps?: number;
  defaultDuration?: number;
};

export const EXERCISE_TEMPLATES: ExerciseTemplate[] = [
  // Academia - Peito
  { name: "Supino Reto", type: "academia", calPerSet: 18, defaultSets: 4, defaultReps: 10 },
  { name: "Supino Inclinado", type: "academia", calPerSet: 16, defaultSets: 4, defaultReps: 10 },
  { name: "Supino Declinado", type: "academia", calPerSet: 16, defaultSets: 4, defaultReps: 10 },
  { name: "Crossover", type: "academia", calPerSet: 12, defaultSets: 3, defaultReps: 12 },
  { name: "Crucifixo", type: "academia", calPerSet: 12, defaultSets: 3, defaultReps: 12 },
  // Academia - Costas
  { name: "Puxada Frontal", type: "academia", calPerSet: 18, defaultSets: 4, defaultReps: 10 },
  { name: "Remada Curvada", type: "academia", calPerSet: 20, defaultSets: 4, defaultReps: 10 },
  { name: "Remada Unilateral", type: "academia", calPerSet: 15, defaultSets: 4, defaultReps: 10 },
  { name: "Levantamento Terra", type: "academia", calPerSet: 28, defaultSets: 4, defaultReps: 8 },
  { name: "Pulldown", type: "academia", calPerSet: 16, defaultSets: 4, defaultReps: 12 },
  // Academia - Pernas
  { name: "Agachamento Livre", type: "academia", calPerSet: 30, defaultSets: 4, defaultReps: 10 },
  { name: "Leg Press", type: "academia", calPerSet: 22, defaultSets: 4, defaultReps: 12 },
  { name: "Extensão de Perna", type: "academia", calPerSet: 12, defaultSets: 4, defaultReps: 12 },
  { name: "Flexão de Perna", type: "academia", calPerSet: 12, defaultSets: 4, defaultReps: 12 },
  { name: "Stiff", type: "academia", calPerSet: 20, defaultSets: 4, defaultReps: 10 },
  { name: "Afundo", type: "academia", calPerSet: 18, defaultSets: 3, defaultReps: 12 },
  { name: "Panturrilha em Pé", type: "academia", calPerSet: 8, defaultSets: 4, defaultReps: 15 },
  // Academia - Ombros
  { name: "Desenvolvimento", type: "academia", calPerSet: 16, defaultSets: 4, defaultReps: 10 },
  { name: "Elevação Lateral", type: "academia", calPerSet: 10, defaultSets: 4, defaultReps: 12 },
  { name: "Elevação Frontal", type: "academia", calPerSet: 10, defaultSets: 3, defaultReps: 12 },
  { name: "Crucifixo Invertido", type: "academia", calPerSet: 10, defaultSets: 3, defaultReps: 12 },
  // Academia - Bíceps / Tríceps
  { name: "Rosca Direta", type: "academia", calPerSet: 10, defaultSets: 4, defaultReps: 12 },
  { name: "Rosca Martelo", type: "academia", calPerSet: 10, defaultSets: 4, defaultReps: 12 },
  { name: "Rosca Scott", type: "academia", calPerSet: 10, defaultSets: 3, defaultReps: 12 },
  { name: "Tríceps Pulley", type: "academia", calPerSet: 10, defaultSets: 4, defaultReps: 12 },
  { name: "Tríceps Francês", type: "academia", calPerSet: 12, defaultSets: 3, defaultReps: 12 },
  { name: "Mergulho no Banco", type: "academia", calPerSet: 14, defaultSets: 3, defaultReps: 12 },
  // Academia - Abdômen / Core
  { name: "Abdominal Supra", type: "academia", calPerSet: 8, defaultSets: 4, defaultReps: 20 },
  { name: "Abdominal Infra", type: "academia", calPerSet: 8, defaultSets: 4, defaultReps: 20 },
  { name: "Prancha", type: "academia", calPerSet: 6, defaultSets: 3, defaultReps: 1 },
  // Cardio
  { name: "Corrida na Esteira", type: "cardio", calPerMinute: 11, defaultDuration: 30 },
  { name: "Corrida ao Ar Livre", type: "cardio", calPerMinute: 11, defaultDuration: 30 },
  { name: "Bicicleta Ergométrica", type: "cardio", calPerMinute: 8, defaultDuration: 30 },
  { name: "Bike ao Ar Livre", type: "cardio", calPerMinute: 10, defaultDuration: 40 },
  { name: "Elíptico", type: "cardio", calPerMinute: 9, defaultDuration: 30 },
  { name: "Pular Corda", type: "cardio", calPerMinute: 12, defaultDuration: 20 },
  { name: "Natação", type: "cardio", calPerMinute: 10, defaultDuration: 30 },
  { name: "Remo Ergométrico", type: "cardio", calPerMinute: 10, defaultDuration: 20 },
  { name: "HIIT", type: "cardio", calPerMinute: 14, defaultDuration: 20 },
  { name: "Caminhada", type: "cardio", calPerMinute: 5, defaultDuration: 45 },
  { name: "Step", type: "cardio", calPerMinute: 9, defaultDuration: 30 },
  { name: "Spinning", type: "cardio", calPerMinute: 11, defaultDuration: 45 },
  { name: "Boxe/Muay Thai", type: "cardio", calPerMinute: 12, defaultDuration: 60 },
];

export function calcCalories(
  template: ExerciseTemplate | undefined,
  sets: number,
  reps: number,
  duration: number
): number {
  if (!template) return 0;

  if (template.type === "academia" && template.calPerSet) {
    const setsUsed = sets || template.defaultSets || 3;
    const repsUsed = reps || template.defaultReps || 10;
    const repFactor = repsUsed / (template.defaultReps || 10);
    return Math.round(template.calPerSet * setsUsed * repFactor);
  }

  if (template.type === "cardio" && template.calPerMinute) {
    const durationUsed = duration || template.defaultDuration || 30;
    return Math.round(template.calPerMinute * durationUsed);
  }

  return 0;
}
