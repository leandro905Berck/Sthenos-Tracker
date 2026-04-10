-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_checks ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas para Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 3. Criar políticas para Exercises
CREATE POLICY "Users can view own exercises" ON public.exercises
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own exercises" ON public.exercises
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own exercises" ON public.exercises
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own exercises" ON public.exercises
FOR DELETE USING (auth.uid()::text = user_id);

-- 4. Criar políticas para Meals
CREATE POLICY "Users can view own meals" ON public.meals
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
FOR DELETE USING (auth.uid()::text = user_id);

-- 5. Criar políticas para Weight Checks
CREATE POLICY "Users can view own weight checks" ON public.weight_checks
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own weight checks" ON public.weight_checks
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own weight checks" ON public.weight_checks
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own weight checks" ON public.weight_checks
FOR DELETE USING (auth.uid()::text = user_id);
