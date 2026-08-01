export interface User {
    userId: string;
    name: string | null;
    email: string | null;
    weeklyTargetMinutes: number;
    workDaysPerWeek: number;
    createdAt: string;
}

export interface Pointage {
    id: number;
    day: string;
    firstEntry: string | null;
    firstExit: string | null;
    secondEntry: string | null;
    secondExit: string | null;
    userId: number;
}

export interface HomeData {
    from: string;
    to: string;
    profile: User;
    pointages: Pointage[];
}

export interface HistoryPageData {
    rows: Pointage[];
    total: number;
    offset: number;
    limit: number;
}

export interface HistoryIndexLookup {
    index: number;
    day: string | null;
    exact: boolean;
}

export interface HistoryPeriodStats {
    totalSeconds: number;
    averageWorkedDaySeconds: number;
    workedDays: number;
}

export type HistoryChartPeriod = "week" | "month" | "year";

export interface HistoryChartPoint {
    key: string;
    totalSeconds: number;
    targetSeconds: number;
    hot: boolean;
}

export interface HistoryChart {
    period: HistoryChartPeriod;
    anchor: string;
    from: string;
    to: string;
    previousAnchor: string;
    nextAnchor: string | null;
    points: HistoryChartPoint[];
}

export interface HistoryChartRequest {
    period: HistoryChartPeriod;
    anchor?: string;
}

export interface HistoryStats {
    week: HistoryPeriodStats;
    month: HistoryPeriodStats;
    year: HistoryPeriodStats;
    dailyTargetSeconds: number;
    chart: HistoryChart;
}

export type Slot = "firstEntry" | "firstExit" | "secondEntry" | "secondExit";
