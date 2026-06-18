import { Component, inject, input, linkedSignal, signal } from "@angular/core";
import { finalize } from "rxjs";
import { Router } from "@angular/router";
import { CopyableIdComponent } from "../../components/copyable-id.component";
import { AccountService } from "../../core/account.service";
import { I18nService } from "../../core/i18n.service";
import type { User } from "../../core/models";
import { ProfileClient } from "../../core/profile.client";

@Component({
    selector: "app-account",
    standalone: true,
    imports: [CopyableIdComponent],
    template: `
        <article class="mx-auto my-3 max-w-2xl space-y-6">
            <div class="space-y-2">
                <h1 class="text-2xl font-bold">{{ i18n.t("app.account") }}</h1>
                <p class="text-slate-600">{{ i18n.t("account.manageHelp") }}</p>
            </div>

            @if (error()) {
                <div
                    class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm"
                >
                    {{ error() }}
                </div>
            }

            <section class="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <h2 class="text-lg font-bold text-slate-900">{{ i18n.t("account.identifier") }}</h2>
                @if (account.userId()) {
                    <div class="mt-3">
                        <app-copyable-id [id]="account.userId()!" />
                    </div>
                }
            </section>

            <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 class="text-lg font-bold text-slate-900">
                    {{ i18n.t("account.profileTitle") }}
                </h2>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                    {{ i18n.t("account.profileHelp") }}
                </p>

                @if (success()) {
                    <p class="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {{ success() }}
                    </p>
                }

                <form class="mt-4 grid gap-4" (submit)="saveProfile($event)">
                    <label class="block text-sm font-medium text-slate-700">
                        {{ i18n.t("account.name") }}
                        <input
                            type="text"
                            autocomplete="name"
                            class="mt-1 block w-full rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
                            [value]="name()"
                            [placeholder]="i18n.t('account.namePlaceholder')"
                            (input)="name.set($any($event.target).value); success.set(null)"
                        />
                    </label>

                    <label class="block text-sm font-medium text-slate-700">
                        {{ i18n.t("account.email") }}
                        <input
                            type="email"
                            autocomplete="email"
                            class="mt-1 block w-full rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
                            [value]="email()"
                            [placeholder]="i18n.t('account.emailPlaceholder')"
                            (input)="email.set($any($event.target).value); success.set(null)"
                        />
                    </label>

                    <button
                        type="submit"
                        class="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        [disabled]="profilePending()"
                    >
                        {{
                            profilePending()
                                ? i18n.t("account.savingProfile")
                                : i18n.t("account.saveProfile")
                        }}
                    </button>
                </form>
            </section>

            <section class="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <h2 class="text-lg font-bold text-rose-900">{{ i18n.t("account.deleteTitle") }}</h2>
                <p class="mt-2 text-sm leading-6 text-rose-800">
                    {{ i18n.t("account.deleteHelp") }}
                </p>
                <button
                    type="button"
                    class="mt-4 inline-flex cursor-pointer items-center justify-center rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    [disabled]="deletePending()"
                    (click)="deleteAccount()"
                >
                    {{
                        deletePending()
                            ? i18n.t("account.deleting")
                            : i18n.t("account.deleteAction")
                    }}
                </button>
            </section>
        </article>
    `,
})
export class AccountComponent {
    private readonly profileClient = inject(ProfileClient);
    protected readonly account = inject(AccountService);
    protected readonly i18n = inject(I18nService);
    private readonly router = inject(Router);
    protected readonly resolvedProfile = input.required<User>({ alias: "profile" });
    protected readonly error = signal<string | null>(null);
    protected readonly success = signal<string | null>(null);
    protected readonly name = linkedSignal(() => this.resolvedProfile().name ?? "");
    protected readonly email = linkedSignal(() => this.resolvedProfile().email ?? "");
    protected readonly profilePending = signal(false);
    protected readonly deletePending = signal(false);

    saveProfile(event: SubmitEvent): void {
        event.preventDefault();

        this.profilePending.set(true);
        this.error.set(null);
        this.success.set(null);
        this.profileClient
            .update({ name: this.name(), email: this.email() })
            .pipe(finalize(() => this.profilePending.set(false)))
            .subscribe({
                next: (profile) => {
                    this.applyProfile(profile);
                    this.success.set(this.i18n.t("account.profileSaved"));
                },
                error: (error: unknown) => {
                    this.error.set(errorMessage(error, this.i18n));
                },
            });
    }

    deleteAccount(): void {
        if (!confirm(this.i18n.t("account.deleteConfirm"))) return;

        this.deletePending.set(true);
        this.error.set(null);
        this.profileClient
            .delete()
            .pipe(finalize(() => this.deletePending.set(false)))
            .subscribe({
                next: () => {
                    this.account.clear();
                    void this.router.navigate(["/connect"]);
                },
                error: (error: unknown) => {
                    this.error.set(errorMessage(error, this.i18n));
                },
            });
    }

    private applyProfile(profile: User): void {
        this.name.set(profile.name ?? "");
        this.email.set(profile.email ?? "");
    }
}

function errorMessage(error: unknown, i18n: I18nService): string {
    return error instanceof Error ? error.message : i18n.t("errors.requestFailed");
}
