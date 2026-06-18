import { Component, inject, input, output, signal } from "@angular/core";
import { CopyableIdComponent } from "./copyable-id.component";
import { I18nService } from "../core/i18n.service";

@Component({
    selector: "app-welcome-wizard",
    standalone: true,
    imports: [CopyableIdComponent],
    template: `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <section class="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                            {{ i18n.t("wizard.eyebrow") }}
                        </p>
                        <h2 class="mt-1 text-2xl font-bold text-slate-900">
                            {{ i18n.t(steps[step()].titleKey) }}
                        </h2>
                    </div>
                    <p
                        class="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600"
                    >
                        {{ step() + 1 }}/{{ steps.length }}
                    </p>
                </div>

                <p class="mt-4 text-base leading-7 text-slate-700">
                    {{ i18n.t(steps[step()].bodyKey) }}
                </p>

                @if (step() === 1) {
                    <div
                        class="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-slate-800"
                    >
                        <p class="text-sm font-semibold">{{ i18n.t("wizard.idTitle") }}</p>
                        <div class="mt-3">
                            <app-copyable-id [id]="userId()" />
                        </div>
                        <p class="mt-2 text-sm text-slate-600">{{ i18n.t("wizard.idHelp") }}</p>
                    </div>
                }

                @if (step() === 2) {
                    <div
                        class="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-3"
                    >
                        <div class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                            {{ i18n.t("wizard.tip1") }}
                        </div>
                        <div class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                            {{ i18n.t("wizard.tip2") }}
                        </div>
                        <div class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                            {{ i18n.t("wizard.tip3") }}
                        </div>
                    </div>
                }

                <div
                    class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                    <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        [disabled]="step() === 0"
                        (click)="previous()"
                    >
                        {{ i18n.t("wizard.previous") }}
                    </button>

                    <div class="flex gap-2 self-end sm:self-auto">
                        <button
                            type="button"
                            class="inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-100"
                            (click)="close.emit()"
                        >
                            {{ i18n.t("wizard.close") }}
                        </button>
                        <button
                            type="button"
                            class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700"
                            (click)="next()"
                        >
                            {{
                                step() === steps.length - 1
                                    ? i18n.t("wizard.start")
                                    : i18n.t("wizard.next")
                            }}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    `,
})
export class WelcomeWizardComponent {
    protected readonly i18n = inject(I18nService);
    readonly userId = input.required<string>();
    readonly close = output<void>();
    protected readonly step = signal(0);
    protected readonly steps = [
        { titleKey: "wizard.step1Title", bodyKey: "wizard.step1Body" },
        { titleKey: "wizard.step2Title", bodyKey: "wizard.step2Body" },
        { titleKey: "wizard.step3Title", bodyKey: "wizard.step3Body" },
    ] as const;

    protected previous(): void {
        this.step.update((step) => Math.max(0, step - 1));
    }

    protected next(): void {
        if (this.step() === this.steps.length - 1) {
            this.close.emit();
            return;
        }

        this.step.update((step) => step + 1);
    }
}