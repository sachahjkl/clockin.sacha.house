import { inject } from "@angular/core";
import type { ResolveFn } from "@angular/router";
import { BadgeagesClient } from "./badgeages.client";
import { ClockinPageClient } from "./clockin-page.client";
import type { HistoryPageData, HomeData, User } from "./models";
import { ProfileClient } from "./profile.client";

export const resolveProfile: ResolveFn<User> = () => {
    return inject(ProfileClient).load();
};

export const resolveHomeData: ResolveFn<HomeData> = () => {
    return inject(ClockinPageClient).load();
};

export const resolveHistoryBadgeages: ResolveFn<HistoryPageData> = () => {
    return inject(BadgeagesClient).loadHistoryPage();
};
