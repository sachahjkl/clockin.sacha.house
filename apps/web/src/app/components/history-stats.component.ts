import { Component, HostListener, inject, input, output, signal } from "@angular/core";
import { I18nService, type TranslationKey } from "../core/i18n.service";
import type {
    HistoryChart,
    HistoryChartPoint,
    HistoryChartRequest,
    HistoryChartUnit,
    HistoryChartWindow,
    HistoryPeriodStats,
    HistoryStats,
} from "../core/models";
import { heatColorHsl, heatColorOklch } from "../core/work-target";

@Component({
    selector: "app-history-stats",
    standalone: true,
    host: { class: "block" },
    styles: `
        .heat-bar {
            background: linear-gradient(to top, var(--heat-hsl), var(--heat-hsl-light));
        }

        @supports (background: linear-gradient(to right in oklch, red, blue)) {
            .heat-bar {
                background: linear-gradient(
                    to top in oklch,
                    var(--heat-oklch),
                    var(--heat-oklch-light)
                );
            }
        }
    `,
    template: `
        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-4 py-4 sm:px-5">
                <h2 class="text-lg font-bold text-slate-900">{{ i18n.t("history.statsTitle") }}</h2>
                <p class="mt-1 text-sm text-slate-500">{{ i18n.t("history.statsHelp") }}</p>
                @if (error()) {
                    <p class="mt-3 text-sm text-rose-600">{{ error() }}</p>
                }
            </div>

            @if (stats(); as currentStats) {
                <div class="overflow-x-auto">
                    <table class="min-w-full border-collapse text-left text-sm">
                        <thead class="bg-slate-100 text-slate-700">
                            <tr>
                                <th class="whitespace-nowrap px-4 py-3 font-semibold">
                                    {{ i18n.t("stats.period") }}
                                </th>
                                <th class="whitespace-nowrap px-4 py-3 font-semibold">
                                    {{ i18n.t("stats.total") }}
                                </th>
                                <th class="whitespace-nowrap px-4 py-3 font-semibold">
                                    {{ i18n.t("stats.averageWorkedDay") }}
                                </th>
                                <th class="whitespace-nowrap px-4 py-3 font-semibold">
                                    {{ i18n.t("stats.workedDays") }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (row of statsRows(currentStats); track row.labelKey) {
                                <tr class="border-t border-slate-200">
                                    <th class="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                                        {{ i18n.t(row.labelKey) }}
                                    </th>
                                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">
                                        {{ formatDuration(row.stats.totalSeconds) }}
                                    </td>
                                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">
                                        {{ formatDuration(row.stats.averageWorkedDaySeconds) }}
                                    </td>
                                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">
                                        {{ row.stats.workedDays }}
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>

                <div class="border-t border-slate-200 px-4 py-5 sm:px-5">
                    <div class="flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <h3 class="font-bold text-slate-900">
                                {{ i18n.t("stats.chartTitle") }}
                            </h3>
                            <p class="mt-1 text-sm text-slate-500">
                                {{ i18n.t("stats.chartHelp") }}
                            </p>
                        </div>
                        <span
                            class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                        >
                            {{ i18n.t("stats.chartPeak") }}
                            {{ formatCompactDuration(maxSeconds(currentStats.chart.points)) }}
                        </span>
                    </div>

                    <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div
                            class="inline-flex self-start rounded-xl bg-slate-100 p-1"
                            [attr.aria-label]="i18n.t('stats.chartPeriod')"
                        >
                            @for (option of chartUnits; track option.unit) {
                                <button
                                    type="button"
                                    class="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:cursor-wait"
                                    [class.bg-white]="currentStats.chart.unit === option.unit"
                                    [class.text-indigo-700]="currentStats.chart.unit === option.unit"
                                    [class.shadow-sm]="currentStats.chart.unit === option.unit"
                                    [class.text-slate-500]="currentStats.chart.unit !== option.unit"
                                    [disabled]="pending()"
                                    [attr.aria-pressed]="currentStats.chart.unit === option.unit"
                                    (click)="selectUnit(option.unit)"
                                >
                                    {{ i18n.t(option.labelKey) }}
                                </button>
                            }
                        </div>

                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                class="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-wait disabled:opacity-40"
                                [disabled]="pending()"
                                [attr.aria-label]="i18n.t('stats.chartPrevious')"
                                (click)="navigate(currentStats.chart, currentStats.chart.previousAnchor)"
                            >
                                <span aria-hidden="true">&larr;</span>
                            </button>
                            <strong class="min-w-36 text-center text-sm text-slate-700">
                                {{ formatChartRange(currentStats.chart) }}
                            </strong>
                            <button
                                type="button"
                                class="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                                [disabled]="pending() || currentStats.chart.nextAnchor === null"
                                [attr.aria-label]="i18n.t('stats.chartNext')"
                                (click)="navigate(currentStats.chart, currentStats.chart.nextAnchor)"
                            >
                                <span aria-hidden="true">&rarr;</span>
                            </button>
                        </div>
                    </div>

                    <div
                        class="mt-5 overflow-x-auto pb-1"
                        role="group"
                        [attr.aria-label]="chartAriaLabel(currentStats.chart)"
                        [class.opacity-60]="pending()"
                    >
                        <div
                            class="flex h-56 min-w-max items-end gap-2 border-b border-slate-200 px-1 sm:gap-3"
                        >
                            @for (
                                item of currentStats.chart.points;
                                track item.from
                            ) {
                                <button
                                    type="button"
                                    class="group relative flex h-full cursor-pointer flex-col justify-end focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                    [class]="barWidth(currentStats.chart.unit)"
                                    [attr.aria-label]="
                                        fullPointDate(item) +
                                        ', ' +
                                        formatDuration(item.totalSeconds)
                                    "
                                    (pointermove)="showPointTooltip($event, item)"
                                    (pointerleave)="hidePointTooltip()"
                                    (click)="pinPointTooltip($event, item)"
                                >
                                    <span
                                        class="mb-2 text-center text-xs font-semibold text-slate-600"
                                    >
                                        @if (item.hot) {
                                            <span
                                                [attr.title]="i18n.t('stats.targetReached')"
                                                aria-hidden="true"
                                                >🔥</span
                                            >
                                        }
                                        {{ formatCompactDuration(item.totalSeconds) }}
                                    </span>
                                    <div
                                        class="flex h-40 items-end rounded-t-lg bg-slate-100 px-1.5 sm:px-2"
                                    >
                                        <div
                                            class="heat-bar w-full min-h-1 rounded-t-md"
                                            [style.height.%]="
                                                barHeight(item.totalSeconds, currentStats.chart.points)
                                            "
                                            [style.--heat-hsl]="
                                                heatColorHsl(item.totalSeconds, item.targetSeconds)
                                            "
                                            [style.--heat-hsl-light]="
                                                heatColorHsl(item.totalSeconds, item.targetSeconds, true)
                                            "
                                            [style.--heat-oklch]="
                                                heatColorOklch(item.totalSeconds, item.targetSeconds)
                                            "
                                            [style.--heat-oklch-light]="
                                                heatColorOklch(item.totalSeconds, item.targetSeconds, true)
                                            "
                                        ></div>
                                    </div>
                                    <span
                                        class="py-2 text-center text-xs font-medium capitalize text-slate-500"
                                    >
                                        {{ formatPointLabel(item.from, item.range) }}
                                    </span>
                                </button>
                            }
                        </div>
                    </div>

                    <div
                        class="mt-3 flex flex-wrap justify-center gap-1"
                        [attr.aria-label]="i18n.t('stats.chartWindow')"
                    >
                        @for (option of windowsFor(currentStats.chart.unit); track option.window) {
                            <button
                                type="button"
                                class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-wait"
                                [class.bg-indigo-50]="currentStats.chart.window === option.window"
                                [class.text-indigo-700]="currentStats.chart.window === option.window"
                                [class.text-slate-500]="currentStats.chart.window !== option.window"
                                [disabled]="pending()"
                                [attr.aria-pressed]="currentStats.chart.window === option.window"
                                (click)="selectWindow(option.window)"
                            >
                                {{ i18n.t(option.labelKey) }}
                            </button>
                        }
                    </div>
                </div>

                @if (pointTooltip(); as tooltip) {
                    <div
                        class="pointer-events-none fixed z-50 w-48 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium text-white shadow-lg"
                        [style.left.px]="tooltip.x"
                        [style.top.px]="tooltip.y"
                    >
                        <span class="block font-bold">{{ fullPointDate(tooltip.point) }}</span>
                        <span class="mt-1 block text-slate-300">
                            {{ formatDuration(tooltip.point.totalSeconds) }} ·
                            {{ i18n.t("stats.chartTarget") }}
                            {{ formatCompactDuration(tooltip.point.targetSeconds) }}
                        </span>
                    </div>
                }
            } @else {
                <div class="px-4 py-8 text-sm text-slate-400 sm:px-5">
                    {{ i18n.t("history.statsLoading") }}
                </div>
            }
        </section>
    `,
})
export class HistoryStatsComponent {
    protected readonly i18n = inject(I18nService);
    stats = input<HistoryStats | null>(null);
    error = input<string | null>(null);
    pending = input(false);
    chartChange = output<HistoryChartRequest>();
    readonly pointTooltip = signal<{
        point: HistoryChartPoint;
        x: number;
        y: number;
        pinned: boolean;
    } | null>(null);
    protected readonly heatColorHsl = heatColorHsl;
    protected readonly heatColorOklch = heatColorOklch;
    readonly chartUnits: Array<{ unit: HistoryChartUnit; labelKey: TranslationKey }> = [
        { unit: "day", labelKey: "stats.chartDay" },
        { unit: "week", labelKey: "stats.chartWeek" },
        { unit: "month", labelKey: "stats.chartMonth" },
        { unit: "year", labelKey: "stats.chartYear" },
    ];
    private readonly chartWindows: Record<
        HistoryChartUnit,
        Array<{ window: HistoryChartWindow; labelKey: TranslationKey }>
    > = {
        day: [
            { window: "week", labelKey: "stats.chartWeek" },
            { window: "month", labelKey: "stats.chartMonth" },
            { window: "year", labelKey: "stats.chartYear" },
        ],
        week: [
            { window: "month", labelKey: "stats.chartMonth" },
            { window: "year", labelKey: "stats.chartYear" },
        ],
        month: [
            { window: "year", labelKey: "stats.chartYear" },
            { window: "fiveYears", labelKey: "stats.chartFiveYears" },
        ],
        year: [
            { window: "fiveYears", labelKey: "stats.chartFiveYears" },
            { window: "tenYears", labelKey: "stats.chartTenYears" },
        ],
    };

    statsRows(stats: HistoryStats): Array<{ labelKey: TranslationKey; stats: HistoryPeriodStats }> {
        return [
            { labelKey: "stats.thisWeek", stats: stats.week },
            { labelKey: "stats.thisMonth", stats: stats.month },
            { labelKey: "stats.thisYear", stats: stats.year },
        ];
    }

    formatDuration(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    formatCompactDuration(totalSeconds: number): string {
        const totalMinutes = Math.round(totalSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours === 0) return `${minutes}m`;
        return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
    }

    selectUnit(unit: HistoryChartUnit): void {
        const chart = this.stats()?.chart;
        if (chart?.unit !== unit) {
            this.chartChange.emit({
                unit,
                window: this.chartWindows[unit][0].window,
                anchor: chart?.anchor,
            });
        }
    }

    selectWindow(window: HistoryChartWindow): void {
        const chart = this.stats()?.chart;
        if (chart && chart.window !== window) {
            this.chartChange.emit({ unit: chart.unit, window, anchor: chart.anchor });
        }
    }

    windowsFor(unit: HistoryChartUnit) {
        return this.chartWindows[unit];
    }

    navigate(chart: HistoryChart, anchor: string | null): void {
        if (anchor) {
            this.chartChange.emit({ unit: chart.unit, window: chart.window, anchor });
        }
    }

    showPointTooltip(event: PointerEvent, point: HistoryChartPoint): void {
        if (this.pointTooltip()?.pinned) return;
        this.pointTooltip.set(this.tooltipAt(event, point, false));
    }

    hidePointTooltip(): void {
        if (!this.pointTooltip()?.pinned) this.pointTooltip.set(null);
    }

    pinPointTooltip(event: PointerEvent, point: HistoryChartPoint): void {
        event.stopPropagation();
        const tooltip = this.pointTooltip();
        this.pointTooltip.set(
            tooltip?.pinned && tooltip.point.from === point.from
                ? null
                : this.tooltipAt(event, point, true),
        );
    }

    @HostListener("document:click")
    closePointTooltip(): void {
        this.pointTooltip.set(null);
    }

    formatChartRange(chart: HistoryChart): string {
        const from = this.formatDate(chart.from, { day: "numeric", month: "short" });
        const to = this.formatDate(addDays(chart.from, chart.dayCount - 1), {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        return `${from} - ${to}`;
    }

    formatPointLabel(from: string, range: HistoryChartUnit): string {
        if (range === "year") return from.slice(0, 4);
        if (range === "month") return this.formatDate(from, { month: "short" });
        if (range === "day") return this.formatDate(from, { weekday: "short" });
        return this.formatDate(from, { day: "numeric", month: "short" });
    }

    fullPointDate(point: HistoryChartPoint): string {
        const from = this.formatDate(point.from, {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        if (point.dayCount === 1) return from;
        const to = this.formatDate(addDays(point.from, point.dayCount - 1), {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        return `${from} - ${to}`;
    }

    maxSeconds(points: HistoryChartPoint[]): number {
        return Math.max(0, ...points.map((item) => item.totalSeconds));
    }

    barHeight(totalSeconds: number, points: HistoryChartPoint[]): number {
        const maximum = this.maxSeconds(points);
        return maximum === 0 ? 0 : Math.max(3, (totalSeconds / maximum) * 100);
    }

    barWidth(unit: HistoryChartUnit): string {
        return unit === "day" ? "w-10 sm:w-12" : "w-12 sm:w-16";
    }

    chartAriaLabel(chart: HistoryChart): string {
        const values = chart.points
            .map(
                (item) =>
                    `${this.formatPointLabel(item.from, item.range)} ${this.formatCompactDuration(item.totalSeconds)}`,
            )
            .join(", ");
        return `${this.i18n.t("stats.chartAria")}: ${values}`;
    }

    private formatDate(day: string, options: Intl.DateTimeFormatOptions): string {
        return new Intl.DateTimeFormat(this.i18n.dateLocale(), {
            ...options,
            timeZone: "UTC",
        }).format(new Date(`${day}T00:00:00.000Z`));
    }

    private tooltipAt(event: PointerEvent, point: HistoryChartPoint, pinned: boolean) {
        return {
            point,
            x: Math.min(event.clientX + 12, window.innerWidth - 204),
            y: Math.min(event.clientY + 12, window.innerHeight - 84),
            pinned,
        };
    }
}

function addDays(day: string, count: number): string {
    const date = new Date(`${day}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + count);
    return date.toISOString().slice(0, 10);
}
