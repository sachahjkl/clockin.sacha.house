import { Component, inject, input, output } from "@angular/core";
import { I18nService, type TranslationKey } from "../core/i18n.service";

export interface HistoryExportPresetOption {
    id: string;
    labelKey: TranslationKey;
}

export interface HistoryExportRange {
    from: string;
    to: string;
}

@Component({
    selector: "app-history-export-panel",
    standalone: true,
    host: { class: "block" },
    template: `
        <section class="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
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
                            [value]="preset()"
                            (change)="presetChange.emit($any($event.target).value)"
                        >
                            @for (item of presets(); track item.id) {
                                <option [value]="item.id">
                                    {{ i18n.t(item.labelKey) }}
                                </option>
                            }
                        </select>
                    </label>

                    <label class="block text-sm font-medium text-slate-700">
                        {{ i18n.t("history.from") }}
                        <input
                            type="date"
                            class="mt-1 block w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
                            [value]="range().from"
                            (input)="fromChange.emit($any($event.target).value)"
                        />
                    </label>

                    <label class="block text-sm font-medium text-slate-700">
                        {{ i18n.t("history.to") }}
                        <input
                            type="date"
                            class="mt-1 block w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
                            [value]="range().to"
                            (input)="toChange.emit($any($event.target).value)"
                        />
                    </label>
                </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-6 gap-y-4">
                <section class="flex flex-wrap gap-4">
                    <button
                        type="button"
                        class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-emerald-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        [disabled]="pending() || invalid()"
                        (click)="exportCsv.emit()"
                    >
                        {{ i18n.t("history.exportCsv") }}
                    </button>
                    <button
                        type="button"
                        class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:from-blue-500 hover:to-blue-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        [disabled]="pending() || invalid()"
                        (click)="exportXlsx.emit()"
                    >
                        {{ i18n.t("history.exportXlsx") }}
                    </button>
                </section>
                <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        class="h-5 w-5 cursor-pointer rounded border-slate-400 accent-sky-600"
                        [checked]="iso()"
                        (change)="isoChange.emit(($any($event.target).checked))"
                    />
                    {{ i18n.t("history.exportIso") }}
                </label>

                @if (pending()) {
                    <span class="text-sm text-slate-500">{{ i18n.t("history.exportPending") }}</span>
                }
            </div>

            @if (invalid()) {
                <p class="mt-3 text-sm text-rose-600">{{ i18n.t("history.invalidRange") }}</p>
            }

            @if (error()) {
                <p class="mt-3 text-sm text-rose-600">{{ error() }}</p>
            }
        </section>
    `,
})
export class HistoryExportPanelComponent {
    protected readonly i18n = inject(I18nService);
    presets = input.required<HistoryExportPresetOption[]>();
    preset = input.required<string>();
    range = input.required<HistoryExportRange>();
    pending = input(false);
    invalid = input(false);
    iso = input(false);
    error = input<string | null>(null);

    presetChange = output<string>();
    fromChange = output<string>();
    toChange = output<string>();
    isoChange = output<boolean>();
    exportCsv = output<void>();
    exportXlsx = output<void>();
}
