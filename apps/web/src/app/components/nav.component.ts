import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AccountService } from "../core/account.service";

@Component({
    selector: "app-nav",
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    template: `
        <header class="sticky top-0 z-20 mb-4 bg-white shadow">
            <div class="mx-auto w-full max-w-5xl px-4 py-4">
                <div class="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
                    <a routerLink="/" class="flex items-center gap-2 text-xl">
                        <span class="text-2xl">⌛</span>
                        <span class="inline-block w-[9ch] bg-gradient-to-tr from-blue-400 to-blue-600 bg-clip-text font-extrabold text-transparent underline decoration-blue-200 underline-offset-4 transition-all hover:from-green-400 hover:to-green-500">Clock-in</span>
                    </a>
                    <div class="flex w-full items-center justify-end gap-2 sm:w-auto sm:flex-none">
                        @if (account.userId()) {
                            <nav class="flex items-center gap-2">
                                <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="block rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition-all hover:from-blue-500 hover:to-blue-600 hover:outline hover:outline-black/20 active:scale-[0.98]" [class.from-blue-500]="homeActive.isActive" [class.to-blue-600]="homeActive.isActive" #homeActive="routerLinkActive">🏠 Accueil</a>
                                <a routerLink="/history" routerLinkActive="active" class="block rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition-all hover:from-blue-500 hover:to-blue-600 hover:outline hover:outline-black/20 active:scale-[0.98]" [class.from-blue-500]="historyActive.isActive" [class.to-blue-600]="historyActive.isActive" #historyActive="routerLinkActive">⌛ Historique</a>
                            </nav>
                            <button
                                type="button"
                                (click)="logout()"
                                class="block cursor-pointer rounded-lg bg-gradient-to-r from-red-400 to-red-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition-all hover:from-red-500 hover:to-red-600 hover:outline hover:outline-black/20 active:scale-95"
                            >
                                🔓 Déconnexion
                            </button>
                        } @else {
                            <a routerLink="/account" routerLinkActive="active" class="block rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition-all hover:from-blue-500 hover:to-blue-600 hover:outline hover:outline-black/20 active:scale-[0.98]" [class.from-blue-500]="accountActive.isActive" [class.to-blue-600]="accountActive.isActive" #accountActive="routerLinkActive">Compte</a>
                        }
                    </div>
                </div>
            </div>
        </header>
    `,
})
export class NavComponent {
	protected account = inject(AccountService);
	private router = inject(Router);

    async logout(): Promise<void> {
		this.account.clear();
		await this.router.navigate(["/account"]);
	}
}
