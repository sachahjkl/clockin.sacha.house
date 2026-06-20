import { Component, inject } from "@angular/core";
import { CanActivateFn, Router, RouterLink, Routes } from "@angular/router";
import { AccountService } from "./core/account.service";
import {
    resolveHomeData,
    resolveHistoryPointages,
    resolveProfile,
} from "./core/resolver";
import { I18nService } from "./core/i18n.service";
import type { SeoRouteData } from "./core/seo.service";

const PRIVATE_PAGE_ROBOTS: SeoRouteData["robots"] = "noindex,nofollow";

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
        data: {
            hideNav: true,
            fullscreen: true,
            seo: {
                titleKey: "seo.connect.title",
                descriptionKey: "seo.connect.description",
                robots: "index,follow",
            } satisfies SeoRouteData,
        },
    },
    {
        path: "clockin",
        loadComponent: () => import("./pages/home/home.component").then((m) => m.HomeComponent),
        canActivate: [requireAccount],
        resolve: { homeData: resolveHomeData },
        runGuardsAndResolvers: "paramsOrQueryParamsChange",
        data: {
            seo: {
                titleKey: "seo.clockin.title",
                descriptionKey: "seo.clockin.description",
                robots: PRIVATE_PAGE_ROBOTS,
            } satisfies SeoRouteData,
        },
    },
    {
        path: "history",
        loadComponent: () =>
            import("./pages/history/history.component").then((m) => m.HistoryComponent),
        canActivate: [requireAccount],
        resolve: { pointages: resolveHistoryPointages },
        data: {
            seo: {
                titleKey: "seo.history.title",
                descriptionKey: "seo.history.description",
                robots: PRIVATE_PAGE_ROBOTS,
            } satisfies SeoRouteData,
        },
    },
    {
        path: "account",
        loadComponent: () =>
            import("./pages/account/account.component").then((m) => m.AccountComponent),
        canActivate: [requireAccount],
        resolve: { profile: resolveProfile },
        data: {
            seo: {
                titleKey: "seo.account.title",
                descriptionKey: "seo.account.description",
                robots: PRIVATE_PAGE_ROBOTS,
            } satisfies SeoRouteData,
        },
    },
    {
        path: "legal",
        loadComponent: () =>
            import("./pages/legal/legal-pages.component").then((m) => m.LegalPageComponent),
        data: {
            seo: {
                titleKey: "seo.legal.title",
                descriptionKey: "seo.legal.description",
                robots: "index,follow",
            } satisfies SeoRouteData,
        },
    },
    {
        path: "privacy",
        loadComponent: () =>
            import("./pages/legal/legal-pages.component").then((m) => m.PrivacyPageComponent),
        data: {
            seo: {
                titleKey: "seo.privacy.title",
                descriptionKey: "seo.privacy.description",
                robots: "index,follow",
            } satisfies SeoRouteData,
        },
    },
    {
        path: "cookies",
        loadComponent: () =>
            import("./pages/legal/legal-pages.component").then((m) => m.CookiesPageComponent),
        data: {
            seo: {
                titleKey: "seo.cookies.title",
                descriptionKey: "seo.cookies.description",
                robots: "index,follow",
            } satisfies SeoRouteData,
        },
    },
    {
        path: "about",
        loadComponent: () =>
            import("./pages/legal/legal-pages.component").then((m) => m.AboutPageComponent),
        data: {
            seo: {
                titleKey: "seo.about.title",
                descriptionKey: "seo.about.description",
                robots: "index,follow",
            } satisfies SeoRouteData,
        },
    },
    {
        path: "**",
        component: NotFoundComponent,
        data: {
            seo: {
                titleKey: "seo.notFound.title",
                descriptionKey: "seo.notFound.description",
                robots: "noindex,nofollow",
            } satisfies SeoRouteData,
        },
    },
];
