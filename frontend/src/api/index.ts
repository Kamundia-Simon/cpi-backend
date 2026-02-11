const API_BASE = "http://localhost:8000";

export const getSurveys = async () => {
  const response = await fetch(`${API_BASE}/api/surveys`);
  if (!response.ok) throw new Error("Failed to fetch survey list");
  return response.json();
};

export const getSurveyPoints = async (name: string) => {
  const response = await fetch(`${API_BASE}/api/surveys/${name}/points`);
  if (!response.ok) throw new Error("Failed to fetch data for this survey");
  return response.json();
};

export const getPMs = async () => {
  const response = await fetch(`${API_BASE}/api/pms`);
  if (!response.ok) throw new Error("Failed to fetch PMs");
  return response.json();
};

export const getPMSurveys = async (pmId: number) => {
  const response = await fetch(`${API_BASE}/api/pms/${pmId}/surveys`);
  if (!response.ok) throw new Error("Failed to fetch PM surveys");
  return response.json();
};

export const getPMSummary = async (pmId: number) => {
  const response = await fetch(`${API_BASE}/api/pms/${pmId}/summary`);
  if (!response.ok) throw new Error("Failed to fetch PM summary");
  return response.json();
};

export const getDashboardSummary = async () => {
  const response = await fetch(`${API_BASE}/api/dashboard/summary`);
  if (!response.ok) throw new Error("Failed to fetch dashboard summary");
  return response.json();
};
