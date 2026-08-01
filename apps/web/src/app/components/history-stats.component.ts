import { Component, HostListener, inject, input, output, signal } from "@angular/core";
import { I18nService, type TranslationKey } from "../core/i18n.service";
import type {
    HistoryChart,
    HistoryChartPeriod,
    HistoryChartPoint,
    HistoryChartRequest,
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
                            @for (option of chartPeriods; track option.period) {
                                <button
                                    type="button"
                                    class="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:cursor-wait"
                                    [class.bg-white]="currentStats.chart.period === option.period"
                                    [class.text-indigo-700]="currentStats.chart.period === option.period"
                                    [class.shadow-sm]="currentStats.chart.period === option.period"
                                    [class.text-slate-500]="currentStats.chart.period !== option.period"
                                    [disabled]="pending()"
                                    [attr.aria-pressed]="currentStats.chart.period === option.period"
                                    (click)="selectPeriod(option.period)"
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
                                track item.key;
                                let first = $first;
                                let last = $last
                            ) {
                                <button
                                    type="button"
                                    class="group relative flex h-full cursor-pointer flex-col justify-end focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                    [class]="barWidth(currentStats.chart.period)"
                                    [attr.aria-label]="
                                        fullPointDate(item.key, currentStats.chart.period) +
                                        ', ' +
                                        formatDuration(item.totalSeconds)
                                    "
                                    (click)="togglePoint($event, item.key)"
                                >
                                    <span
                                        class="pointer-events-none invisible absolute top-0 z-20 w-44 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium normal-case text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100"
                                        [class.left-0]="first"
                                        [class.right-0]="last"
                                        [class.left-1/2]="!first && !last"
                                        [class.-translate-x-1/2]="!first && !last"
                                        [class.!visible]="selectedPointKey() === item.key"
                                        [class.!opacity-100]="selectedPointKey() === item.key"
                                    >
                                        <span class="block font-bold">
                                            {{ fullPointDate(item.key, currentStats.chart.period) }}
                                        </span>
                                        <span class="mt-1 block text-slate-300">
                                            {{ formatDuration(item.totalSeconds) }} ·
                                            {{ i18n.t("stats.chartTarget") }}
                                            {{ formatCompactDuration(item.targetSeconds) }}
                                        </span>
                                    </span>
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
                                        {{ formatPointLabel(item.key, currentStats.chart.period) }}
                                    </span>
                                </button>
                            }
                        </div>
                    </div>
                </div>
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
    readonly selectedPointKey = signal<string | null>(null);
    protected readonly heatColorHsl = heatColorHsl;
    protected readonly heatColorOklch = heatColorOklch;
    readonly chartPeriods: Array<{ period: HistoryChartPeriod; labelKey: TranslationKey }> = [
        { period: "week", labelKey: "stats.chartWeek" },
        { period: "month", labelKey: "stats.chartMonth" },
        { period: "year", labelKey: "stats.chartYear" },
    ];

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

    selectPeriod(period: HistoryChartPeriod): void {
        if (this.stats()?.chart.period !== period) {
            this.chartChange.emit({ period, anchor: this.stats()?.chart.anchor });
        }
    }

    navigate(chart: HistoryChart, anchor: string | null): void {
        if (anchor) {
            this.chartChange.emit({ period: chart.period, anchor });
        }
    }

    togglePoint(event: Event, key: string): void {
        event.stopPropagation();
        this.selectedPointKey.update((selected) => (selected === key ? null : key));
    }

    @HostListener("document:click")
    closePointTooltip(): void {
        this.selectedPointKey.set(null);
    }

    formatChartRange(chart: HistoryChart): string {
        if (chart.period === "year") {
            return chart.from.slice(0, 4);
        }
        if (chart.period === "month") {
            return this.formatDate(chart.from, { month: "long", year: "numeric" });
        }
        const from = this.formatDate(chart.from, { day: "numeric", month: "short" });
        const to = this.formatDate(chart.to, { day: "numeric", month: "short", year: "numeric" });
        return `${from} - ${to}`;
    }

    formatPointLabel(key: string, period: HistoryChartPeriod): string {
        if (period === "year") {
            return this.formatDate(`${key}-01`, { month: "short" });
        }
        if (period === "week") {
            return this.formatDate(key, { weekday: "short" });
        }
        return this.formatDate(key, { day: "numeric" });
    }

    fullPointDate(key: string, period: HistoryChartPeriod): string {
        if (period === "year") {
            return this.formatDate(`${key}-01`, { month: "long", year: "numeric" });
        }
        return this.formatDate(key, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    maxSeconds(points: HistoryChartPoint[]): number {
        return Math.max(0, ...points.map((item) => item.totalSeconds));
    }

    barHeight(totalSeconds: number, points: HistoryChartPoint[]): number {
        const maximum = this.maxSeconds(points);
        return maximum === 0 ? 0 : Math.max(3, (totalSeconds / maximum) * 100);
    }

    barWidth(period: HistoryChartPeriod): string {
        return period === "month" ? "w-7 sm:w-8" : "w-12 sm:w-16";
    }

    chartAriaLabel(chart: HistoryChart): string {
        const values = chart.points
            .map(
                (item) =>
                    `${this.formatPointLabel(item.key, chart.period)} ${this.formatCompactDuration(item.totalSeconds)}`,
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
}
