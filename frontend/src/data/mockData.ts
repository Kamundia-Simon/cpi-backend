/**
 * Consolidated Mock Data
 * This file contains all hardcoded placeholder data
 * Replace with backend API calls when ready
 */

import type { PMId } from "../types";

// PM Data
export const pmNames: Record<PMId, string> = {
  1: "Shah",
  2: "Fatima",
  3: "Rose",
};

export const PMs = [
  { id: 1 as PMId, name: "Shah" },
  { id: 2 as PMId, name: "Fatima" },
  { id: 3 as PMId, name: "Rose" },
];

// PM Summary Statistics
export const pmSummary: Record<
  PMId,
  { totalAmount: string; avgPerProject: string; totalProjects: string }
> = {
  1: { totalAmount: "£25.05", avgPerProject: "£8.35", totalProjects: "3" },
  2: { totalAmount: "£61.30", avgPerProject: "£15.33", totalProjects: "4" },
  3: { totalAmount: "£45.75", avgPerProject: "£15.25", totalProjects: "3" },
};

// PM Statistics for Dashboard
export const pmStats: Record<
  PMId,
  { totalProjects: string; totalAmount: string }
> = {
  1: { totalProjects: "3", totalAmount: "£25.05" },
  2: { totalProjects: "4", totalAmount: "£61.30" },
  3: { totalProjects: "3", totalAmount: "£45.80" },
};

// Survey Data
export const allSurveys = [
  {
    surveyName: "RDR000001",
    pm: "Shah",
    totalPaid: "£10.35",
    totalCompletes: 4,
    startDate: "15 Jan 2024 09:00",
  },
  {
    surveyName: "RDR000002",
    pm: "Shah",
    totalPaid: "£9.10",
    totalCompletes: 3,
    startDate: "10 Feb 2024 09:00",
  },
  {
    surveyName: "RDR000003",
    pm: "Shah",
    totalPaid: "£5.60",
    totalCompletes: 3,
    startDate: "05 Mar 2024 08:00",
  },
  {
    surveyName: "RDR000004",
    pm: "Fatima",
    totalPaid: "£20.10",
    totalCompletes: 5,
    startDate: "22 Jan 2024 11:00",
  },
  {
    surveyName: "RDR000005",
    pm: "Fatima",
    totalPaid: "£6.65",
    totalCompletes: 3,
    startDate: "28 Feb 2024 09:00",
  },
  {
    surveyName: "RDR000006",
    pm: "Fatima",
    totalPaid: "£14.30",
    totalCompletes: 4,
    startDate: "10 Apr 2024 08:00",
  },
  {
    surveyName: "RDR000007",
    pm: "Rose",
    totalPaid: "£8.45",
    totalCompletes: 3,
    startDate: "14 Feb 2024 10:00",
  },
  {
    surveyName: "RDR000008",
    pm: "Rose",
    totalPaid: "£27.65",
    totalCompletes: 6,
    startDate: "20 Mar 2024 08:00",
  },
  {
    surveyName: "RDR000009",
    pm: "Rose",
    totalPaid: "£9.65",
    totalCompletes: 3,
    startDate: "25 Apr 2024 09:00",
  },
  {
    surveyName: "RDR000010",
    pm: "Fatima",
    totalPaid: "£20.25",
    totalCompletes: 4,
    startDate: "01 May 2024 08:00",
  },
];

// PM Projects (Surveys per PM)
export const pmProjects: Record<
  PMId,
  {
    surveyName: string;
    totalPaid: string;
    totalCompletes: number;
    startDate: string;
  }[]
> = {
  1: [
    {
      surveyName: "RDR000001",
      totalPaid: "£10.35",
      totalCompletes: 4,
      startDate: "15 Jan 2024 09:00",
    },
    {
      surveyName: "RDR000002",
      totalPaid: "£9.10",
      totalCompletes: 3,
      startDate: "10 Feb 2024 09:00",
    },
    {
      surveyName: "RDR000003",
      totalPaid: "£5.60",
      totalCompletes: 3,
      startDate: "05 Mar 2024 08:00",
    },
  ],
  2: [
    {
      surveyName: "RDR000004",
      totalPaid: "£20.10",
      totalCompletes: 5,
      startDate: "22 Jan 2024 11:00",
    },
    {
      surveyName: "RDR000005",
      totalPaid: "£6.65",
      totalCompletes: 3,
      startDate: "28 Feb 2024 09:00",
    },
    {
      surveyName: "RDR000006",
      totalPaid: "£14.30",
      totalCompletes: 4,
      startDate: "10 Apr 2024 08:00",
    },
    {
      surveyName: "RDR000010",
      totalPaid: "£20.25",
      totalCompletes: 4,
      startDate: "01 May 2024 08:00",
    },
  ],
  3: [
    {
      surveyName: "RDR000007",
      totalPaid: "£8.45",
      totalCompletes: 3,
      startDate: "14 Feb 2024 10:00",
    },
    {
      surveyName: "RDR000008",
      totalPaid: "£27.65",
      totalCompletes: 6,
      startDate: "20 Mar 2024 08:00",
    },
    {
      surveyName: "RDR000009",
      totalPaid: "£9.65",
      totalCompletes: 3,
      startDate: "25 Apr 2024 09:00",
    },
  ],
};

// Survey Point Records
export const surveyPoints: Record<
  string,
  { pid: string; cpi: number; supplier: number; stime: string }[]
> = {
  RDR000001: [
    {
      pid: "akia_7x9k2m",
      cpi: 250,
      supplier: 1,
      stime: "15 Jan 2024 09:00",
    },
    {
      pid: "akia_3p8n1q",
      cpi: 275,
      supplier: 2,
      stime: "15 Jan 2024 10:30",
    },
    {
      pid: "akia_9m2k5r",
      cpi: 250,
      supplier: 1,
      stime: "16 Jan 2024 08:15",
    },
    {
      pid: "akia_1t6w8v",
      cpi: 260,
      supplier: 3,
      stime: "17 Jan 2024 11:00",
    },
  ],
  RDR000002: [
    {
      pid: "akia_4h2j9x",
      cpi: 300,
      supplier: 2,
      stime: "10 Feb 2024 09:00",
    },
    {
      pid: "akia_8c5f3y",
      cpi: 320,
      supplier: 1,
      stime: "11 Feb 2024 14:20",
    },
    {
      pid: "akia_2b7g1z",
      cpi: 290,
      supplier: 3,
      stime: "12 Feb 2024 10:00",
    },
  ],
  RDR000003: [
    {
      pid: "akia_6d4e2a",
      cpi: 180,
      supplier: 4,
      stime: "05 Mar 2024 08:00",
    },
    {
      pid: "akia_0r9s5b",
      cpi: 195,
      supplier: 1,
      stime: "06 Mar 2024 09:30",
    },
    {
      pid: "akia_5u1v8c",
      cpi: 185,
      supplier: 2,
      stime: "07 Mar 2024 11:15",
    },
  ],
  RDR000004: [
    {
      pid: "akia_3w7x2d",
      cpi: 400,
      supplier: 3,
      stime: "22 Jan 2024 11:00",
    },
    {
      pid: "akia_9y4z6e",
      cpi: 425,
      supplier: 2,
      stime: "23 Jan 2024 14:20",
    },
    {
      pid: "akia_1a8b3f",
      cpi: 380,
      supplier: 1,
      stime: "24 Jan 2024 09:45",
    },
    {
      pid: "akia_7c2d9g",
      cpi: 410,
      supplier: 4,
      stime: "25 Jan 2024 16:00",
    },
    {
      pid: "akia_4e6f1h",
      cpi: 395,
      supplier: 3,
      stime: "26 Jan 2024 10:30",
    },
  ],
  RDR000005: [
    {
      pid: "akia_8g3h5i",
      cpi: 220,
      supplier: 1,
      stime: "28 Feb 2024 09:00",
    },
    {
      pid: "akia_2i7j0k",
      cpi: 235,
      supplier: 2,
      stime: "01 Mar 2024 13:00",
    },
    {
      pid: "akia_6k1l4m",
      cpi: 210,
      supplier: 3,
      stime: "02 Mar 2024 15:30",
    },
  ],
  RDR000006: [
    {
      pid: "akia_0m5n8o",
      cpi: 350,
      supplier: 4,
      stime: "10 Apr 2024 08:00",
    },
    {
      pid: "akia_4o9p2q",
      cpi: 365,
      supplier: 1,
      stime: "11 Apr 2024 10:45",
    },
    {
      pid: "akia_8q3r6s",
      cpi: 340,
      supplier: 2,
      stime: "12 Apr 2024 14:00",
    },
    {
      pid: "akia_2s7t0u",
      cpi: 375,
      supplier: 3,
      stime: "13 Apr 2024 09:15",
    },
  ],
  RDR000007: [
    {
      pid: "akia_6u1v4w",
      cpi: 280,
      supplier: 2,
      stime: "14 Feb 2024 10:00",
    },
    {
      pid: "akia_0w5x8y",
      cpi: 295,
      supplier: 3,
      stime: "15 Feb 2024 13:30",
    },
    {
      pid: "akia_4y9z2a",
      cpi: 270,
      supplier: 1,
      stime: "16 Feb 2024 15:00",
    },
  ],
  RDR000008: [
    {
      pid: "akia_8a3b6c",
      cpi: 450,
      supplier: 1,
      stime: "20 Mar 2024 08:00",
    },
    {
      pid: "akia_2c7d0e",
      cpi: 475,
      supplier: 3,
      stime: "21 Mar 2024 09:15",
    },
    {
      pid: "akia_6e1f4g",
      cpi: 460,
      supplier: 2,
      stime: "22 Mar 2024 11:45",
    },
    {
      pid: "akia_0g5h8i",
      cpi: 440,
      supplier: 4,
      stime: "23 Mar 2024 14:00",
    },
    {
      pid: "akia_4i9j2k",
      cpi: 485,
      supplier: 1,
      stime: "24 Mar 2024 10:30",
    },
    {
      pid: "akia_8k3l6m",
      cpi: 455,
      supplier: 3,
      stime: "25 Mar 2024 16:00",
    },
  ],
  RDR000009: [
    {
      pid: "akia_2m7n0o",
      cpi: 320,
      supplier: 2,
      stime: "25 Apr 2024 09:00",
    },
    {
      pid: "akia_6o1p4q",
      cpi: 335,
      supplier: 1,
      stime: "26 Apr 2024 11:30",
    },
    {
      pid: "akia_0q5r8s",
      cpi: 310,
      supplier: 4,
      stime: "27 Apr 2024 14:45",
    },
  ],
  RDR000010: [
    {
      pid: "akia_4s9t2u",
      cpi: 500,
      supplier: 3,
      stime: "01 May 2024 08:00",
    },
    {
      pid: "akia_8u3v6w",
      cpi: 520,
      supplier: 1,
      stime: "02 May 2024 10:00",
    },
    {
      pid: "akia_2w7x0y",
      cpi: 490,
      supplier: 2,
      stime: "03 May 2024 13:15",
    },
    {
      pid: "akia_6y1z4a",
      cpi: 515,
      supplier: 4,
      stime: "04 May 2024 15:30",
    },
  ],
};

// Helper Functions
export const parsePounds = (val: string): number =>
  parseFloat(val.replace("£", ""));
export const parseDate = (val: string): Date => new Date(val);
export const extractMonth = (val: string): string => {
  const dt = new Date(val);
  return dt.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};
