import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { I18nService, type Language } from "../core/i18n.service";

@Component({
    selector: "app-footer",
    standalone: true,
    imports: [RouterLink],
    template: `
        <footer class="mx-auto mt-8 w-full max-w-5xl space-y-4 px-4 pb-6 text-sm text-slate-500">
            <div class="flex flex-wrap items-center justify-center gap-2">
                <a routerLink="/legal" class="transition hover:text-sky-700 hover:underline">{{
                    i18n.t("app.legal")
                }}</a>
                <span aria-hidden="true">•</span>
                <a routerLink="/privacy" class="transition hover:text-sky-700 hover:underline">{{
                    i18n.t("app.privacy")
                }}</a>
                <span aria-hidden="true">•</span>
                <a routerLink="/cookies" class="transition hover:text-sky-700 hover:underline">{{
                    i18n.t("app.cookies")
                }}</a>
                <span aria-hidden="true">•</span>
                <a routerLink="/about" class="transition hover:text-sky-700 hover:underline">{{
                    i18n.t("app.about")
                }}</a>
            </div>

            <div
                class="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row"
            >
                <p>Clock-in © {{ year() }}</p>
                <label class="flex items-center gap-2 font-medium text-slate-600">
                    <span>{{ i18n.t("app.language") }}</span>
                    <select
                        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        [value]="i18n.language()"
                        (change)="setLanguage($any($event.target).value)"
                    >
                        <option value="fr">{{ i18n.t("app.french") }}</option>
                        <option value="en">{{ i18n.t("app.english") }}</option>
                    </select>
                </label>
            </div>
        </footer>
    `,
})
export class FooterComponent {
    protected readonly i18n = inject(I18nService);
    protected readonly year = computed(() => new Date().getFullYear());

    protected setLanguage(language: Language): void {
        this.i18n.setLanguage(language);
    }
}