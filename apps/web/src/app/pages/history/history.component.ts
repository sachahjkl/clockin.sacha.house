import { Component, OnInit, computed, effect, inject, signal } from "@angular/core";
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

			<section class="rounded-xl bg-slate-50 p-4 shadow-sm ring-1 ring-black/5">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div class="space-y-1">
						<p class="text-sm font-semibold text-slate-800">Exporter les badgeages</p>
						<p class="text-sm text-slate-500">Choisis une période, puis exporte en CSV ou XLSX.</p>
					</div>

					<div class="grid gap-3 sm:grid-cols-3 lg:min-w-[42rem]">
						<label class="block text-sm font-medium text-slate-700">
							Période
							<select
								class="mt-1 block w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
								[value]="exportPreset()"
								(change)="onPresetChange($any($event.target).value)"
							>
								@for (preset of exportPresets; track preset.id) {
									<option [value]="preset.id">{{ preset.label }}</option>
								}
							</select>
						</label>

						<label class="block text-sm font-medium text-slate-700">
							Du
							<input
								type="date"
								class="mt-1 block w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
								[value]="exportRange().from"
								(input)="onFromChange($any($event.target).value)"
							/>
						</label>

						<label class="block text-sm font-medium text-slate-700">
							Au
							<input
								type="date"
								class="mt-1 block w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
								[value]="exportRange().to"
								(input)="onToChange($any($event.target).value)"
							/>
						</label>
					</div>
				</div>

				<div class="mt-4 flex flex-wrap items-center gap-2">
					<button
						type="button"
						class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition-all hover:from-emerald-500 hover:to-emerald-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
						[disabled]="exportPending() || exportRangeInvalid()"
						(click)="exportCsv()"
					>
						Export CSV
					</button>
					<button
						type="button"
						class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition-all hover:from-blue-500 hover:to-blue-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
						[disabled]="exportPending() || exportRangeInvalid()"
						(click)="exportXlsx()"
					>
						Export XLSX
					</button>

					@if (exportPending()) {
						<span class="text-sm text-slate-500">Export en cours…</span>
					}
				</div>

				@if (exportRangeInvalid()) {
					<p class="mt-3 text-sm text-rose-600">La date de début doit être antérieure ou égale à la date de fin.</p>
				}

				@if (exportError()) {
					<p class="mt-3 text-sm text-rose-600">{{ exportError() }}</p>
				}
			</section>

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
	readonly exportPresets = EXPORT_PRESETS;
	readonly exportPreset = signal<ExportPresetId>("lastMonth");
	readonly exportRange = signal(getRangeForPreset("lastMonth"));
	readonly exportPending = signal(false);
	readonly exportError = signal<string | null>(null);
	readonly exportRangeInvalid = computed(() => this.exportRange().from > this.exportRange().to);

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

	onPresetChange(value: ExportPresetId): void {
		this.exportPreset.set(value);
		this.exportError.set(null);
		if (value !== "custom") {
			this.exportRange.set(getRangeForPreset(value));
		}
	}

	onFromChange(value: string): void {
		this.exportPreset.set("custom");
		this.exportError.set(null);
		this.exportRange.update((range) => ({ ...range, from: value }));
	}

	onToChange(value: string): void {
		this.exportPreset.set("custom");
		this.exportError.set(null);
		this.exportRange.update((range) => ({ ...range, to: value }));
	}

	async exportCsv(): Promise<void> {
		await this.downloadExport("csv");
	}

	async exportXlsx(): Promise<void> {
		await this.downloadExport("xlsx");
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

	private async downloadExport(format: "csv" | "xlsx"): Promise<void> {
		if (this.exportRangeInvalid()) return;

		this.exportPending.set(true);
		this.exportError.set(null);

		try {
			const range = this.exportRange();
			const blob = await this.api.getBlob(`/badgeages/export?from=${range.from}&to=${range.to}&format=${format}`);
			downloadBlob(blob, `clockin-${range.from}_to_${range.to}.${format}`);
		} catch (e) {
			this.exportError.set(e instanceof Error ? e.message : "Export impossible");
		} finally {
			this.exportPending.set(false);
		}
	}
}

type ExportPresetId = "lastWeek" | "lastMonth" | "last6Months" | "lastYear" | "all" | "custom";

const EXPORT_PRESETS: Array<{ id: ExportPresetId; label: string }> = [
	{ id: "lastWeek", label: "7 derniers jours" },
	{ id: "lastMonth", label: "Dernier mois" },
	{ id: "last6Months", label: "6 derniers mois" },
	{ id: "lastYear", label: "Dernière année" },
	{ id: "all", label: "Tout" },
	{ id: "custom", label: "Personnalisé" },
];

function getRangeForPreset(preset: Exclude<ExportPresetId, "custom">): { from: string; to: string } {
	const to = toLocalIsoDate(new Date());
	const fromDate = new Date();

	switch (preset) {
		case "lastWeek":
			fromDate.setDate(fromDate.getDate() - 6);
			break;
		case "lastMonth":
			fromDate.setMonth(fromDate.getMonth() - 1);
			break;
		case "last6Months":
			fromDate.setMonth(fromDate.getMonth() - 6);
			break;
		case "lastYear":
			fromDate.setFullYear(fromDate.getFullYear() - 1);
			break;
		case "all":
			return { from: "1970-01-01", to };
	}

	return { from: toLocalIsoDate(fromDate), to };
}

function toLocalIsoDate(date: Date): string {
	const year = String(date.getFullYear());
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function downloadBlob(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}
