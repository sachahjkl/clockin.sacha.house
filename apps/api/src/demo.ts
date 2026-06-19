import type { User } from "./db/schema.js";

export const DEMO_USER_ID = "demo";
const HISTORY_START_DAY = "1970-01-01";

export interface DemoPointage {
    id: number;
    day: string;
    firstEntry: string;
    firstExit: string;
    secondEntry: string;
    secondExit: string;
    userId: number;
}

export interface DemoHistoryPage {
    rows: DemoPointage[];
    total: number;
    offset: number;
    limit: number;
}

export function isDemoUser(user: User): boolean {
    return user.userId === DEMO_USER_ID;
}

export function historyDefaultRange(): { from: string; to: string } {
    return { from: HISTORY_START_DAY, to: toISODate(new Date()) };
}

export function demoHistoryPage(user: User, from: string, to: string, offset: number, limit: number): DemoHistoryPage {
    const total = daySpan(from, to);
    const safeOffset = Math.min(offset, total);
    const safeLimit = Math.min(limit, Math.max(0, total - safeOffset));
    const rows: DemoPointage[] = [];

    for (let index = 0; index < safeLimit; index++) {
        rows.push(demoPointage(user.id, addDays(from, safeOffset + index), safeOffset + index));
    }

    return { rows, total, offset: safeOffset, limit };
}

export function demoPointagesInRange(user: User, from: string, to: string): DemoPointage[] {
    const total = daySpan(from, to);
    const rows: DemoPointage[] = [];

    for (let index = 0; index < total; index++) {
        rows.push(demoPointage(user.id, addDays(from, index), index));
    }

    return rows;
}

function demoPointage(userId: number, day: string, index: number): DemoPointage {
    const variant = index % 3;
    const startHour = 8 + (index % 2);
    const secondEntryMinute = variant === 0 ? 15 : 30;

    return {
        id: index + 1,
        day,
        firstEntry: atTime(day, startHour, 30),
        firstExit: atTime(day, 12, variant === 1 ? 15 : 0),
        secondEntry: atTime(day, 13, secondEntryMinute),
        secondExit: atTime(day, 17 + (variant === 2 ? 1 : 0), 30),
        userId,
    };
}

function atTime(day: string, hours: number, minutes: number): string {
    const date = new Date(`${day}T00:00:00.000Z`);
    date.setUTCHours(hours, minutes, 0, 0);
    return date.toISOString();
}

function daySpan(from: string, to: string): number {
    const start = new Date(`${from}T00:00:00.000Z`).getTime();
    const end = new Date(`${to}T00:00:00.000Z`).getTime();
    return Math.max(0, Math.floor((end - start) / 86400000) + 1);
}

function addDays(day: string, delta: number): string {
    const date = new Date(`${day}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + delta);
    return toISODate(date);
}

function toISODate(date: Date): string {
    return date.toISOString().split("T")[0];
}
