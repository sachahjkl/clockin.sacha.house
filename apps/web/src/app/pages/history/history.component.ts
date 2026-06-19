import { Component, computed, inject, input, linkedSignal, signal } from "@angular/core";
import { finalize } from "rxjs";
import { PointagesClient } from "../../core/pointages.client";
import { HistoryVirtualListComponent } from "../../components/history-virtual-list.component";
import { I18nService, type TranslationKey } from "../../core/i18n.service";
import type { HistoryPageData, Pointage } from "../../core/models";

interface HistoryPageRequest {
    offset: number;
    limit: number;
}

const HISTORY_PAGE_SIZE = 500;

@Component({
    selector: "app-history",
    standalone: true,
    imports: [HistoryVirtualListComponent],
    template: `
        <article class="mx-auto w-full space-y-4">
            <h1 class="text-2xl font-bold">{{ i18n.t("app.history") }}</h1>

            <section class="rounded-xl bg-slate-50 p-4 shadow-sm ring-1 ring-black/5">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div class="space-y-1">
                        <p class="text-sm font-semibold text-slate-800">
                            {{ i18n.t("history.exportTitle") }}
                        </p>
                        <p class="text-sm text-slate-500">{{ i18n.t("history.exportHelp") }}</p>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-3 lg:min-w-[42rem]">
                        <label class="block text-sm font-medium text-slate-700">
                            {{ i18n.t("history.period") }}
                            <select
                                class="mt-1 block w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
                                [value]="exportPreset()"
                                (change)="onPresetChange($any($event.target).value)"
                            >
                                @for (preset of exportPresets; track preset.id) {
                                    <option [value]="preset.id">
                                        {{ i18n.t(preset.labelKey) }}
                                    </option>
                                }
                            </select>
                        </label>

                        <label class="block text-sm font-medium text-slate-700">
                            {{ i18n.t("history.from") }}
                            <input
                                type="date"
                                class="mt-1 block w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
                                [value]="exportRange().from"
                                (input)="onFromChange($any($event.target).value)"
                            />
                        </label>

                        <label class="block text-sm font-medium text-slate-700">
                            {{ i18n.t("history.to") }}
                            <input
                                type="date"
                                class="mt-1 block w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
                                [value]="exportRange().to"
                                (input)="onToChange($any($event.target).value)"
                            />
                        </label>
                    </div>
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-6 gap-y-4">
                    <section class="flex flex-wrap gap-4">
                        <button
                            type="button"
                            class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-emerald-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            [disabled]="exportPending() || exportRangeInvalid()"
                            (click)="exportCsv()"
                        >
                            {{ i18n.t("history.exportCsv") }}
                        </button>
                        <button
                            type="button"
                            class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:from-blue-500 hover:to-blue-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            [disabled]="exportPending() || exportRangeInvalid()"
                            (click)="exportXlsx()"
                        >
                            {{ i18n.t("history.exportXlsx") }}
                        </button>
                    </section>
                    <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            class="h-5 w-5 cursor-pointer rounded border-slate-400 accent-sky-600"
                            [checked]="exportIso()"
                            (change)="exportIso.set(($any($event.target).checked))"
                        />
                        {{ i18n.t("history.exportIso") }}
                    </label>

                    @if (exportPending()) {
                        <span class="text-sm text-slate-500">{{
                            i18n.t("history.exportPending")
                        }}</span>
                    }
                </div>

                @if (exportRangeInvalid()) {
                    <p class="mt-3 text-sm text-rose-600">{{ i18n.t("history.invalidRange") }}</p>
                }

                @if (exportError()) {
                    <p class="mt-3 text-sm text-rose-600">{{ exportError() }}</p>
                }
            </section>

            @if (error()) {
                <div
                    class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm"
                >
                    {{ error() }}
                </div>
            }

            <app-history-virtual-list
                [pointages]="pointages()"
                [total]="total()"
                (deletePointage)="remove($event)"
                (loadPage)="loadPage($event)"
            />
        </article>
    `,
})
export class HistoryComponent {
    private readonly pointagesClient = inject(PointagesClient);
    protected readonly i18n = inject(I18nService);
    protected readonly resolvedPointages = input.required<HistoryPageData>({ alias: "pointages" });

    readonly total = linkedSignal(() => this.resolvedPointages().total);
    readonly pointages = linkedSignal(() => toSparsePointages(this.resolvedPointages()));
    readonly error = signal<string | null>(null);
    readonly exportPresets = EXPORT_PRESETS;
    readonly exportPreset = signal<ExportPresetId>("lastMonth");
    readonly exportRange = signal(getRangeForPreset("lastMonth"));
    readonly exportPending = signal(false);
    readonly exportError = signal<string | null>(null);
    readonly exportIso = signal(false);
    readonly exportRangeInvalid = computed(() => this.exportRange().from > this.exportRange().to);
    private readonly loadedPages = new Set<string>([pageKey(0, HISTORY_PAGE_SIZE)]);
    private readonly pendingPages = new Set<string>();

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

    exportCsv(): void {
        this.downloadExport("csv");
    }

    exportXlsx(): void {
        this.downloadExport("xlsx");
    }

    remove(id: number): void {
        this.error.set(null);
        this.pointagesClient.delete(id).subscribe({
            next: () => {
                const index = this.pointages().findIndex((item) => item?.id === id);
                if (index === -1) {
                    return;
                }

                this.pointages.update((items) => {
                    const copy = [...items];
                    copy.splice(index, 1);
                    return copy;
                });
                this.total.update((value) => Math.max(0, value - 1));

                const affectedOffset = Math.floor(index / HISTORY_PAGE_SIZE) * HISTORY_PAGE_SIZE;
                invalidatePagesFrom(this.loadedPages, affectedOffset);
                invalidatePagesFrom(this.pendingPages, affectedOffset);
                this.loadPage({ offset: affectedOffset, limit: HISTORY_PAGE_SIZE });
            },
            error: (error: unknown) => {
                this.error.set(errorMessage(error, this.i18n));
            },
        });
    }

    loadPage(request: HistoryPageRequest): void {
        const offset = Math.max(0, Math.floor(request.offset / HISTORY_PAGE_SIZE) * HISTORY_PAGE_SIZE);
        const limit = HISTORY_PAGE_SIZE;
        const key = pageKey(offset, limit);
        if (this.loadedPages.has(key) || this.pendingPages.has(key) || pageLoaded(this.pointages(), offset, limit)) {
            return;
        }

        this.pendingPages.add(key);
        this.pointagesClient.loadHistoryPage(offset, limit).subscribe({
            next: (page) => {
                this.pendingPages.delete(key);
                this.loadedPages.add(key);
                this.total.set(page.total);
                this.pointages.update((items) => mergePage(items, page));
            },
            error: (error: unknown) => {
                this.pendingPages.delete(key);
                this.error.set(errorMessage(error, this.i18n));
            },
        });
    }

    private downloadExport(format: "csv" | "xlsx"): void {
        if (this.exportRangeInvalid()) return;

        this.exportPending.set(true);
        this.exportError.set(null);

        const range = this.exportRange();
        this.pointagesClient
            .export(range.from, range.to, format, this.exportIso())
            .pipe(finalize(() => this.exportPending.set(false)))
            .subscribe({
                next: (blob) => {
                    downloadBlob(blob, `clockin-${range.from}_to_${range.to}.${format}`);
                },
                error: (error: unknown) => {
                    this.exportError.set(errorMessage(error, this.i18n));
                },
            });
    }
}

type ExportPresetId = "lastWeek" | "lastMonth" | "last6Months" | "lastYear" | "all" | "custom";

const EXPORT_PRESETS: Array<{ id: ExportPresetId; labelKey: TranslationKey }> = [
    { id: "lastWeek", labelKey: "preset.lastWeek" },
    { id: "lastMonth", labelKey: "preset.lastMonth" },
    { id: "last6Months", labelKey: "preset.last6Months" },
    { id: "lastYear", labelKey: "preset.lastYear" },
    { id: "all", labelKey: "preset.all" },
    { id: "custom", labelKey: "preset.custom" },
];

function getRangeForPreset(preset: Exclude<ExportPresetId, "custom">): {
    from: string;
    to: string;
} {
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

function errorMessage(error: unknown, i18n: I18nService): string {
    return error instanceof Error ? error.message : i18n.t("errors.requestFailed");
}

function toSparsePointages(page: HistoryPageData): Array<Pointage | null> {
    const items = Array.from<Pointage | null>({ length: page.total }).fill(null);
    for (let index = 0; index < page.rows.length; index++) {
        items[page.offset + index] = page.rows[index] ?? null;
    }
    return items;
}

function mergePage(items: Array<Pointage | null>, page: HistoryPageData): Array<Pointage | null> {
    const next = ensureLength(items, page.total);
    for (let index = 0; index < page.rows.length; index++) {
        next[page.offset + index] = page.rows[index] ?? null;
    }
    return next;
}

function ensureLength(items: Array<Pointage | null>, total: number): Array<Pointage | null> {
    if (items.length === total) {
        return [...items];
    }

    const next = Array.from<Pointage | null>({ length: total }).fill(null);
    for (let index = 0; index < Math.min(items.length, total); index++) {
        next[index] = items[index] ?? null;
    }
    return next;
}

function pageLoaded(items: Array<Pointage | null>, offset: number, limit: number): boolean {
    const end = Math.min(items.length, offset + limit);
    if (offset >= end) {
        return true;
    }

    for (let index = offset; index < end; index++) {
        if (items[index] === null) {
            return false;
        }
    }

    return true;
}

function pageKey(offset: number, limit: number): string {
    return `${offset}:${limit}`;
}

function invalidatePagesFrom(pages: Set<string>, offset: number): void {
    for (const key of pages) {
        const [pageOffset] = key.split(":");
        if (Number(pageOffset) >= offset) {
            pages.delete(key);
        }
    }
}
