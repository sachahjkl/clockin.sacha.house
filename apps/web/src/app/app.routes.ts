import { Component, inject } from "@angular/core";
import { CanActivateFn, Router, RouterLink, Routes } from "@angular/router";
import { AccountService } from "./core/account.service";
import { HomeComponent } from "./pages/home/home.component";
import { HistoryComponent } from "./pages/history/history.component";
import { AccountComponent } from "./pages/account/account.component";
import { ConnectComponent } from "./pages/connect/connect.component";
import {
    AboutPageComponent,
    CookiesPageComponent,
    LegalPageComponent,
    PrivacyPageComponent,
} from "./pages/legal/legal-pages.component";
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
    { path: "connect", component: ConnectComponent, canActivate: [redirectIfAccount] },
    { path: "clockin", component: HomeComponent, canActivate: [requireAccount] },
    { path: "history", component: HistoryComponent, canActivate: [requireAccount] },
    { path: "account", component: AccountComponent, canActivate: [requireAccount] },
    { path: "legal", component: LegalPageComponent },
    { path: "privacy", component: PrivacyPageComponent },
    { path: "cookies", component: CookiesPageComponent },
    { path: "about", component: AboutPageComponent },
    { path: "**", component: NotFoundComponent },
];