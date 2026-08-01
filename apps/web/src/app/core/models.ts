export interface User {
    userId: string;
    name: string | null;
    email: string | null;
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

export interface HistoryMonthlyStats {
    month: string;
    totalSeconds: number;
}

export interface HistoryStats {
    week: HistoryPeriodStats;
    month: HistoryPeriodStats;
    year: HistoryPeriodStats;
    monthly: HistoryMonthlyStats[];
}

export type Slot = "firstEntry" | "firstExit" | "secondEntry" | "secondExit";