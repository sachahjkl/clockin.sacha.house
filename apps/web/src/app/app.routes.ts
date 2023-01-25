import { inject } from "@angular/core";
import { CanActivateFn, Router, Routes } from "@angular/router";
import { AccountService } from "./core/account.service";
import { HomeComponent } from "./pages/home/home.component";
import { HistoryComponent } from "./pages/history/history.component";
import { AccountComponent } from "./pages/account/account.component";

const requireAccount: CanActivateFn = () => {
	const account = inject(AccountService);
	const router = inject(Router);

	return account.userId() ? true : router.createUrlTree(["/account"]);
};

export const routes: Routes = [
	{ path: "", component: HomeComponent, canActivate: [requireAccount] },
	{ path: "history", component: HistoryComponent, canActivate: [requireAccount] },
	{ path: "account", component: AccountComponent },
	{ path: "**", redirectTo: "" },
];
