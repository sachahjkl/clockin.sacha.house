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

export type HistoryChartUnit = "day" | "week" | "month" | "year";
export type HistoryChartWindow = "week" | "month" | "year" | "fiveYears" | "tenYears";

export interface HistoryChartPoint {
    from: string;
    range: HistoryChartUnit;
    dayCount: number;
    totalSeconds: number;
    targetSeconds: number;
    hot: boolean;
}

export interface HistoryChart {
    unit: HistoryChartUnit;
    window: HistoryChartWindow;
    anchor: string;
    from: string;
    dayCount: number;
    previousAnchor: string;
    nextAnchor: string | null;
    points: HistoryChartPoint[];
}

export interface HistoryChartRequest {
    unit: HistoryChartUnit;
    window: HistoryChartWindow;
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
