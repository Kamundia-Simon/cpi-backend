const API_BASE = "http://localhost:8000";

// API functions
export const getSurveys = async () => {
  const response = await fetch(`${API_BASE}/api/surveys`);
  if (!response.ok) throw new Error("Failed to fetch survey list");
  return response.json();
};

// Fetch points for a specific survey
export const getSurveyPoints = async (name: string) => {
  const response = await fetch(`${API_BASE}/api/surveys/${name}/points`);
  if (!response.ok) throw new Error("Failed to fetch data for this survey");
  return response.json();
};

// Fetch points for a specific survey with pagination
export const getPMs = async () => {
  const response = await fetch(`${API_BASE}/api/pms`);
  if (!response.ok) throw new Error("Failed to fetch PMs");
  return response.json();
};

// Fetch points for a specific survey with pagination
export const getPMSurveys = async (pmId: number) => {
  const response = await fetch(`${API_BASE}/api/pms/${pmId}/surveys`);
  if (!response.ok) throw new Error("Failed to fetch PM surveys");
  return response.json();
};

// Fetch points for a specific survey with pagination
export const getPMSummary = async (pmId: number) => {
  const response = await fetch(`${API_BASE}/api/pms/${pmId}/summary`);
  if (!response.ok) throw new Error("Failed to fetch PM summary");
  return response.json();
};

// Fetch dashboard summary
export const getDashboardSummary = async () => {
  const response = await fetch(`${API_BASE}/api/dashboard/summary`);
  if (!response.ok) throw new Error("Failed to fetch dashboard summary");
  return response.json();
};

// Fetch supplier spend data, optionally filtered by PM
export const getSupplierSpend = async (pmId?: number) => {
  const url = pmId
    ? `${API_BASE}/api/analytics/supplier-spend?pm_id=${pmId}`
    : `${API_BASE}/api/analytics/supplier-spend`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch supplier spend data");
  return response.json();
};
