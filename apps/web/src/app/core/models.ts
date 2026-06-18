export interface User {
    userId: string;
    name: string | null;
    email: string | null;
    createdAt: string;
}

export interface Badgeage {
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
    badgeages: Badgeage[];
}

export interface HistoryPageData {
    rows: Badgeage[];
    total: number;
    offset: number;
    limit: number;
}

export type Slot = "firstEntry" | "firstExit" | "secondEntry" | "secondExit";
