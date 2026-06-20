import { Component, inject, input } from "@angular/core";
import { I18nService, type TranslationKey } from "../core/i18n.service";
import type { HistoryPeriodStats, HistoryStats } from "../core/models";

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
}
