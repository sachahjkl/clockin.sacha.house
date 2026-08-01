import type { Pointage, Slot } from "./models";

const slots: Slot[] = ["firstEntry", "firstExit", "secondEntry", "secondExit"];
export const DEFAULT_WEEKLY_TARGET_MINUTES = 40 * 60;
export const DEFAULT_WORK_DAYS_PER_WEEK = 5;
export const TARGET_WARNING_SECONDS = 15 * 60;

export function computePointageTotalSeconds(pointage: Pointage): number {
    let totalSeconds = 0;
    for (let index = 0; index < slots.length; index += 2) {
        const start = pointage[slots[index]];
        const end = pointage[slots[index + 1]];
        if (start && end) {
            totalSeconds += Math.max(
                0,
                Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000),
            );
        }
    }
    return totalSeconds;
}

export function dailyTargetSeconds(weeklyTargetMinutes: number, workDaysPerWeek: number): number {
    // A weekly target is easier for users to reason about; dividing by their
    // configured work days gives the absolute target used by every day bar.
    return Math.round((weeklyTargetMinutes * 60) / workDaysPerWeek);
}

export function isNearTarget(totalSeconds: number, targetSeconds: number): boolean {
    return targetSeconds > 0 && totalSeconds > 0 && totalSeconds >= targetSeconds - TARGET_WARNING_SECONDS;
}

export function heatColorHsl(totalSeconds: number, targetSeconds: number, lighter = false): string {
    // HSL fallback for browsers without OKLCH interpolation support.
    const ratio = targetSeconds > 0 ? Math.min(1, totalSeconds / targetSeconds) : 0;
    const hue = Math.round(210 * (1 - ratio));
    return `hsl(${lighter ? Math.min(220, hue + 22) : hue} ${lighter ? 92 : 88}% ${lighter ? 58 : 48}%)`;
}

export function heatColorOklch(totalSeconds: number, targetSeconds: number, lighter = false): string {
    // OKLCH color-mix follows perceptual distance, avoiding the muddy midpoint
    // produced by RGB/HSL. Values above 100% stay at the same hot red endpoint.
    const ratio = targetSeconds > 0 ? Math.min(1, totalSeconds / targetSeconds) : 0;
    const coolWeight = Math.round((1 - ratio) * 1000) / 10;
    const base = `color-mix(in oklch, oklch(68% 0.17 250) ${coolWeight}%, oklch(64% 0.24 28))`;
    return lighter ? `color-mix(in oklch, ${base}, white 18%)` : base;
}
