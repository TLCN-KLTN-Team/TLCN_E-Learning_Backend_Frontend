// Backend API Types
export const PeriodType = {
  WEEK: "WEEK",
  MONTH: "MONTH",
  YEAR: "YEAR",
  CUSTOM: "CUSTOM",
} as const;

export type PeriodType = (typeof PeriodType)[keyof typeof PeriodType];

export const EducationType = {
  UNIVERSITY: "UNIVERSITY",
  COLLEGE: "COLLEGE",
  INTERMEDIATE: "INTERMEDIATE",
  ALL: "ALL",
} as const;

export type EducationType = (typeof EducationType)[keyof typeof EducationType];

export interface DashboardFilterRequest {
  period?: PeriodType;
  educationType?: EducationType;
  from?: string; // ISO date format
  to?: string; // ISO date format
}

export interface MetricData {
  currentValue: number;
  previousValue: number;
  growthRate: number;
}

export interface UserStatistics {
  totalUsers: number;
  studentCount: number;
  teacherCount: number;
  growthRate: number;
}

export interface OrganizationStatistics {
  totalOrganizations: number;
  activeOrganizations: number;
  inactiveOrganizations: number;
  growthRate: number;
}

export interface DashboardResponse {
  userStatistics: UserStatistics;
  organizationStatistics: OrganizationStatistics;
  activeCourses: MetricData;
  completionRate: MetricData;
  weeklyTraffic: MetricData;
  pendingViolations: MetricData;
  period: string;
  educationType: string;
  fromDate: string;
  toDate: string;
}

// Dashboard Statistics Types (for UI compatibility)
export interface DashboardStats {
  totalUsers: UserStats;
  trainingUnits: TrainingUnitStats;
  activeCourses: number;
  avgCompletionRate: number;
  weeklyVisits: number;
  pendingViolations: number;
}

export interface UserStats {
  total: number;
  students: number;
  teachers: number;
  learners: number;
}

export interface TrainingUnitStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface TimeSeriesData {
  date: string;
  users: number;
  courses: number;
  visits: number;
}

export type TimeFilter = "today" | "week" | "month" | "quarter" | "year";
export type TrainingUnitType = "all" | "university" | "enterprise" | "center";

export interface DashboardFilters {
  timeFilter: TimeFilter;
  trainingUnitType: TrainingUnitType;
}

export interface UserDistributionResponse {
  totalUsers: number;
  adminUsers: number;
  instructorUsers: number;
  studentUsers: number;
}
