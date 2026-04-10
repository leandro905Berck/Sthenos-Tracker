# Sthenos - Fitness Tracking App

## Overview

Sthenos is a comprehensive fitness tracking app in Brazilian Portuguese. It tracks gym exercises, cardio, calorie expenditure, food intake, and provides AI-powered food photo analysis and personalized diet plans.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/sthenos)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (lib/integrations-openai-ai-server)
- **Charts**: Recharts
- **Routing**: Wouter

## Features

1. **Dashboard (Hoje)** - Daily calorie overview: burned vs consumed, net balance
2. **Exercícios** - Exercise log: gym and cardio, calories burned
3. **Alimentação** - Meal log: breakfast/lunch/dinner/snacks, AI food photo analysis
4. **Relatórios** - Reports: bar charts (7/30 days), weight progression, meal breakdown
5. **Perfil** - User profile: BMI, TDEE calculation, weekly weight check
6. **Dieta** - AI-personalized diet plan based on BMI and goals

## Database Tables

- `profiles` - User profile data with BMI/BMR/TDEE calculations
- `exercises` - Exercise entries with calories burned
- `meals` - Meal entries by category (café, almoço, janta, lanche)
- `weight_checks` - Weekly weight check-ins

## AI Features

- Food photo analysis (GPT-4 Vision) - identifies food, estimates calories
- Daily AI summary with insights and recommendations
- Personalized diet plan generation based on BMI and user goals

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI proxy URL (auto-set by Replit AI integration)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key (auto-set by Replit AI integration)
- `SESSION_SECRET` - Session secret

## Onboarding Flow

When no profile exists (first visit), a full-screen onboarding form is shown to capture:
name, age, gender, weight, height, goal, activity level.

## Weekly Weight Check

If 7+ days since last weight check, a modal prompts the user to log their current weight.
