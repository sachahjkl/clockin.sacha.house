import { Injectable, inject, signal } from "@angular/core";
import { finalize } from "rxjs";
import { Router } from "@angular/router";
import { AuthClient } from "./auth.client";
import { I18nService } from "./i18n.service";

const STORAGE_KEY = "clockin_user_id";
const WELCOME_WIZARD_STORAGE_KEY = "clockin_pending_welcome_wizard";

@Injectable({
    providedIn: "root",
})
export class AccountService {
    private readonly authClient = inject(AuthClient);
    private readonly router = inject(Router);
    private readonly i18n = inject(I18nService);
    readonly userId = signal<string | null>(null);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly welcomeWizardOpen = signal(false);

    constructor() {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) this.userId.set(stored);
            this.welcomeWizardOpen.set(
                localStorage.getItem(WELCOME_WIZARD_STORAGE_KEY) === "1" && !!stored,
            );
        }
    }

    create(): void {
        this.loading.set(true);
        this.error.set(null);
        this.authClient
            .createAccount()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => {
                    this.setUserId(data.userId);
                    this.openWelcomeWizard();
                    void this.router.navigate(["/clockin"]);
                },
                error: (error: unknown) => {
                    this.error.set(this.messageForError(error));
                },
            });
    }

    recover(id: string): void {
        if (!id.trim()) return;
        this.loading.set(true);
        this.error.set(null);
        this.authClient
            .verifyAccount(id.trim())
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: () => {
                    this.setUserId(id.trim());
                    void this.router.navigate(["/clockin"]);
                },
                error: (error: unknown) => {
                    this.error.set(this.messageForError(error));
                },
            });
    }

    clear(): void {
        this.setUserId(null);
        this.welcomeWizardOpen.set(false);
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem(WELCOME_WIZARD_STORAGE_KEY);
        }
    }

    dismissWelcomeWizard(): void {
        this.welcomeWizardOpen.set(false);
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem(WELCOME_WIZARD_STORAGE_KEY);
        }
    }

    showHelp(): void {
        if (this.userId()) {
            this.welcomeWizardOpen.set(true);
            if (typeof localStorage !== "undefined") {
                localStorage.setItem(WELCOME_WIZARD_STORAGE_KEY, "1");
            }
        } else {
            void this.router.navigate(["/connect"]);
        }
    }

    private openWelcomeWizard(): void {
        this.welcomeWizardOpen.set(true);
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(WELCOME_WIZARD_STORAGE_KEY, "1");
        }
    }

    private setUserId(id: string | null): void {
        this.userId.set(id);
        if (typeof localStorage === "undefined") {
            return;
        }

        if (id === null) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(STORAGE_KEY, id);
        }
    }

    private messageForError(error: unknown): string {
        return error instanceof Error ? error.message : this.i18n.t("errors.requestFailed");
    }
}
