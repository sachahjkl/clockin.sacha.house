import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { debounced } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { catchError, map, of, startWith } from "rxjs";
import { AccountService } from "../../core/account.service";
import { AuthClient } from "../../core/auth.client";
import { I18nService } from "../../core/i18n.service";

interface RecoverModel {
    recoverId: string;
}

type IdStatus = "idle" | "checking" | "valid" | "invalid";

interface VerifyParams {
    userId: string;
}

interface VerifyState {
    status: IdStatus;
    error: string | null;
}

@Component({
    selector: "app-connect",
    standalone: true,
    imports: [FormField],
    styles: [
        `
            .connect-brand-gradient {
                background-image: linear-gradient(to top right, #60a5fa, #2563eb);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }
        `,
    ],
    template: `
        <article class="min-h-[calc(100vh-96px)] px-4 py-8 sm:px-6 sm:py-10">
            <div class="mx-auto max-w-6xl">
                <section class="relative overflow-hidden px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
                    <div class="mx-auto max-w-3xl space-y-6">
                        <h1 class="text-center text-6xl font-black tracking-tight drop-shadow-[0_4px_0_rgba(255,255,255,0.9)] sm:text-7xl lg:text-8xl">
                            <span class="connect-brand-gradient inline-block w-[9ch]">Clock-in</span>
                        </h1>
                        <p class="-mt-2 text-center text-base font-medium italic text-slate-600 sm:text-lg">
                            Votre badgeuse, rien de plus
                        </p>

                        <div class="rounded-[1.75rem] border border-slate-200 bg-white p-5 text-slate-900 shadow-sm sm:p-6">
                            <div class="space-y-1 text-center">
                                <h2 class="text-2xl font-bold text-slate-900">
                                    Ouvre un accès instantané.
                                </h2>
                            </div>

                            <div class="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                                <button
                                    class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-emerald-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                    [disabled]="account.loading()"
                                    (click)="account.create()"
                                >
                                    @if (account.loading()) {
                                        {{ i18n.t("account.creating") }}
                                    } @else {
                                        {{ i18n.t("account.create") }}
                                    }
                                </button>
                                <button
                                    type="button"
                                    class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-400 to-violet-500 px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:from-violet-500 hover:to-violet-600 hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                    [disabled]="account.loading()"
                                    (click)="tryDemo()"
                                >
                                    {{ i18n.t("account.tryDemo") }}
                                </button>
                            </div>
                        </div>

                        <div class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div class="space-y-1">
                                <h2 class="text-2xl font-bold text-slate-900">
                                    {{ i18n.t("account.recoverAccess") }}
                                </h2>
                            </div>

                            <form class="mt-5 flex flex-col gap-2 sm:flex-row" (submit)="onSubmit($event)">
                                <input
                                    type="password"
                                    id="identifiant"
                                    autocomplete="current-password"
                                    class="block w-full rounded-xl border px-3 py-2.5 text-slate-900 outline-none transition focus:ring-0"
                                    [class.border-transparent]="!recoverForm.recoverId().touched() || recoverForm.recoverId().valid()"
                                    [class.border-rose-300]="recoverForm.recoverId().touched() && recoverForm.recoverId().invalid()"
                                    [class.bg-rose-50]="recoverForm.recoverId().touched() && recoverForm.recoverId().invalid()"
                                    [class.bg-slate-100]="!recoverForm.recoverId().touched() || recoverForm.recoverId().valid()"
                                    [class.focus:border-slate-300]="!recoverForm.recoverId().touched() || recoverForm.recoverId().valid()"
                                    [class.focus:border-rose-300]="recoverForm.recoverId().touched() && recoverForm.recoverId().invalid()"
                                    [formField]="recoverForm.recoverId"
                                    [placeholder]="i18n.t('account.pasteId')"
                                />
                                <button type="submit"
                                    class="text-center basis-[30%] rounded-xl bg-gradient-to-r px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:outline hover:outline-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    [class.from-emerald-400]="idStatus() === 'valid'"
                                    [class.to-emerald-500]="idStatus() === 'valid'"
                                    [class.hover:from-emerald-500]="idStatus() === 'valid'"
                                    [class.hover:to-emerald-600]="idStatus() === 'valid'"
                                    [class.from-sky-400]="idStatus() !== 'valid'"
                                    [class.to-sky-500]="idStatus() !== 'valid'"
                                    [class.hover:from-sky-500]="idStatus() !== 'valid'"
                                    [class.hover:to-sky-600]="idStatus() !== 'valid'"
                                    [disabled]="idStatus() !== 'valid' || account.loading()"
                                >
                                    @if (idStatus() === 'checking') {
                                        {{ i18n.t("account.recovering") }}
                                    } @else if (idStatus() === 'valid') {
                                        ✓ {{ i18n.t("account.recover") }}
                                    } @else {
                                        {{ i18n.t("account.recover") }}
                                    }
                                </button>
                            </form>
                            @if (idStatus() === 'invalid' && idError()) {
                                <p class="mt-3 text-sm text-rose-600">{{ idError() }}</p>
                            }
                        </div>
                    </div>
                </section>

                @if (account.error()) {
                    <div class="mx-auto mt-6 max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm">
                        {{ account.error() }}
                    </div>
                }
            </div>
        </article>
    `,
})
export class ConnectComponent {
    private readonly authClient = inject(AuthClient);
    protected readonly account = inject(AccountService);
    protected readonly i18n = inject(I18nService);

    private readonly recoverModel = signal<RecoverModel>({ recoverId: "" });
    readonly recoverForm = form(this.recoverModel, (schema) => {
        required(schema.recoverId, { message: this.i18n.t("account.requiredId") });
    });

    private readonly debouncedId = debounced(() => this.recoverForm.recoverId().value(), 150);
    private readonly verifyResource = rxResource<VerifyState, VerifyParams | undefined>({
        params: () => verifyParams(this.debouncedId.value()),
        stream: ({ params }) => {
            if (!params?.userId) {
                return of(idleVerifyState());
            }

            return this.authClient.verifyAccount(params.userId).pipe(
                map(() => validVerifyState()),
                startWith(checkingVerifyState()),
                catchError((error: unknown) =>
                    of(invalidVerifyState(error, this.i18n.t("errors.requestFailed"))),
                ),
            );
        },
    });
    readonly idStatus = computed(() => this.verifyResource.value()?.status ?? "idle");
    readonly idError = computed(() => this.verifyResource.value()?.error ?? null);

    onSubmit(event: Event): void {
        event.preventDefault();
        this.account.recover(this.recoverModel().recoverId);
    }

    tryDemo(): void {
        this.account.recover("demo");
    }
}

function verifyParams(userId: string | undefined): VerifyParams | undefined {
    const trimmed = userId?.trim();
    return trimmed ? { userId: trimmed } : undefined;
}

function idleVerifyState(): VerifyState {
    return { status: "idle", error: null };
}

function checkingVerifyState(): VerifyState {
    return { status: "checking", error: null };
}

function validVerifyState(): VerifyState {
    return { status: "valid", error: null };
}

function invalidVerifyState(error: unknown, fallback: string): VerifyState {
    return {
        status: "invalid",
        error: error instanceof Error ? error.message : fallback,
    };
}
