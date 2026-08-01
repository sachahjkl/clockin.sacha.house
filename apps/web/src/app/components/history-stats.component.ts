import { Component, inject, input } from "@angular/core";
import { I18nService, type TranslationKey } from "../core/i18n.service";
import type { HistoryMonthlyStats, HistoryPeriodStats, HistoryStats } from "../core/models";

@Component({
    selector: "app-history-stats",
    standalone: true,
    host: { class: "block" },
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
                            {{ formatCompactDuration(maxMonthlySeconds(currentStats.monthly)) }}
                        </span>
                    </div>

                    <div
                        class="mt-5 overflow-x-auto pb-1"
                        role="img"
                        [attr.aria-label]="chartAriaLabel(currentStats.monthly)"
                    >
                        <div
                            class="flex h-56 min-w-max items-end gap-2 border-b border-slate-200 px-1 sm:gap-3"
                        >
                            @for (item of currentStats.monthly; track item.month) {
                                <div class="flex h-full w-12 flex-col justify-end sm:w-16">
                                    <span
                                        class="mb-2 text-center text-xs font-semibold text-slate-600"
                                    >
                                        {{ formatCompactDuration(item.totalSeconds) }}
                                    </span>
                                    <div
                                        class="flex h-40 items-end rounded-t-lg bg-slate-100 px-1.5 sm:px-2"
                                    >
                                        <div
                                            class="w-full min-h-1 rounded-t-md bg-gradient-to-t from-indigo-600 to-sky-400"
                                            [style.height.%]="
                                                barHeight(item.totalSeconds, currentStats.monthly)
                                            "
                                            [attr.title]="
                                                formatMonth(item.month) +
                                                ' : ' +
                                                formatDuration(item.totalSeconds)
                                            "
                                        ></div>
                                    </div>
                                    <span
                                        class="py-2 text-center text-xs font-medium capitalize text-slate-500"
                                    >
                                        {{ formatMonth(item.month) }}
                                    </span>
                                </div>
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
        const hours = Math.round(totalSeconds / 3600);
        return `${hours}h`;
    }

    formatMonth(month: string): string {
        return new Intl.DateTimeFormat(this.i18n.dateLocale(), { month: "short" }).format(
            new Date(`${month}-01T00:00:00`),
        );
    }

    maxMonthlySeconds(months: HistoryMonthlyStats[]): number {
        return Math.max(0, ...months.map((item) => item.totalSeconds));
    }

    barHeight(totalSeconds: number, months: HistoryMonthlyStats[]): number {
        const maximum = this.maxMonthlySeconds(months);
        return maximum === 0 ? 0 : Math.max(3, (totalSeconds / maximum) * 100);
    }

    chartAriaLabel(months: HistoryMonthlyStats[]): string {
        const values = months
            .map(
                (item) =>
                    `${this.formatMonth(item.month)} ${this.formatCompactDuration(item.totalSeconds)}`,
            )
            .join(", ");
        return `${this.i18n.t("stats.chartAria")}: ${values}`;
    }
}
