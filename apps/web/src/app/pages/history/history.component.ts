import { Component, computed, inject, input, linkedSignal, signal } from "@angular/core";
import { finalize } from "rxjs";
import {
    HistoryExportPanelComponent,
    type HistoryExportPresetOption,
} from "../../components/history-export-panel.component";
import { PointagesClient } from "../../core/pointages.client";
import { HistoryVirtualListComponent } from "../../components/history-virtual-list.component";
import { HistoryStatsComponent } from "../../components/history-stats.component";
import { I18nService, type TranslationKey } from "../../core/i18n.service";
import { ToastService } from "../../core/toast.service";
import type { HistoryPageData, HistoryStats, Pointage } from "../../core/models";

interface HistoryPageRequest {
    offset: number;
    limit: number;
}

const HISTORY_PAGE_SIZE = 500;

@Component({
    selector: "app-history",
    standalone: true,
    imports: [HistoryExportPanelComponent, HistoryVirtualListComponent, HistoryStatsComponent],
    template: `
        <article class="mx-auto my-3 w-full space-y-6">
            <div class="space-y-2">
                <h1 class="text-2xl font-bold">{{ i18n.t("app.history") }}</h1>
            </div>

            <app-history-export-panel
                [presets]="exportPresets"
                [preset]="exportPreset()"
                [range]="exportRange()"
                [pending]="exportPending()"
                [invalid]="exportRangeInvalid()"
                [iso]="exportIso()"
                [error]="exportError()"
                (presetChange)="onPresetChange($event)"
                (fromChange)="onFromChange($event)"
                (toChange)="onToChange($event)"
                (isoChange)="exportIso.set($event)"
                (exportCsv)="exportCsv()"
                (exportXlsx)="exportXlsx()"
            />

            <app-history-virtual-list
                [pointages]="pointages()"
                [total]="total()"
                [targetIndex]="targetHistoryIndex()"
                (deletePointage)="remove($event)"
                (goToDate)="goToDate($event)"
                (loadPage)="loadPage($event)"
            />

            <app-history-stats [stats]="stats()" [error]="statsError()" />
        </article>
    `,
})
export class HistoryComponent {
    private readonly pointagesClient = inject(PointagesClient);
    private readonly toastService = inject(ToastService);
    protected readonly i18n = inject(I18nService);
    protected readonly resolvedPointages = input.required<HistoryPageData>({ alias: "pointages" });

    readonly total = linkedSignal(() => this.resolvedPointages().total);
    readonly pointages = linkedSignal(() => toSparsePointages(this.resolvedPointages()));
    readonly exportPresets: HistoryExportPresetOption[] = EXPORT_PRESETS;
    readonly exportPreset = signal<ExportPresetId>("lastMonth");
    readonly exportRange = signal(getRangeForPreset("lastMonth"));
    readonly exportPending = signal(false);
    readonly exportError = signal<string | null>(null);
    readonly exportIso = signal(false);
    readonly targetHistoryIndex = signal<number | null>(null);
    readonly stats = signal<HistoryStats | null>(null);
    readonly statsError = signal<string | null>(null);
    readonly exportRangeInvalid = computed(() => this.exportRange().from > this.exportRange().to);
    private readonly loadedPages = new Set<string>([pageKey(0, HISTORY_PAGE_SIZE)]);
    private readonly pendingPages = new Set<string>();

    constructor() {
        this.loadStats();
    }

    onPresetChange(value: string): void {
        if (!isExportPresetId(value)) {
            return;
        }

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
                this.loadStats();
            },
            error: (error: unknown) => {
                this.toastService.error(errorMessage(error, this.i18n));
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
                    this.toastService.error(errorMessage(error, this.i18n));
                },
        });
    }

    goToDate(day: string): void {
        this.pointagesClient.locateHistoryIndex(day).subscribe({
            next: ({ index }) => {
                const offset = Math.floor(index / HISTORY_PAGE_SIZE) * HISTORY_PAGE_SIZE;
                this.targetHistoryIndex.set(null);
                this.loadPage({ offset, limit: HISTORY_PAGE_SIZE });
                queueMicrotask(() => this.targetHistoryIndex.set(index));
            },
            error: (error: unknown) => {
                this.toastService.error(errorMessage(error, this.i18n));
            },
        });
    }

    private loadStats(): void {
        this.statsError.set(null);
        this.pointagesClient.loadHistoryStats().subscribe({
            next: (stats) => {
                this.stats.set(stats);
            },
            error: (error: unknown) => {
                this.statsError.set(errorMessage(error, this.i18n));
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

function isExportPresetId(value: string): value is ExportPresetId {
    return EXPORT_PRESETS.some((preset) => preset.id === value);
}

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
