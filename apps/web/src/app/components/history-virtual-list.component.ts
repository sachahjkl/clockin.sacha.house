import { DatePipe } from "@angular/common";
import { CdkVirtualScrollViewport, ScrollingModule } from "@angular/cdk/scrolling";
import { AfterViewInit, Component, computed, inject, input, output, signal, viewChild } from "@angular/core";
import { debounceTime, filter, map } from "rxjs";
import { I18nService } from "../core/i18n.service";
import type { Badgeage } from "../core/models";

interface HistoryPageRequest {
    offset: number;
    limit: number;
}

const PAGE_SIZE = 500;

@Component({
    selector: "app-history-virtual-list",
    standalone: true,
    imports: [DatePipe, ScrollingModule, CdkVirtualScrollViewport],
    template: `
        <div class="overflow-hidden rounded-xl bg-white shadow">
            <div class="overflow-x-auto">
                <div class="min-w-[52rem]">
                    <div
                        class="grid grid-cols-[minmax(160px,1.6fr)_repeat(4,minmax(110px,1fr))_140px] bg-slate-100 text-left text-sm text-slate-600"
                    >
                        <div class="whitespace-nowrap px-4 py-3 font-semibold">{{ i18n.t("table.day") }}</div>
                        <div class="whitespace-nowrap px-4 py-3 font-semibold">
                            {{ i18n.t("table.firstEntry") }}
                        </div>
                        <div class="whitespace-nowrap px-4 py-3 font-semibold">
                            {{ i18n.t("table.firstExit") }}
                        </div>
                        <div class="whitespace-nowrap px-4 py-3 font-semibold">
                            {{ i18n.t("table.secondEntry") }}
                        </div>
                        <div class="whitespace-nowrap px-4 py-3 font-semibold">
                            {{ i18n.t("table.secondExit") }}
                        </div>
                        <div class="whitespace-nowrap px-4 py-3 font-semibold"></div>
                    </div>

                    @if (total()) {
                        <cdk-virtual-scroll-viewport
                            #viewport
                            class="h-[70vh] max-h-[42rem] min-h-[24rem]"
                            [itemSize]="50"
                        >
                            <div
                                *cdkVirtualFor="let badgeage of badgeages(); trackBy: trackByIndex"
                                class="grid grid-cols-[minmax(160px,1.6fr)_repeat(4,minmax(110px,1fr))_140px] border-t border-slate-100 text-left text-sm"
                            >
                                @if (badgeage) {
                                <div
                                    class="whitespace-nowrap px-4 py-3 font-semibold text-slate-800"
                                    [title]="badgeage.day"
                                >
                                    {{
                                        badgeage.day
                                            | date: "mediumDate" : undefined : i18n.dateLocale()
                                    }}
                                </div>
                                <div
                                    class="whitespace-nowrap px-4 py-3 text-slate-600"
                                    [title]="badgeage.firstEntry ?? undefined"
                                >
                                    {{
                                        badgeage.firstEntry
                                            | date: "HH:mm:ss" : undefined : i18n.dateLocale()
                                    }}
                                </div>
                                <div
                                    class="whitespace-nowrap px-4 py-3 text-slate-600"
                                    [title]="badgeage.firstExit ?? undefined"
                                >
                                    {{
                                        badgeage.firstExit
                                            | date: "HH:mm:ss" : undefined : i18n.dateLocale()
                                    }}
                                </div>
                                <div
                                    class="whitespace-nowrap px-4 py-3 text-slate-600"
                                    [title]="badgeage.secondEntry ?? undefined"
                                >
                                    {{
                                        badgeage.secondEntry
                                            | date: "HH:mm:ss" : undefined : i18n.dateLocale()
                                    }}
                                </div>
                                <div
                                    class="whitespace-nowrap px-4 py-3 text-slate-600"
                                    [title]="badgeage.secondExit ?? undefined"
                                >
                                    {{
                                        badgeage.secondExit
                                            | date: "HH:mm:ss" : undefined : i18n.dateLocale()
                                    }}
                                </div>
                                <div class="whitespace-nowrap px-4 py-3">
                                    <button
                                        class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-400 to-rose-500 px-4 py-1 text-center text-xs font-semibold text-white shadow-sm transition hover:from-rose-500 hover:to-rose-600 hover:outline hover:outline-black/20 active:scale-[0.98]"
                                        (click)="deleteBadgeage.emit(badgeage.id)"
                                    >
                                        {{ i18n.t("history.delete") }}
                                    </button>
                                </div>
                                } @else {
                                <div class="px-4 py-3 text-slate-300">...</div>
                                <div class="px-4 py-3 text-slate-300">...</div>
                                <div class="px-4 py-3 text-slate-300">...</div>
                                <div class="px-4 py-3 text-slate-300">...</div>
                                <div class="px-4 py-3 text-slate-300">...</div>
                                <div class="px-4 py-3 text-slate-300">...</div>
                                }
                            </div>
                        </cdk-virtual-scroll-viewport>
                    } @else {
                        <div class="px-4 py-8 text-center text-sm text-slate-400">
                            {{ i18n.t("app.noData") }}
                        </div>
                    }

                    @if (total()) {
                        <div class="border-t border-slate-100 px-4 py-2 text-right text-xs text-slate-500">
                            {{ positionLabel() }}
                        </div>
                    }
                </div>
            </div>
        </div>
    `,
})
export class HistoryVirtualListComponent implements AfterViewInit {
    protected readonly i18n = inject(I18nService);
    private readonly viewport = viewChild.required(CdkVirtualScrollViewport);
    readonly badgeages = input.required<Array<Badgeage | null>>();
    readonly total = input.required<number>();
    readonly deleteBadgeage = output<number>();
    readonly loadPage = output<HistoryPageRequest>();
    private readonly currentIndex = signal(1);
    readonly positionLabel = computed(() => `${this.currentIndex()}/${this.total()}`);

    ngAfterViewInit(): void {
        this.requestPage({ offset: 0, limit: PAGE_SIZE });
        this.updateCurrentIndex();
        this.viewport()
            .elementScrolled()
            .pipe(
                debounceTime(120),
                map(() => this.viewport().getRenderedRange()),
                filter((range) => range.end > range.start),
            )
            .subscribe((range) => {
                this.currentIndex.set(Math.min(this.total(), range.start + 1));
                const firstPage = Math.max(0, Math.floor(range.start / PAGE_SIZE) - 1);
                const lastPage = Math.floor(Math.max(0, range.end - 1) / PAGE_SIZE) + 1;

                for (let page = firstPage; page <= lastPage; page++) {
                    this.requestPage({ offset: page * PAGE_SIZE, limit: PAGE_SIZE });
                }
            });
    }

    trackByIndex = (index: number): number => index;

    private requestPage(request: HistoryPageRequest): void {
        this.loadPage.emit(request);
    }

    private updateCurrentIndex(): void {
        if (!this.total()) {
            this.currentIndex.set(0);
            return;
        }

        this.currentIndex.set(1);
    }
}
