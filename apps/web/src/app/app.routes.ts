import { inject } from "@angular/core";
import { CanActivateFn, Router, Routes } from "@angular/router";
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
    { path: "**", redirectTo: "" },
];