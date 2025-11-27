// Dashboard Statistics Types
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
