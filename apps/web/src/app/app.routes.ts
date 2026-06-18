import { Component, inject } from "@angular/core";
import { CanActivateFn, Router, RouterLink, Routes } from "@angular/router";
import { AccountService } from "./core/account.service";
import {
    resolveHomeData,
    resolveHistoryBadgeages,
    resolveProfile,
} from "./core/resolver";
import { I18nService } from "./core/i18n.service";

@Component({
    selector: "app-not-found",
    standalone: true,
    imports: [RouterLink],
    template: `
        <article class="mx-auto my-24 max-w-md text-center space-y-6">
            <h1 class="text-6xl font-bold text-slate-300">404</h1>
            <p class="text-lg text-slate-600">{{ i18n.t("app.notFound") }}</p>
            <a routerLink="/" class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700">
                {{ i18n.t("app.backHome") }}
            </a>
        </article>
    `,
})
class NotFoundComponent {
    protected readonly i18n = inject(I18nService);
}

const requireAccount: CanActivateFn = () => {
    const account = inject(AccountService);
    const router = inject(Router);

    return account.userId() ? true : router.createUrlTree(["/connect"]);
};

const redirectIfAccount: CanActivateFn = () => {
    const account = inject(AccountService);
    const router = inject(Router);

    return account.userId() ? router.createUrlTree(["/clockin"]) : true;
};

export const routes: Routes = [
    {
        path: "",
        pathMatch: "full",
        redirectTo: () => (inject(AccountService).userId() ? "/clockin" : "/connect"),
    },
    {
        path: "connect",
        loadComponent: () =>
            import("./pages/connect/connect.component").then((m) => m.ConnectComponent),
        canActivate: [redirectIfAccount],
        data: { hideNav: true, fullscreen: true },
    },
    {
        path: "clockin",
        loadComponent: () => import("./pages/home/home.component").then((m) => m.HomeComponent),
        canActivate: [requireAccount],
        resolve: { homeData: resolveHomeData },
    },
    {
        path: "history",
        loadComponent: () =>
            import("./pages/history/history.component").then((m) => m.HistoryComponent),
        canActivate: [requireAccount],
        resolve: { badgeages: resolveHistoryBadgeages },
    },
    {
        path: "account",
        loadComponent: () =>
            import("./pages/account/account.component").then((m) => m.AccountComponent),
        canActivate: [requireAccount],
        resolve: { profile: resolveProfile },
    },
    {
        path: "legal",
        loadComponent: () =>
            import("./pages/legal/legal-pages.component").then((m) => m.LegalPageComponent),
    },
    {
        path: "privacy",
        loadComponent: () =>
            import("./pages/legal/legal-pages.component").then((m) => m.PrivacyPageComponent),
    },
    {
        path: "cookies",
        loadComponent: () =>
            import("./pages/legal/legal-pages.component").then((m) => m.CookiesPageComponent),
    },
    {
        path: "about",
        loadComponent: () =>
            import("./pages/legal/legal-pages.component").then((m) => m.AboutPageComponent),
    },
    { path: "**", component: NotFoundComponent },
];
