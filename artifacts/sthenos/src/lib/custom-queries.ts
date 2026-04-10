import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

const getApiUrl = () => {
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  return url ? `${url}/functions/v1/api` : "";
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage;
    try {
      const errData = await response.json();
      errMessage = errData.error || errData.message;
    } catch {
      errMessage = response.statusText;
    }
    throw new Error(errMessage || `API Error: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

// REPORT HISTORY
export const getGetDailyReportHistoryQueryKey = (params: { days: number }) => ["daily-reports-history", params.days];
export const useGetDailyReportHistory = (params: { days: number }, _options?: any) => {
  return useQuery({
    queryKey: getGetDailyReportHistoryQueryKey(params),
    queryFn: () => fetchWithAuth(`/daily-reports/history?days=${params.days}`),
  });
};

// WEIGHT CHECKS
export const getListWeightChecksQueryKey = () => ["weight-checks"];
export const useListWeightChecks = (_options?: any) => {
  return useQuery({
    queryKey: getListWeightChecksQueryKey(),
    queryFn: () => fetchWithAuth(`/weight-checks`),
  });
};
export const useCreateWeightCheck = () => {
  return useMutation({
    mutationFn: (data: any) => fetchWithAuth(`/weight-checks`, { method: "POST", body: JSON.stringify(data.data) }),
  });
};
export const getGetPendingWeightCheckQueryKey = () => ["weight-checks", "pending"];
export const useGetPendingWeightCheck = (_options?: any) => {
  return useQuery({
    queryKey: getGetPendingWeightCheckQueryKey(),
    queryFn: () => fetchWithAuth(`/weight-checks/pending`), // Mock endpoint or correct logic
  });
};

// PROFILE
export const getGetProfileQueryKey = () => ["profile"];
export const useGetProfile = (_options?: any) => {
  return useQuery({
    queryKey: getGetProfileQueryKey(),
    queryFn: () => fetchWithAuth(`/profile`),
  });
};
export const useCreateProfile = () => {
  return useMutation({
    mutationFn: (data: any) => fetchWithAuth(`/profile`, { method: "POST", body: JSON.stringify(data.data) }),
  });
};
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (data: any) => fetchWithAuth(`/profile`, { method: "PATCH", body: JSON.stringify(data.data) }),
  });
};

// DASHBOARD
export const getGetDailyReportQueryKey = (params?: { date?: string }) => ["daily-reports", params?.date];
export const useGetDailyReport = (params?: { date?: string }, _options?: any) => {
  return useQuery({
    queryKey: getGetDailyReportQueryKey(params),
    queryFn: () => fetchWithAuth(`/daily-reports${params?.date ? `?date=${params.date}` : ''}`),
  });
};
export const getGetAiDailySummaryQueryKey = (params?: { date?: string }) => ["ai-daily-summary", params?.date];
export const useGetAiDailySummary = (params?: { date?: string }, _options?: any) => {
  return useQuery({
    queryKey: getGetAiDailySummaryQueryKey(params),
    queryFn: () => fetchWithAuth(`/ai/daily-summary${params?.date ? `?date=${params.date}` : ''}`),
  });
};

// DIET
export const getGetAiDietPlanQueryKey = () => ["ai-diet-plan"];
export const useGetAiDietPlan = (_options?: any) => {
  return useQuery({
    queryKey: getGetAiDietPlanQueryKey(),
    queryFn: () => fetchWithAuth(`/ai/diet-plan`),
  });
};

// EXERCISES
export const getListExercisesQueryKey = (params?: { date?: string }) => ["exercises", params?.date];
export const useListExercises = (params?: { date?: string }, _options?: any) => {
  return useQuery({
    queryKey: getListExercisesQueryKey(params),
    queryFn: () => fetchWithAuth(`/exercises${params?.date ? `?date=${params.date}` : ''}`),
  });
};
export const useCreateExercise = () => {
  return useMutation({
    mutationFn: (data: any) => fetchWithAuth(`/exercises`, { method: "POST", body: JSON.stringify(data.data) }),
  });
};
export const useUpdateExercise = () => {
  return useMutation({
    mutationFn: (data: any) => fetchWithAuth(`/exercises/${data.id}`, { method: "PATCH", body: JSON.stringify(data.data) }),
  });
};
export const useDeleteExercise = () => {
  return useMutation({
    mutationFn: (data: { id: number }) => fetchWithAuth(`/exercises/${data.id}`, { method: "DELETE" }),
  });
};

// MEALS
export const getListMealsQueryKey = (params?: { date?: string }) => ["meals", params?.date];
export const useListMeals = (params?: { date?: string }, _options?: any) => {
  return useQuery({
    queryKey: getListMealsQueryKey(params),
    queryFn: () => fetchWithAuth(`/meals${params?.date ? `?date=${params.date}` : ''}`),
  });
};
export const useCreateMeal = () => {
  return useMutation({
    mutationFn: (data: any) => fetchWithAuth(`/meals`, { method: "POST", body: JSON.stringify(data.data) }),
  });
};
export const useUpdateMeal = () => {
  return useMutation({
    mutationFn: (data: any) => fetchWithAuth(`/meals/${data.id}`, { method: "PATCH", body: JSON.stringify(data.data) }),
  });
};
export const useDeleteMeal = () => {
  return useMutation({
    mutationFn: (data: { id: number }) => fetchWithAuth(`/meals/${data.id}`, { method: "DELETE" }),
  });
};
export const useAnalyzeFoodImage = () => {
  return useMutation({
    mutationFn: (data: any) => fetchWithAuth(`/ai/analyze-food`, { method: "POST", body: JSON.stringify(data.data) }),
  });
};
