import { inject } from "@angular/core";
import type { ActivatedRouteSnapshot, ResolveFn } from "@angular/router";
import { ClockinPageClient } from "./clockin-page.client";
import type { HistoryPageData, HomeData, User } from "./models";
import { PointagesClient } from "./pointages.client";
import { ProfileClient } from "./profile.client";

export const resolveProfile: ResolveFn<User> = () => {
    return inject(ProfileClient).load();
};

export const resolveHomeData: ResolveFn<HomeData> = (route: ActivatedRouteSnapshot) => {
    const weekOffset = Number(route.queryParamMap.get("weekOffset") ?? "0");
    const { from, to } = weekRange(Number.isFinite(weekOffset) ? weekOffset : 0);
    return inject(ClockinPageClient).load(from, to);
};

export const resolveHistoryPointages: ResolveFn<HistoryPageData> = () => {
    return inject(PointagesClient).loadHistoryPage();
};

function weekRange(weekOffset: number): { from: string; to: string } {
    const start = startOfWorkWeek();
    start.setDate(start.getDate() + weekOffset * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
        from: toISODate(start),
        to: toISODate(end),
    };
}

function startOfWorkWeek(): Date {
    const start = new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return start;
}

function toISODate(date: Date): string {
    return date.toISOString().split("T")[0];
}
