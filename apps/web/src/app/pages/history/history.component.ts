import { Component, OnInit, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { ApiService } from "../../core/api.service";
import type { Badgeage } from "../../core/models";

@Component({
    selector: "app-history",
    standalone: true,
    imports: [DatePipe],
    template: `
        <div class="space-y-4">
            <h1 class="text-2xl font-bold">Historique</h1>

            @if (error()) {
                <div class="rounded bg-red-100 px-4 py-2 text-red-800">{{ error() }}</div>
            }

            <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-4 py-2">Jour</th>
                            <th class="px-4 py-2">Entrée 1</th>
                            <th class="px-4 py-2">Sortie 1</th>
                            <th class="px-4 py-2">Entrée 2</th>
                            <th class="px-4 py-2">Sortie 2</th>
                            <th class="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (b of badgeages(); track b.id) {
                            <tr class="border-t border-gray-100">
                                <td class="px-4 py-2 font-medium">
                                    {{ b.day | date: "mediumDate" }}
                                </td>
                                <td class="px-4 py-2">{{ b.firstEntry | date: "HH:mm:ss" }}</td>
                                <td class="px-4 py-2">{{ b.firstExit | date: "HH:mm:ss" }}</td>
                                <td class="px-4 py-2">{{ b.secondEntry | date: "HH:mm:ss" }}</td>
                                <td class="px-4 py-2">{{ b.secondExit | date: "HH:mm:ss" }}</td>
                                <td class="px-4 py-2">
                                    <button
                                        class="btn btn-danger py-1 text-xs"
                                        (click)="remove(b.id)"
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        } @empty {
                            <tr>
                                <td colspan="6" class="px-4 py-6 text-center text-gray-500">
                                    Aucun badgeage
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `,
})
export class HistoryComponent implements OnInit {
    private api = inject(ApiService);

    readonly badgeages = signal<Badgeage[]>([]);
    readonly error = signal<string | null>(null);

    ngOnInit(): void {
		this.load().catch((e) => this.error.set(e.message));
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
