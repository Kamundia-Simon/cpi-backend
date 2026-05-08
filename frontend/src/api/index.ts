const API_BASE = "http://localhost:8000";
//import { useAuth } from "@clerk/clerk-react";

let _token: string | null = null;
export const setApiToken = (token: string | null) => {
  _token = token;
};
const authHeaders = (): HeadersInit =>
  _token ? { Authorization: `Bearer ${_token}` } : {};

// API functions
export const getSurveys = async (monthStart?: string, monthEnd?: string) => {
  const params = new URLSearchParams();
  if (monthStart) params.set("month_start", monthStart);
  if (monthEnd) params.set("month_end", monthEnd);
  const qs = params.toString();
  const response = await fetch(`${API_BASE}/api/surveys${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch survey list");
  return response.json();
};

// Fetch points for a specific survey
export const getSurveyPoints = async (name: string) => {
  const response = await fetch(`${API_BASE}/api/surveys/${name}/points`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch data for this survey");
  return response.json();
};

// Fetch points for a specific survey with pagination
export const getPMs = async () => {
  const response = await fetch(`${API_BASE}/api/pms`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch PMs");
  return response.json();
};

// Fetch points for a specific survey with pagination
export const getPMSurveys = async (
  pmId: number,
  monthStart?: string,
  monthEnd?: string,
) => {
  const params = new URLSearchParams();
  if (monthStart) params.set("month_start", monthStart);
  if (monthEnd) params.set("month_end", monthEnd);
  const qs = params.toString();
  const response = await fetch(
    `${API_BASE}/api/pms/${pmId}/surveys${qs ? `?${qs}` : ""}`,
    {
      headers: authHeaders(),
    },
  );
  if (!response.ok) throw new Error("Failed to fetch PM surveys");
  return response.json();
};

// Fetch points for a specific survey with pagination
export const getPMSummary = async (pmId: number) => {
  const response = await fetch(`${API_BASE}/api/pms/${pmId}/summary`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch PM summary");
  return response.json();
};

// Fetch dashboard summary
export const getDashboardSummary = async () => {
  const response = await fetch(`${API_BASE}/api/dashboard/summary`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard summary");
  return response.json();
};

// Fetch supplier spend data, optionally filtered by PM
export const getSupplierSpend = async (pmId?: number) => {
  const url = pmId
    ? `${API_BASE}/api/analytics/supplier-spend?pm_id=${pmId}`
    : `${API_BASE}/api/analytics/supplier-spend`;
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error("Failed to fetch supplier spend data");
  return response.json();
};

// Reconcile a survey - unsuable = 2
export const reconcileSurvey = async (
  surveyName: string,
  pids: string[],
  token: string,
) => {
  const response = await fetch(
    `${API_BASE}/api/surveys/${encodeURIComponent(surveyName)}/reconcile`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pids }),
    },
  );
  if (!response.ok) throw new Error("Reconciliation failed");
  return response.json();
};

export const syncSurveyMeta = async () =>
  fetch(`${API_BASE}/api/meta/sync`, {
    method: "POST",
    headers: authHeaders(),
  }).then((r) => r.json());
