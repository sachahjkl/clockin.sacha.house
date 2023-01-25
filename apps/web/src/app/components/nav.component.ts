import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { AccountService } from "../core/account.service";

@Component({
    selector: "app-nav",
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    template: `
        <header class="sticky top-0 z-20 mb-4 border-b border-black/5 bg-white/85 backdrop-blur">
            <div class="page-shell py-4">
                <div class="flex flex-col gap-4 rounded-b-3xl bg-white px-4 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.5)] sm:flex-row sm:items-center sm:justify-between">
                    <a routerLink="/" class="flex items-center justify-center gap-2 text-xl sm:justify-start">
                        <span class="text-2xl">⌛</span>
                        <span class="bg-gradient-to-tr from-sky-400 to-sky-600 bg-clip-text font-extrabold text-transparent">Clock-in</span>
                    </a>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        @if (account.userId()) {
                            <div class="hidden rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-500 lg:block">
                                ID {{ account.userId() }}
                            </div>
                            <div class="flex flex-col gap-2 sm:flex-row">
                                <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-pill">🏠 Accueil</a>
                                <a routerLink="/history" routerLinkActive="active" class="nav-pill">⌛ Historique</a>
                                <button (click)="logout()" class="nav-pill from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600">
                                    Déconnexion
                                </button>
                            </div>
                        } @else {
                            <a routerLink="/account" routerLinkActive="active" class="nav-pill">Compte</a>
                        }
                    </div>
                </div>
            </div>
        </header>
    `,
})
export class NavComponent {
	constructor(protected account: AccountService) {}

    logout(): void {
        this.account.clear();
    }
}
