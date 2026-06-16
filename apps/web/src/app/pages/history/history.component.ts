import { Component, OnInit, effect, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { ApiService } from "../../core/api.service";
import { AccountService } from "../../core/account.service";
import type { Badgeage } from "../../core/models";

@Component({
    selector: "app-history",
    standalone: true,
    imports: [DatePipe],
    template: `
        <article class="mx-auto w-full min-w-[300px] space-y-4">
            <h1 class="text-2xl font-bold">Historique</h1>

            @if (error()) {
                <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm">{{ error() }}</div>
            }

            <div class="overflow-hidden rounded-xl bg-white shadow">
                <div class="overflow-x-auto">
                    <table class="w-full border-separate border-spacing-0 text-left text-sm">
                        <thead class="bg-slate-100 text-slate-600">
                        <tr>
                            <th class="px-4 py-3 font-semibold">Jour</th>
                            <th class="px-4 py-3 font-semibold">Entrée 1</th>
                            <th class="px-4 py-3 font-semibold">Sortie 1</th>
                            <th class="px-4 py-3 font-semibold">Entrée 2</th>
                            <th class="px-4 py-3 font-semibold">Sortie 2</th>
                            <th class="px-4 py-3 font-semibold"></th>
                        </tr>
                        </thead>
                        <tbody class="bg-white">
                        @for (b of badgeages(); track b.id) {
                            <tr class="border-t border-slate-100">
                                <td class="px-4 py-3 font-semibold text-slate-800">
                                    {{ b.day | date: "mediumDate" }}
                                </td>
                                <td class="px-4 py-3 text-slate-600">{{ b.firstEntry | date: "HH:mm:ss" }}</td>
                                <td class="px-4 py-3 text-slate-600">{{ b.firstExit | date: "HH:mm:ss" }}</td>
                                <td class="px-4 py-3 text-slate-600">{{ b.secondEntry | date: "HH:mm:ss" }}</td>
                                <td class="px-4 py-3 text-slate-600">{{ b.secondExit | date: "HH:mm:ss" }}</td>
                                <td class="px-4 py-3">
                                    <button
                                        class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-400 to-rose-500 px-4 py-1 text-center text-xs font-semibold text-white shadow-sm transition-all hover:from-rose-500 hover:to-rose-600 hover:outline hover:outline-black/20 active:scale-[0.98]"
                                        (click)="remove(b.id)"
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        } @empty {
                            <tr>
                                <td colspan="6" class="px-4 py-8 text-center text-slate-400">
                                    Aucun badgeage
                                </td>
                            </tr>
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        </article>
    `,
})
export class HistoryComponent implements OnInit {
    private api = inject(ApiService);
	private account = inject(AccountService);
	private router = inject(Router);

    readonly badgeages = signal<Badgeage[]>([]);
    readonly error = signal<string | null>(null);

	constructor() {
		effect(() => {
			if (!this.account.userId()) {
				void this.router.navigate(["/account"]);
			}
		});
	}

    ngOnInit(): void {
		if (this.account.userId()) {
			this.load().catch((e) => this.error.set(e.message));
		}
	}

    async load(): Promise<void> {
        const data = await this.api.get<Badgeage[]>("/badgeages?from=1970-01-01&to=2099-12-31");
        this.badgeages.set(data);
    }

    async remove(id: number): Promise<void> {
        this.error.set(null);
        try {
            await this.api.delete(`/badgeages/${id}`);
            await this.load();
        } catch (e) {
            this.error.set(e instanceof Error ? e.message : "Erreur");
        }
    }
}