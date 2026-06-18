import { Component, inject, signal } from "@angular/core";
import { FormField, form, required } from "@angular/forms/signals";
import { AccountService } from "../../core/account.service";
import { I18nService } from "../../core/i18n.service";

@Component({
    selector: "app-connect",
    standalone: true,
    imports: [FormField],
    template: `
        <article class="mx-auto my-3 max-w-2xl space-y-6">
            <div class="space-y-2">
                <h1 class="text-2xl font-bold">{{ i18n.t("app.connect") }}</h1>
                <p class="text-slate-600">
                    {{ i18n.t("account.help") }} <strong>{{ i18n.t("account.keepId") }}</strong>
                </p>
            </div>

            @if (account.error()) {
                <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm">{{ account.error() }}</div>
            }

            <fieldset class="grid grid-cols-1 gap-6 rounded border p-5 shadow-sm">
                <legend class="px-2 text-xl font-bold">{{ i18n.t("account.access") }}</legend>

                <div class="space-y-3">
                    <span class="block text-sm font-medium text-slate-700">{{ i18n.t("account.createAccess") }}</span>
                    <button class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-emerald-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" [disabled]="account.loading()" (click)="account.create()">
                        @if (account.loading()) {
                            {{ i18n.t("account.creating") }}
                        } @else {
                            {{ i18n.t("account.create") }}
                        }
                    </button>
                </div>

                <form class="space-y-3">
                    <label class="block text-sm font-medium text-slate-700">{{ i18n.t("account.recoverAccess") }}</label>
                    <div class="flex flex-col gap-2 sm:flex-row">
                        <input
                            type="password"
                            id="identifiant"
                            autocomplete="current-password"
                            class="block w-full rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
                            [formField]="recoverAccountForm.recoverId"
                            [placeholder]="i18n.t('account.pasteId')"
                        />
                        <button class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-emerald-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50" (click)="recover()" [disabled]="recoverAccountForm.recoverId().invalid()">{{ i18n.t("account.recover") }}</button>
                    </div>
                    @if (recoverAccountForm.recoverId().touched() && recoverAccountForm.recoverId().invalid()) {
                        <p class="text-sm text-rose-600">{{ i18n.t("account.requiredId") }}</p>
                    }
                </form>
            </fieldset>
        </article>
    `,
})
export class ConnectComponent {
    protected readonly account = inject(AccountService);
    protected readonly i18n = inject(I18nService);
    readonly recoverAccountModel = signal({ recoverId: "" });
    readonly recoverAccountForm = form(this.recoverAccountModel, (schema) => {
        required(schema.recoverId, { message: this.i18n.t("account.requiredId") });
    });

    recover(): void {
        this.account.recover(this.recoverAccountModel().recoverId);
    }
}