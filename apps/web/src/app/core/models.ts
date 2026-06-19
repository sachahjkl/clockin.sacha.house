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
    profile: User;
    pointages: Pointage[];
}

export interface HistoryPageData {
    rows: Pointage[];
    total: number;
    offset: number;
    limit: number;
}

export type Slot = "firstEntry" | "firstExit" | "secondEntry" | "secondExit";
