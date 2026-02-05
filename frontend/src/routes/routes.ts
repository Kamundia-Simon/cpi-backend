export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  PM_DETAIL: (pmId: string | number) => `/pm/${pmId}`,
  SURVEY_DETAIL: (surveyName: string) => `/survey/${surveyName}`,
} as const;
